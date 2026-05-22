import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Beat } from '@/modules/beats/types.js';

// vi.hoisted ensures these are available when vi.mock factory runs
const { mockPrismaBeat, mockPrismaGenre } = vi.hoisted(() => ({
  mockPrismaBeat: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  mockPrismaGenre: {
    findMany: vi.fn(),
  },
}));

vi.mock('@/modules/beats/db.js', () => ({
  prisma: { beat: mockPrismaBeat, genre: mockPrismaGenre },
}));

import * as repo from '@/modules/beats/repository.js';

function makeBeat(overrides: Partial<Beat> = {}): Beat {
  return {
    id: 'beat-1',
    title: 'Dark Trap',
    slug: 'dark-trap',
    description: 'Hard 808s',
    priceCents: 2999,
    genre: 'Trap',
    bpm: 140,
    key: 'Cm',
    tags: ['dark'],
    audioUrl: null,
    coverUrl: null,
    previewUrl: null,
    streamUrl: null,
    playsCount: 0,
    salesCount: 0,
    status: 'draft',
    publishedAt: null,
    deletedAt: null,
    producerId: 'producer-1',
    buyerId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('PrismaBeatRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBeat', () => {
    it('should call prisma.beat.create with correct data and generated slug', async () => {
      const expected = makeBeat();
      mockPrismaBeat.findUnique.mockResolvedValue(null); // slug not taken
      mockPrismaBeat.create.mockResolvedValue(expected);

      const result = await repo.createBeat({
        title: 'Dark Trap',
        priceCents: 2999,
        producerId: 'producer-1',
      });

      expect(mockPrismaBeat.create).toHaveBeenCalledWith({
        data: {
          title: 'Dark Trap',
          priceCents: 2999,
          audioUrl: null,
          coverUrl: null,
          producerId: 'producer-1',
          slug: 'dark-trap',
        },
      });
      expect(result).toEqual(expected);
    });

    it('should generate unique slug when title conflicts', async () => {
      const expected = makeBeat({ slug: 'dark-trap-1' });
      mockPrismaBeat.findUnique
        .mockResolvedValueOnce({ id: 'existing' }) // dark-trap taken
        .mockResolvedValueOnce(null); // dark-trap-1 available
      mockPrismaBeat.create.mockResolvedValue(expected);

      const result = await repo.createBeat({
        title: 'Dark Trap',
        priceCents: 2999,
        producerId: 'producer-1',
      });

      expect(result.slug).toBe('dark-trap-1');
    });

    it('should set audioUrl and coverUrl when provided', async () => {
      const expected = makeBeat({ audioUrl: '/beats/audio.mp3', coverUrl: '/beats/cover.jpg' });
      mockPrismaBeat.findUnique.mockResolvedValue(null);
      mockPrismaBeat.create.mockResolvedValue(expected);

      const result = await repo.createBeat({
        title: 'Dark Trap',
        priceCents: 2999,
        audioUrl: '/beats/audio.mp3',
        coverUrl: '/beats/cover.jpg',
        producerId: 'producer-1',
      });

      expect(mockPrismaBeat.create).toHaveBeenCalledWith({
        data: {
          title: 'Dark Trap',
          priceCents: 2999,
          audioUrl: '/beats/audio.mp3',
          coverUrl: '/beats/cover.jpg',
          producerId: 'producer-1',
          slug: 'dark-trap',
        },
      });
      expect(result.audioUrl).toBe('/beats/audio.mp3');
    });
  });

  describe('getBeatById', () => {
    it('should return beat when found (excluding deleted)', async () => {
      const beat = makeBeat();
      mockPrismaBeat.findUnique.mockResolvedValue(beat);

      const result = await repo.getBeatById('beat-1');
      expect(result).toEqual(beat);
      expect(mockPrismaBeat.findUnique).toHaveBeenCalledWith({
        where: { id: 'beat-1', deletedAt: null },
      });
    });

    it('should include deleted beats when option is set', async () => {
      const beat = makeBeat({ deletedAt: new Date() });
      mockPrismaBeat.findUnique.mockResolvedValue(beat);

      const result = await repo.getBeatById('beat-1', { includeDeleted: true });
      expect(result).toEqual(beat);
      expect(mockPrismaBeat.findUnique).toHaveBeenCalledWith({
        where: { id: 'beat-1' },
      });
    });

    it('should return null when not found', async () => {
      mockPrismaBeat.findUnique.mockResolvedValue(null);

      const result = await repo.getBeatById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('listBeats', () => {
    it('should return paginated beats with defaults', async () => {
      const beats = [makeBeat(), makeBeat({ id: 'beat-2', slug: 'boom-bap' })];
      mockPrismaBeat.findMany.mockResolvedValue(beats);
      mockPrismaBeat.count.mockResolvedValue(2);

      const result = await repo.listBeats({
        page: 1,
        limit: 20,
        sort: 'recent',
      });

      expect(mockPrismaBeat.findMany).toHaveBeenCalledWith({
        where: { deletedAt: null, status: 'published' },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(result.data).toHaveLength(2);
      expect(result.pagination.totalItems).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.next).toBeNull();
      expect(result.pagination.prev).toBeNull();
    });

    it('should apply genre filter', async () => {
      mockPrismaBeat.findMany.mockResolvedValue([]);
      mockPrismaBeat.count.mockResolvedValue(0);

      await repo.listBeats({ page: 1, limit: 20, sort: 'recent', genre: 'Trap' });

      expect(mockPrismaBeat.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ genre: 'Trap' }),
        }),
      );
    });

    it('should apply price range filter', async () => {
      mockPrismaBeat.findMany.mockResolvedValue([]);
      mockPrismaBeat.count.mockResolvedValue(0);

      await repo.listBeats({
        page: 1,
        limit: 20,
        sort: 'recent',
        minPrice: 1000,
        maxPrice: 5000,
      });

      expect(mockPrismaBeat.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ priceCents: { gte: 1000, lte: 5000 } }),
        }),
      );
    });

    it('should apply bpm range filter', async () => {
      mockPrismaBeat.findMany.mockResolvedValue([]);
      mockPrismaBeat.count.mockResolvedValue(0);

      await repo.listBeats({
        page: 1,
        limit: 20,
        sort: 'recent',
        bpmMin: 120,
        bpmMax: 160,
      });

      expect(mockPrismaBeat.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ bpm: { gte: 120, lte: 160 } }),
        }),
      );
    });

    it('should apply search query with OR', async () => {
      mockPrismaBeat.findMany.mockResolvedValue([]);
      mockPrismaBeat.count.mockResolvedValue(0);

      await repo.listBeats({ page: 1, limit: 20, sort: 'recent', q: 'dark' });

      expect(mockPrismaBeat.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'dark', mode: 'insensitive' } },
              { tags: { has: 'dark' } },
            ],
          }),
        }),
      );
    });

    it('should apply popular sort', async () => {
      mockPrismaBeat.findMany.mockResolvedValue([]);
      mockPrismaBeat.count.mockResolvedValue(0);

      await repo.listBeats({ page: 1, limit: 20, sort: 'popular' });

      expect(mockPrismaBeat.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { playsCount: 'desc' } }),
      );
    });

    it('should calculate pagination metadata correctly', async () => {
      mockPrismaBeat.findMany.mockResolvedValue([]);
      mockPrismaBeat.count.mockResolvedValue(45);

      const result = await repo.listBeats({ page: 3, limit: 20, sort: 'recent' });

      expect(result.pagination).toEqual({
        page: 3,
        limit: 20,
        totalItems: 45,
        totalPages: 3,
        next: null,
        prev: 2,
      });
    });
  });

  describe('updateBeat', () => {
    it('should call prisma.beat.update with correct params', async () => {
      const updated = makeBeat({ title: 'Updated' });
      mockPrismaBeat.update.mockResolvedValue(updated);

      const result = await repo.updateBeat('beat-1', { title: 'Updated' });

      expect(mockPrismaBeat.update).toHaveBeenCalledWith({
        where: { id: 'beat-1' },
        data: { title: 'Updated' },
      });
      expect(result.title).toBe('Updated');
    });
  });

  describe('deleteBeat', () => {
    it('should soft delete by setting deletedAt and status', async () => {
      mockPrismaBeat.update.mockResolvedValue(makeBeat({ status: 'deleted', deletedAt: new Date() }));

      await repo.deleteBeat('beat-1');

      expect(mockPrismaBeat.update).toHaveBeenCalledWith({
        where: { id: 'beat-1' },
        data: { deletedAt: expect.any(Date), status: 'deleted' },
      });
      expect(mockPrismaBeat.delete).not.toHaveBeenCalled();
    });
  });

  describe('getBeatsByProducerId', () => {
    it('should return beats for a producer', async () => {
      const beats = [makeBeat()];
      mockPrismaBeat.findMany.mockResolvedValue(beats);

      const result = await repo.getBeatsByProducerId('producer-1');

      expect(mockPrismaBeat.findMany).toHaveBeenCalledWith({
        where: { producerId: 'producer-1', deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('getGenres', () => {
    it('should return all genres', async () => {
      const genres = [
        { id: '1', name: 'Trap', slug: 'trap', createdAt: new Date() },
        { id: '2', name: 'Boom Bap', slug: 'boom-bap', createdAt: new Date() },
      ];
      mockPrismaGenre.findMany.mockResolvedValue(genres);

      const result = await repo.getGenres();

      expect(mockPrismaGenre.findMany).toHaveBeenCalledWith({ orderBy: { name: 'asc' } });
      expect(result).toHaveLength(2);
    });
  });

  describe('getProducerStats', () => {
    it('should aggregate stats for a producer', async () => {
      mockPrismaBeat.findMany.mockResolvedValue([
        { playsCount: 100, salesCount: 5, priceCents: 2999 },
        { playsCount: 200, salesCount: 10, priceCents: 1999 },
      ]);

      const result = await repo.getProducerStats('producer-1');

      expect(result).toEqual({
        totalBeats: 2,
        totalPlays: 300,
        totalSales: 15,
        revenue: 5 * 2999 + 10 * 1999,
      });
    });

    it('should return zero stats when no beats', async () => {
      mockPrismaBeat.findMany.mockResolvedValue([]);

      const result = await repo.getProducerStats('producer-1');

      expect(result).toEqual({
        totalBeats: 0,
        totalPlays: 0,
        totalSales: 0,
        revenue: 0,
      });
    });
  });
});
