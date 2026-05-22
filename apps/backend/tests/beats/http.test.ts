import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import type { Beat } from '@/modules/beats/types.js';

// --- Mocks (set up before imports) ---

const mockCreateBeat = vi.fn();
const mockGetBeat = vi.fn();
const mockListCatalog = vi.fn();
const mockUpdateBeat = vi.fn();
const mockDeleteBeat = vi.fn();

class MockBeatNotFoundError extends Error {
  constructor(id: string) {
    super(`Beat not found: ${id}`);
    this.name = 'BeatNotFoundError';
  }
}

class MockBeatForbiddenError extends Error {
  constructor() {
    super('You are not allowed to modify this beat');
    this.name = 'BeatForbiddenError';
  }
}

vi.mock('@/modules/beats/service.js', () => ({
  createBeat: (...args: unknown[]) => mockCreateBeat(...args),
  getBeat: (...args: unknown[]) => mockGetBeat(...args),
  listCatalog: (...args: unknown[]) => mockListCatalog(...args),
  updateBeat: (...args: unknown[]) => mockUpdateBeat(...args),
  deleteBeat: (...args: unknown[]) => mockDeleteBeat(...args),
  BeatNotFoundError: MockBeatNotFoundError,
  BeatForbiddenError: MockBeatForbiddenError,
}));

vi.mock('@/shared/middleware/auth.js', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { userId: 'test-user-1', email: 'test@example.com', role: 'user' };
    next();
  },
}));

// Import app AFTER mocks are set up
const { app } = await import('@/app.js');

// --- Helpers ---

function makeBeat(overrides: Partial<Beat> = {}): Beat {
  return {
    id: 'beat-1',
    title: 'Dark Trap',
    description: 'Hard 808s',
    price: 29.99,
    isSold: false,
    audioUrl: '/beats/1234-audio.mp3',
    coverUrl: '/beats/1234-cover.jpg',
    sellerId: 'test-user-1',
    buyerId: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

// --- Tests ---

describe('Beats HTTP API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── POST /api/beats ───────────────────────────────────────────

  describe('POST /api/beats', () => {
    it('should create beat with valid audio and cover files', async () => {
      const beat = makeBeat();
      mockCreateBeat.mockResolvedValue(beat);

      const res = await request(app)
        .post('/api/beats')
        .field('title', 'Dark Trap')
        .field('price', '29.99')
        .field('description', 'Hard 808s')
        .attach('audio', Buffer.from('fake-audio-data'), 'beat.mp3')
        .attach('cover', Buffer.from('fake-image-data'), 'cover.jpg');

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Dark Trap');
      expect(res.body.audioUrl).toBe('/beats/1234-audio.mp3');
      expect(mockCreateBeat).toHaveBeenCalledTimes(1);
    });

    it('should return 400 when audio file is missing', async () => {
      const res = await request(app)
        .post('/api/beats')
        .field('title', 'Dark Trap')
        .field('price', '29.99')
        .attach('cover', Buffer.from('fake-image-data'), 'cover.jpg');

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when cover file is missing', async () => {
      const res = await request(app)
        .post('/api/beats')
        .field('title', 'Dark Trap')
        .field('price', '29.99')
        .attach('audio', Buffer.from('fake-audio-data'), 'beat.mp3');

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when title is missing', async () => {
      const res = await request(app)
        .post('/api/beats')
        .field('price', '29.99')
        .attach('audio', Buffer.from('fake-audio-data'), 'beat.mp3')
        .attach('cover', Buffer.from('fake-image-data'), 'cover.jpg');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when price is missing', async () => {
      const res = await request(app)
        .post('/api/beats')
        .field('title', 'Dark Trap')
        .attach('audio', Buffer.from('fake-audio-data'), 'beat.mp3')
        .attach('cover', Buffer.from('fake-image-data'), 'cover.jpg');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });
  });

  // ─── GET /api/beats ────────────────────────────────────────────

  describe('GET /api/beats', () => {
    it('should return list of beats', async () => {
      const beats = [makeBeat(), makeBeat({ id: 'beat-2', title: 'Boom Bap' })];
      mockListCatalog.mockResolvedValue(beats);

      const res = await request(app).get('/api/beats');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].title).toBe('Dark Trap');
      expect(mockListCatalog).toHaveBeenCalledWith({ skip: 0, take: 20 });
    });

    it('should support pagination query params', async () => {
      mockListCatalog.mockResolvedValue([]);

      const res = await request(app).get('/api/beats?skip=10&take=5');

      expect(res.status).toBe(200);
      expect(mockListCatalog).toHaveBeenCalledWith({ skip: 10, take: 5 });
    });
  });

  // ─── GET /api/beats/:id ────────────────────────────────────────

  describe('GET /api/beats/:id', () => {
    it('should return beat by id', async () => {
      const beat = makeBeat();
      mockGetBeat.mockResolvedValue(beat);

      const res = await request(app).get('/api/beats/beat-1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('beat-1');
      expect(res.body.title).toBe('Dark Trap');
    });

    it('should return 404 when beat not found', async () => {
      mockGetBeat.mockRejectedValue(new MockBeatNotFoundError('nonexistent'));

      const res = await request(app).get('/api/beats/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('NOT_FOUND');
    });
  });

  // ─── PUT /api/beats/:id ────────────────────────────────────────

  describe('PUT /api/beats/:id', () => {
    it('should update beat when user is the owner', async () => {
      const updated = makeBeat({ title: 'Updated Title' });
      mockUpdateBeat.mockResolvedValue(updated);

      const res = await request(app)
        .put('/api/beats/beat-1')
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
      expect(mockUpdateBeat).toHaveBeenCalledWith('beat-1', { title: 'Updated Title' }, 'test-user-1');
    });

    it('should return 403 when user is not the owner', async () => {
      mockUpdateBeat.mockRejectedValue(new MockBeatForbiddenError());

      const res = await request(app)
        .put('/api/beats/beat-1')
        .send({ title: 'Hacked' });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FORBIDDEN');
    });

    it('should return 404 when beat not found', async () => {
      mockUpdateBeat.mockRejectedValue(new MockBeatNotFoundError('nonexistent'));

      const res = await request(app)
        .put('/api/beats/nonexistent')
        .send({ title: 'Updated' });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('NOT_FOUND');
    });

    it('should return 400 when no fields provided', async () => {
      const res = await request(app)
        .put('/api/beats/beat-1')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('VALIDATION_ERROR');
    });
  });

  // ─── DELETE /api/beats/:id ─────────────────────────────────────

  describe('DELETE /api/beats/:id', () => {
    it('should delete beat when user is the owner', async () => {
      mockDeleteBeat.mockResolvedValue(undefined);

      const res = await request(app).delete('/api/beats/beat-1');

      expect(res.status).toBe(204);
      expect(mockDeleteBeat).toHaveBeenCalledWith('beat-1', 'test-user-1', expect.objectContaining({
        uploadFile: expect.any(Function),
        deleteFile: expect.any(Function),
      }));
    });

    it('should return 403 when user is not the owner', async () => {
      mockDeleteBeat.mockRejectedValue(new MockBeatForbiddenError());

      const res = await request(app).delete('/api/beats/beat-1');

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('FORBIDDEN');
    });

    it('should return 404 when beat not found', async () => {
      mockDeleteBeat.mockRejectedValue(new MockBeatNotFoundError('nonexistent'));

      const res = await request(app).delete('/api/beats/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('NOT_FOUND');
    });
  });
});
