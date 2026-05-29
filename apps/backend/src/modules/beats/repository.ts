import { prisma } from './db.js';
import type {
  Beat,
  CreateBeatInput,
  ListBeatsQuery,
  PaginatedBeats,
  ProducerStats,
  GenreRecord,
  LicenseTypeValue,
} from './types.js';

// --- Slug Helpers ---

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function generateUniqueSlug(title: string): Promise<string> {
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let suffix = 1;

  while (true) {
    const existing = await prisma.beat.findUnique({ where: { slug } });
    if (!existing) return slug;
    slug = `${baseSlug}-${suffix}`;
    suffix++;
  }
}

// --- Sort Mapping ---

const SORT_MAP = {
  recent: { createdAt: 'desc' as const },
  popular: { playsCount: 'desc' as const },
  price_asc: { priceCents: 'asc' as const },
  price_desc: { priceCents: 'desc' as const },
};

// --- Repository Operations ---

export async function createBeat(
  data: CreateBeatInput & { audioUrl?: string | null; coverUrl?: string | null; producerId: string },
): Promise<Beat> {
  const slug = await generateUniqueSlug(data.title);
  return prisma.beat.create({
    data: {
      ...data,
      audioUrl: data.audioUrl ?? null,
      coverUrl: data.coverUrl ?? null,
      slug,
    },
  });
}

export async function getBeatById(
  id: string,
  options?: { includeDeleted?: boolean },
): Promise<Beat | null> {
  const where = options?.includeDeleted
    ? { id }
    : { id, deletedAt: null };
  return prisma.beat.findUnique({ where });
}

export async function getBeatBySlug(slug: string): Promise<Beat | null> {
  return prisma.beat.findUnique({ where: { slug, deletedAt: null } });
}

export async function listBeats(query: ListBeatsQuery): Promise<PaginatedBeats> {
  const { page, limit, genre, minPrice, maxPrice, bpmMin, bpmMax, key, q, sort } = query;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { deletedAt: null, status: 'published' };

  if (genre) where.genre = genre;
  if (key) where.key = key;

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.priceCents = {};
    if (minPrice !== undefined) (where.priceCents as Record<string, number>).gte = minPrice;
    if (maxPrice !== undefined) (where.priceCents as Record<string, number>).lte = maxPrice;
  }

  if (bpmMin !== undefined || bpmMax !== undefined) {
    where.bpm = {};
    if (bpmMin !== undefined) (where.bpm as Record<string, number>).gte = bpmMin;
    if (bpmMax !== undefined) (where.bpm as Record<string, number>).lte = bpmMax;
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { tags: { has: q } },
    ];
  }

  const [data, totalItems] = await Promise.all([
    prisma.beat.findMany({
      where,
      orderBy: SORT_MAP[sort],
      skip,
      take: limit,
    }),
    prisma.beat.count({ where }),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      next: page < totalPages ? page + 1 : null,
      prev: page > 1 ? page - 1 : null,
    },
  };
}

export async function updateBeat(id: string, data: Record<string, unknown>): Promise<Beat> {
  return prisma.beat.update({ where: { id }, data });
}

export async function deleteBeat(id: string): Promise<void> {
  await prisma.beat.update({
    where: { id },
    data: { deletedAt: new Date(), status: 'deleted' },
  });
}

export async function getBeatsByProducerId(
  producerId: string,
  options?: { skip?: number; take?: number },
): Promise<Beat[]> {
  return prisma.beat.findMany({
    where: { producerId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    skip: options?.skip ?? 0,
    take: options?.take ?? 20,
  });
}

export async function getGenres(): Promise<GenreRecord[]> {
  return prisma.genre.findMany({ orderBy: { name: 'asc' } });
}

// --- License Repository ---

export async function getLicensesByBeatId(beatId: string): Promise<Array<{
  id: string;
  type: string;
  priceCents: number;
  isActive: boolean;
  createdAt: Date;
  beatId: string;
}>> {
  return prisma.license.findMany({
    where: { beatId },
  });
}

export async function upsertLicense(
  beatId: string,
  type: LicenseTypeValue,
  data: { priceCents: number; isActive?: boolean },
): Promise<{
  id: string;
  type: string;
  priceCents: number;
  isActive: boolean;
  createdAt: Date;
  beatId: string;
}> {
  const isActive = data.isActive ?? true;
  return prisma.license.upsert({
    where: {
      beatId_type: { beatId, type },
    },
    create: {
      type,
      priceCents: data.priceCents,
      isActive,
      beatId,
    },
    update: {
      priceCents: data.priceCents,
      isActive,
    },
  });
}

export async function getProducerStats(producerId: string): Promise<ProducerStats> {
  const beats = await prisma.beat.findMany({
    where: { producerId, deletedAt: null },
    select: { playsCount: true, salesCount: true, priceCents: true },
  });

  return beats.reduce<ProducerStats>(
    (acc, beat) => ({
      totalBeats: acc.totalBeats + 1,
      totalPlays: acc.totalPlays + beat.playsCount,
      totalSales: acc.totalSales + beat.salesCount,
      revenue: acc.revenue + beat.salesCount * beat.priceCents,
    }),
    { totalBeats: 0, totalPlays: 0, totalSales: 0, revenue: 0 },
  );
}
