import { prisma } from './storage.js';
import type { Beat, CreateBeatInput, UpdateBeatInput } from './types.js';

// --- Repository Operations ---

export async function createBeat(data: CreateBeatInput & { audioUrl: string; coverUrl: string; sellerId: string }): Promise<Beat> {
  return prisma.beat.create({ data });
}

export async function getBeatById(id: string): Promise<Beat | null> {
  return prisma.beat.findUnique({ where: { id } });
}

export async function listBeats(options?: { skip?: number; take?: number }): Promise<Beat[]> {
  return prisma.beat.findMany({
    orderBy: { createdAt: 'desc' },
    skip: options?.skip ?? 0,
    take: options?.take ?? 20,
  });
}

export async function updateBeat(id: string, data: UpdateBeatInput): Promise<Beat> {
  return prisma.beat.update({ where: { id }, data });
}

export async function deleteBeat(id: string): Promise<void> {
  await prisma.beat.delete({ where: { id } });
}
