import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Beat } from '@/modules/beats/types.js';

// Mock the repository module
vi.mock('@/modules/beats/repository.js', () => ({
  createBeat: vi.fn(),
  getBeatById: vi.fn(),
  listBeats: vi.fn(),
  updateBeat: vi.fn(),
  deleteBeat: vi.fn(),
  getBeatsByProducerId: vi.fn(),
  getGenres: vi.fn(),
  getProducerStats: vi.fn(),
}));

import * as beatsRepo from '@/modules/beats/repository.js';
import {
  createBeat,
  getBeat,
  listCatalog,
  updateBeat,
  deleteBeat,
  getProducerBeats,
  getProducerProfile,
  getGenres,
  getDashboard,
  markAudioReady,
  markAsSold,
  BeatNotFoundError,
  BeatForbiddenError,
  InvalidStatusTransitionError,
} from '@/modules/beats/service.js';

// --- Helpers ---

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

// --- Tests ---

describe('createBeat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create beat with metadata only (no files)', async () => {
    const expected = makeBeat();
    vi.mocked(beatsRepo.createBeat).mockResolvedValue(expected);

    const result = await createBeat(
      { title: 'Dark Trap', priceCents: 2999 },
      'producer-1',
    );

    expect(beatsRepo.createBeat).toHaveBeenCalledWith({
      title: 'Dark Trap',
      priceCents: 2999,
      producerId: 'producer-1',
    });
    expect(result).toEqual(expected);
  });
});

describe('getBeat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return beat when found', async () => {
    const beat = makeBeat();
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(beat);

    const result = await getBeat('beat-1');
    expect(result).toEqual(beat);
  });

  it('should throw BeatNotFoundError when beat does not exist', async () => {
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(null);

    await expect(getBeat('nonexistent')).rejects.toThrow(BeatNotFoundError);
  });
});

describe('listCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return paginated beats from repository', async () => {
    const paginatedResult = {
      data: [makeBeat()],
      pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1, next: null, prev: null },
    };
    vi.mocked(beatsRepo.listBeats).mockResolvedValue(paginatedResult);

    const query = { page: 1, limit: 20, sort: 'recent' as const };
    const result = await listCatalog(query);

    expect(result.data).toHaveLength(1);
    expect(result.pagination.totalItems).toBe(1);
    expect(beatsRepo.listBeats).toHaveBeenCalledWith(query);
  });
});

describe('updateBeat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update beat when user is the owner', async () => {
    const beat = makeBeat({ producerId: 'producer-1', status: 'draft' });
    const updated = makeBeat({ title: 'Updated Title' });
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(beat);
    vi.mocked(beatsRepo.updateBeat).mockResolvedValue(updated);

    const result = await updateBeat('beat-1', { title: 'Updated Title' }, 'producer-1');

    expect(result.title).toBe('Updated Title');
    expect(beatsRepo.updateBeat).toHaveBeenCalledWith('beat-1', { title: 'Updated Title' });
  });

  it('should throw BeatForbiddenError when user is not the owner', async () => {
    const beat = makeBeat({ producerId: 'producer-1' });
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(beat);

    await expect(
      updateBeat('beat-1', { title: 'Hacked' }, 'other-user'),
    ).rejects.toThrow(BeatForbiddenError);

    expect(beatsRepo.updateBeat).not.toHaveBeenCalled();
  });

  it('should throw BeatNotFoundError when beat does not exist', async () => {
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(null);

    await expect(
      updateBeat('nonexistent', { title: 'X' }, 'user-1'),
    ).rejects.toThrow(BeatNotFoundError);
  });

  it('should allow valid status transition draft → pending_audio', async () => {
    const beat = makeBeat({ status: 'draft' });
    const updated = makeBeat({ status: 'pending_audio' });
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(beat);
    vi.mocked(beatsRepo.updateBeat).mockResolvedValue(updated);

    const result = await updateBeat('beat-1', { status: 'pending_audio' }, 'producer-1');

    expect(result.status).toBe('pending_audio');
  });

  it('should throw InvalidStatusTransitionError for invalid transition', async () => {
    const beat = makeBeat({ status: 'draft' });
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(beat);

    await expect(
      updateBeat('beat-1', { status: 'published' }, 'producer-1'),
    ).rejects.toThrow(InvalidStatusTransitionError);
  });
});

