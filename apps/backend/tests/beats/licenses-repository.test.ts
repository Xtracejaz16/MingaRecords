import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPrismaLicense, mockPrismaBeat } = vi.hoisted(() => ({
  mockPrismaLicense: {
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
  mockPrismaBeat: {
    findUnique: vi.fn(),
  },
}));

vi.mock('@/modules/beats/db.js', () => ({
  prisma: { license: mockPrismaLicense, beat: mockPrismaBeat },
}));

import * as repo from '@/modules/beats/repository.js';

describe('LicenseRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLicensesByBeatId', () => {
    it('should call prisma.license.findMany with beatId and include beat', async () => {
      const licenses = [
        { id: 'lic-1', type: 'BASIC', priceCents: 500, isActive: true, createdAt: new Date(), beatId: 'beat-1' },
      ];
      mockPrismaLicense.findMany.mockResolvedValue(licenses);

      const result = await repo.getLicensesByBeatId('beat-1');

      expect(mockPrismaLicense.findMany).toHaveBeenCalledWith({
        where: { beatId: 'beat-1' },
      });
      expect(result).toEqual(licenses);
    });

    it('should return empty array when no licenses exist', async () => {
      mockPrismaLicense.findMany.mockResolvedValue([]);

      const result = await repo.getLicensesByBeatId('beat-1');

      expect(result).toEqual([]);
    });
  });

  describe('upsertLicense', () => {
    it('should call prisma.license.upsert with correct data', async () => {
      const expected = {
        id: 'lic-1',
        type: 'BASIC',
        priceCents: 500,
        isActive: true,
        createdAt: new Date(),
        beatId: 'beat-1',
      };
      mockPrismaLicense.upsert.mockResolvedValue(expected);

      const result = await repo.upsertLicense('beat-1', 'BASIC', {
        priceCents: 500,
        isActive: true,
      });

      expect(mockPrismaLicense.upsert).toHaveBeenCalledWith({
        where: {
          beatId_type: { beatId: 'beat-1', type: 'BASIC' },
        },
        create: {
          type: 'BASIC',
          priceCents: 500,
          isActive: true,
          beatId: 'beat-1',
        },
        update: {
          priceCents: 500,
          isActive: true,
        },
      });
      expect(result).toEqual(expected);
    });

    it('should default isActive to true when not provided', async () => {
      mockPrismaLicense.upsert.mockResolvedValue({
        id: 'lic-2',
        type: 'PREMIUM',
        priceCents: 10000,
        isActive: true,
        createdAt: new Date(),
        beatId: 'beat-1',
      });

      await repo.upsertLicense('beat-1', 'PREMIUM', { priceCents: 10000 });

      expect(mockPrismaLicense.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ isActive: true }),
          update: expect.objectContaining({ isActive: true }),
        }),
      );
    });
  });
});
