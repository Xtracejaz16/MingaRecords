import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Beat } from '@/modules/beats/types.js';
import type { StorageProvider } from '@/modules/beats/storage.js';

// Mock the repository module
vi.mock('@/modules/beats/repository.js', () => ({
  createBeat: vi.fn(),
  getBeatById: vi.fn(),
  listBeats: vi.fn(),
  updateBeat: vi.fn(),
  deleteBeat: vi.fn(),
}));

import * as beatsRepo from '@/modules/beats/repository.js';
import {
  createBeat,
  getBeat,
  listCatalog,
  updateBeat,
  deleteBeat,
  BeatNotFoundError,
  BeatForbiddenError,
} from '@/modules/beats/service.js';

// --- Helpers ---

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

function makeMockStorage(): StorageProvider {
  return {
    uploadFile: vi.fn().mockResolvedValue('/beats/uploaded-file'),
    deleteFile: vi.fn().mockResolvedValue(undefined),
  };
}

// --- Tests ---

describe('createBeat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should upload audio and cover files, then create beat in DB', async () => {
    const storage = makeMockStorage();
    const expected = makeBeat({ audioUrl: '/beats/uploaded-file', coverUrl: '/beats/uploaded-file' });
    vi.mocked(beatsRepo.createBeat).mockResolvedValue(expected);

    const result = await createBeat(
      { title: 'Dark Trap', price: 29.99 },
      { audio: Buffer.from('audio'), audioName: 'beat.mp3', cover: Buffer.from('cover'), coverName: 'cover.jpg' },
      'seller-1',
      storage,
    );

    expect(storage.uploadFile).toHaveBeenCalledTimes(2);
    expect(storage.uploadFile).toHaveBeenCalledWith(Buffer.from('audio'), 'beat.mp3', 'audio/mpeg');
    expect(storage.uploadFile).toHaveBeenCalledWith(Buffer.from('cover'), 'cover.jpg', 'image/jpeg');
    expect(beatsRepo.createBeat).toHaveBeenCalledWith({
      title: 'Dark Trap',
      price: 29.99,
      audioUrl: '/beats/uploaded-file',
      coverUrl: '/beats/uploaded-file',
      sellerId: 'seller-1',
    });
    expect(result).toEqual(expected);
  });

  it('should default isSold to false via Prisma schema', async () => {
    const storage = makeMockStorage();
    const beat = makeBeat({ isSold: false });
    vi.mocked(beatsRepo.createBeat).mockResolvedValue(beat);

    const result = await createBeat(
      { title: 'Boom Bap', price: 19.99 },
      { audio: Buffer.from('a'), audioName: 'a.mp3', cover: Buffer.from('c'), coverName: 'c.jpg' },
      'seller-1',
      storage,
    );

    expect(result.isSold).toBe(false);
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

  it('should return list of beats with default pagination', async () => {
    const beats = [makeBeat(), makeBeat({ id: 'beat-2', title: 'Boom Bap' })];
    vi.mocked(beatsRepo.listBeats).mockResolvedValue(beats);

    const result = await listCatalog();

    expect(result).toHaveLength(2);
    expect(beatsRepo.listBeats).toHaveBeenCalledWith(undefined);
  });

  it('should pass pagination options to repository', async () => {
    vi.mocked(beatsRepo.listBeats).mockResolvedValue([]);

    await listCatalog({ skip: 10, take: 5 });

    expect(beatsRepo.listBeats).toHaveBeenCalledWith({ skip: 10, take: 5 });
  });
});

describe('updateBeat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should update beat when user is the owner', async () => {
    const beat = makeBeat({ sellerId: 'seller-1' });
    const updated = makeBeat({ title: 'Updated Title' });
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(beat);
    vi.mocked(beatsRepo.updateBeat).mockResolvedValue(updated);

    const result = await updateBeat('beat-1', { title: 'Updated Title' }, 'seller-1');

    expect(result.title).toBe('Updated Title');
    expect(beatsRepo.updateBeat).toHaveBeenCalledWith('beat-1', { title: 'Updated Title' });
  });

  it('should throw BeatForbiddenError when user is not the owner', async () => {
    const beat = makeBeat({ sellerId: 'seller-1' });
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
});

describe('deleteBeat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete beat and clean up files when user is the owner', async () => {
    const beat = makeBeat({ sellerId: 'seller-1', audioUrl: '/beats/a.mp3', coverUrl: '/beats/c.jpg' });
    const storage = makeMockStorage();
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(beat);
    vi.mocked(beatsRepo.deleteBeat).mockResolvedValue(undefined);

    await deleteBeat('beat-1', 'seller-1', storage);

    expect(storage.deleteFile).toHaveBeenCalledWith('/beats/a.mp3');
    expect(storage.deleteFile).toHaveBeenCalledWith('/beats/c.jpg');
    expect(beatsRepo.deleteBeat).toHaveBeenCalledWith('beat-1');
  });

  it('should throw BeatForbiddenError when user is not the owner', async () => {
    const beat = makeBeat({ sellerId: 'seller-1' });
    const storage = makeMockStorage();
    vi.mocked(beatsRepo.getBeatById).mockResolvedValue(beat);

    await expect(
      deleteBeat('beat-1', 'other-user', storage),
    ).rejects.toThrow(BeatForbiddenError);

    expect(storage.deleteFile).not.toHaveBeenCalled();
    expect(beatsRepo.deleteBeat).not.toHaveBeenCalled();
  });
});
