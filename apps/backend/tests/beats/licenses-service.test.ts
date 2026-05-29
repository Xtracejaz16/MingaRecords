import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Beat } from '@/modules/beats/types.js';

// Mock repository
vi.mock('@/modules/beats/repository.js', () => ({
  getBeatById: vi.fn(),
  getLicensesByBeatId: vi.fn(),
  upsertLicense: vi.fn(),
}));

import {
  BeatNotFoundError,
  BeatForbiddenError,
} from '@/modules/beats/service.js';
import * as beatsRepo from '@/modules/beats/repository.js';
import {
  getLicenses,
  upsertLicenses,
  PriceOutOfRangeError,
  InvalidLicenseTypeError,
} from '@/modules/beats/service.js';

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

describe('getLicenses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return licenses when user is the owner', async () => {
    const beat = makeBeat();
    const licenses = [
      { id: 'lic-1', type: 'BASIC', priceCents: 500, isActive: true, createdAt: new Date(), beatId: 'beat-1' },
    ];
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(beat);
    vi.mocked(beatsRepo.getLicensesByBeatId).mockResolvedValue(licenses);

    const result = await getLicenses('beat-1', 'producer-1');

    expect(beatsRepo.getLicensesByBeatId).toHaveBeenCalledWith('beat-1');
    expect(result).toEqual(licenses);
  });

  it('should throw BeatNotFoundError when beat does not exist', async () => {
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(null);

    await expect(getLicenses('nonexistent', 'user-1')).rejects.toThrow(BeatNotFoundError);
  });

  it('should throw BeatForbiddenError when user is not the owner', async () => {
    const beat = makeBeat({ producerId: 'producer-1' });
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(beat);

    await expect(getLicenses('beat-1', 'other-user')).rejects.toThrow(BeatForbiddenError);
  });
});

describe('upsertLicenses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should upsert all licenses when user is the owner and prices are valid', async () => {
    const beat = makeBeat();
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(beat);
    vi.mocked(beatsRepo.upsertLicense).mockResolvedValue({
      id: 'lic-1',
      type: 'BASIC',
      priceCents: 500,
      isActive: true,
      createdAt: new Date(),
      beatId: 'beat-1',
    });

    const input = [
      { type: 'BASIC' as const, priceCents: 500, isActive: true },
    ];

    const result = await upsertLicenses('beat-1', 'producer-1', input);

    expect(beatsRepo.upsertLicense).toHaveBeenCalledWith('beat-1', 'BASIC', {
      priceCents: 500,
      isActive: true,
    });
    expect(result).toHaveLength(1);
  });

  it('should throw BeatNotFoundError when beat does not exist', async () => {
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(null);

    await expect(
      upsertLicenses('nonexistent', 'user-1', []),
    ).rejects.toThrow(BeatNotFoundError);
  });

  it('should throw BeatForbiddenError when user is not the owner', async () => {
    const beat = makeBeat({ producerId: 'producer-1' });
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(beat);

    await expect(
      upsertLicenses('beat-1', 'other-user', []),
    ).rejects.toThrow(BeatForbiddenError);
  });

  it('should throw InvalidLicenseTypeError for unknown license type', async () => {
    const beat = makeBeat();
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(beat);

    const input = [{ type: 'INVALID' as any, priceCents: 500 }];

    await expect(
      upsertLicenses('beat-1', 'producer-1', input),
    ).rejects.toThrow(InvalidLicenseTypeError);
  });

  it('should throw PriceOutOfRangeError when price is outside range', async () => {
    const beat = makeBeat();
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(beat);

    const input = [{ type: 'BASIC' as const, priceCents: 99999 }];

    await expect(
      upsertLicenses('beat-1', 'producer-1', input),
    ).rejects.toThrow(PriceOutOfRangeError);
  });

  it('should upsert multiple licenses at once', async () => {
    const beat = makeBeat();
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(beat);
    vi.mocked(beatsRepo.upsertLicense)
      .mockResolvedValueOnce({ id: 'lic-1', type: 'BASIC', priceCents: 500, isActive: true, createdAt: new Date(), beatId: 'beat-1' })
      .mockResolvedValueOnce({ id: 'lic-2', type: 'PREMIUM', priceCents: 10000, isActive: false, createdAt: new Date(), beatId: 'beat-1' });

    const input = [
      { type: 'BASIC' as const, priceCents: 500, isActive: true },
      { type: 'PREMIUM' as const, priceCents: 10000, isActive: false },
    ];

    const result = await upsertLicenses('beat-1', 'producer-1', input);

    expect(beatsRepo.upsertLicense).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
  });
});
