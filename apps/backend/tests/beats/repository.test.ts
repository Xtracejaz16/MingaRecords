import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Beat } from '@/modules/beats/types.js';

// vi.hoisted ensures these are available when vi.mock factory runs
const { mockPrismaBeat } = vi.hoisted(() => ({
  mockPrismaBeat: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/modules/beats/storage.js', () => ({
  prisma: { beat: mockPrismaBeat },
}));

import * as repo from '@/modules/beats/repository.js';

function makeBeat(overrides: Partial<Beat> = {}): Beat {
  return {
    id: 'beat-1',
    title: 'Dark Trap',
    description: 'Hard 808s',
    price: 29.99,
    isSold: false,
    audioUrl: '/beats/audio.mp3',
    coverUrl: '/beats/cover.jpg',
    sellerId: 'seller-1',
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
    it('should call prisma.beat.create with correct data', async () => {
      const expected = makeBeat();
      mockPrismaBeat.create.mockResolvedValue(expected);

      const result = await repo.createBeat({
        title: 'Dark Trap',
        price: 29.99,
        audioUrl: '/beats/audio.mp3',
        coverUrl: '/beats/cover.jpg',
        sellerId: 'seller-1',
      });

      expect(mockPrismaBeat.create).toHaveBeenCalledWith({
        data: {
          title: 'Dark Trap',
          price: 29.99,
          audioUrl: '/beats/audio.mp3',
          coverUrl: '/beats/cover.jpg',
          sellerId: 'seller-1',
        },
      });
      expect(result).toEqual(expected);
    });
  });

  describe('getBeatById', () => {
    it('should return beat when found', async () => {
      const beat = makeBeat();
      mockPrismaBeat.findUnique.mockResolvedValue(beat);

      const result = await repo.getBeatById('beat-1');
      expect(result).toEqual(beat);
      expect(mockPrismaBeat.findUnique).toHaveBeenCalledWith({ where: { id: 'beat-1' } });
    });

    it('should return null when not found', async () => {
      mockPrismaBeat.findUnique.mockResolvedValue(null);

      const result = await repo.getBeatById('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('listBeats', () => {
    it('should return beats with default pagination', async () => {
      const beats = [makeBeat(), makeBeat({ id: 'beat-2' })];
      mockPrismaBeat.findMany.mockResolvedValue(beats);

      const result = await repo.listBeats();

      expect(mockPrismaBeat.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
      expect(result).toHaveLength(2);
    });

    it('should accept custom pagination', async () => {
      mockPrismaBeat.findMany.mockResolvedValue([]);

      await repo.listBeats({ skip: 10, take: 5 });

      expect(mockPrismaBeat.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        skip: 10,
        take: 5,
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
    it('should call prisma.beat.delete with correct id', async () => {
      mockPrismaBeat.delete.mockResolvedValue(makeBeat());

      await repo.deleteBeat('beat-1');

      expect(mockPrismaBeat.delete).toHaveBeenCalledWith({ where: { id: 'beat-1' } });
    });
  });
});