describe('deleteBeat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should soft delete beat when user is the owner', async () => {
    const beat = makeBeat({ producerId: 'producer-1' });
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(beat);
    vi.mocked(beatsRepo.deleteBeat).mockResolvedValue(undefined);

    await deleteBeat('beat-1', 'producer-1');

    expect(beatsRepo.deleteBeat).toHaveBeenCalledWith('beat-1');
  });

  it('should throw BeatForbiddenError when user is not the owner', async () => {
    const beat = makeBeat({ producerId: 'producer-1' });
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(beat);

    await expect(
      deleteBeat('beat-1', 'other-user'),
    ).rejects.toThrow(BeatForbiddenError);

    expect(beatsRepo.deleteBeat).not.toHaveBeenCalled();
  });
});

describe('markAudioReady', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mark beat as ready when status is processing', async () => {
    const beat = makeBeat({ status: 'processing', producerId: 'producer-1' });
    const updated = makeBeat({ status: 'ready', audioUrl: '/beats/new.mp3' });
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(beat);
    vi.mocked(beatsRepo.updateBeat).mockResolvedValue(updated);

    const result = await markAudioReady(
      'beat-1',
      { audioUrl: '/beats/new.mp3', previewUrl: '/beats/preview.mp3' },
    );

    expect(beatsRepo.updateBeat).toHaveBeenCalledWith('beat-1', {
      audioUrl: '/beats/new.mp3',
      previewUrl: '/beats/preview.mp3',
      streamUrl: undefined,
      status: 'ready',
    });
    expect(result.status).toBe('ready');
  });

  it('should throw InvalidStatusTransitionError when not in processing state', async () => {
    const beat = makeBeat({ status: 'draft', producerId: 'producer-1' });
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(beat);

    await expect(
      markAudioReady('beat-1', { audioUrl: '/beats/new.mp3' }),
    ).rejects.toThrow(InvalidStatusTransitionError);
  });
});

describe('markAsSold', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mark beat as sold and increment salesCount', async () => {
    const beat = makeBeat({ status: 'published', producerId: 'producer-1', salesCount: 3 });
    const updated = makeBeat({ status: 'sold', salesCount: 4 });
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(beat);
    vi.mocked(beatsRepo.updateBeat).mockResolvedValue(updated);

    const result = await markAsSold('beat-1');

    expect(beatsRepo.updateBeat).toHaveBeenCalledWith('beat-1', {
      status: 'sold',
      salesCount: 4,
    });
    expect(result.salesCount).toBe(4);
  });

  it('should throw InvalidStatusTransitionError when not in published state', async () => {
    const beat = makeBeat({ status: 'draft', producerId: 'producer-1' });
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(beat);

    await expect(
      markAsSold('beat-1'),
    ).rejects.toThrow(InvalidStatusTransitionError);
  });
});

describe('getProducerBeats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return beats for a producer', async () => {
    const beats = [makeBeat()];
    vi.mocked(beatsRepo.getBeatsByProducerId).mockResolvedValue(beats);

    const result = await getProducerBeats('producer-1');

    expect(result).toHaveLength(1);
    expect(beatsRepo.getBeatsByProducerId).toHaveBeenCalledWith('producer-1', undefined);
  });
});

describe('getProducerProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return producer id and recent beats', async () => {
    const beats = [makeBeat()];
    vi.mocked(beatsRepo.getBeatsByProducerId).mockResolvedValue(beats);

    const result = await getProducerProfile('producer-1');

    expect(result.id).toBe('producer-1');
    expect(result.beats).toHaveLength(1);
  });
});

describe('getGenres', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return genres from repository', async () => {
    const genres = [{ id: '1', name: 'Trap', slug: 'trap', createdAt: new Date() }];
    vi.mocked(beatsRepo.getGenres).mockResolvedValue(genres);

    const result = await getGenres();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Trap');
  });
});

describe('getDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return producer stats', async () => {
    const stats = { totalBeats: 5, totalPlays: 1000, totalSales: 20, revenue: 59980 };
    vi.mocked(beatsRepo.getProducerStats).mockResolvedValue(stats);

    const result = await getDashboard('producer-1');

    expect(result).toEqual(stats);
    expect(beatsRepo.getProducerStats).toHaveBeenCalledWith('producer-1');
  });
});
