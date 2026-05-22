import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import type { Beat } from '@/modules/beats/types.js';

// --- Mocks (set up before imports) ---

const mockCreateBeat = vi.fn();
const mockGetBeat = vi.fn();
const mockListCatalog = vi.fn();
const mockUpdateBeat = vi.fn();
const mockDeleteBeat = vi.fn();
const mockGetProducerBeats = vi.fn();
const mockGetProducerProfile = vi.fn();
const mockGetGenres = vi.fn();
const mockGetDashboard = vi.fn();

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

class MockInvalidStatusTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Invalid status transition: ${from} → ${to}`);
    this.name = 'InvalidStatusTransitionError';
  }
}

vi.mock('@/modules/beats/service.js', () => ({
  createBeat: (...args: unknown[]) => mockCreateBeat(...args),
  getBeat: (...args: unknown[]) => mockGetBeat(...args),
  listCatalog: (...args: unknown[]) => mockListCatalog(...args),
  updateBeat: (...args: unknown[]) => mockUpdateBeat(...args),
  deleteBeat: (...args: unknown[]) => mockDeleteBeat(...args),
  getProducerBeats: (...args: unknown[]) => mockGetProducerBeats(...args),
  getProducerProfile: (...args: unknown[]) => mockGetProducerProfile(...args),
  getGenres: (...args: unknown[]) => mockGetGenres(...args),
  getDashboard: (...args: unknown[]) => mockGetDashboard(...args),
  BeatNotFoundError: MockBeatNotFoundError,
  BeatForbiddenError: MockBeatForbiddenError,
  InvalidStatusTransitionError: MockInvalidStatusTransitionError,
}));

let mockUserRole = 'producer';

vi.mock('@/shared/middleware/auth.js', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { userId: 'test-user-1', email: 'test@example.com', role: mockUserRole };
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
    producerId: 'test-user-1',
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
    mockUserRole = 'producer';
  });

  // ─── POST /api/v1/beats ───────────────────────────────────────

  describe('POST /api/v1/beats', () => {
    it('should create beat with valid JSON metadata', async () => {
      const beat = makeBeat();
      mockCreateBeat.mockResolvedValue(beat);

      const res = await request(app)
        .post('/api/v1/beats')
        .send({ title: 'Dark Trap', priceCents: 2999, description: 'Hard 808s' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Dark Trap');
      expect(mockCreateBeat).toHaveBeenCalledTimes(1);
    });

    it('should return 403 when user is not a producer', async () => {
      mockUserRole = 'user';

      const res = await request(app)
        .post('/api/v1/beats')
        .send({ title: 'Dark Trap', priceCents: 2999 });

      expect(res.status).toBe(403);
      expect(res.body.type).toBe('https://mingarecords.com/errors/forbidden');
      expect(res.body.title).toBe('Rol insuficiente');
    });

    it('should return 400 when title is missing', async () => {
      const res = await request(app)
        .post('/api/v1/beats')
        .send({ priceCents: 2999 });

      expect(res.status).toBe(400);
      expect(res.body.type).toBe('https://mingarecords.com/errors/validation');
    });

    it('should return 400 when priceCents is missing', async () => {
      const res = await request(app)
        .post('/api/v1/beats')
        .send({ title: 'Dark Trap' });

      expect(res.status).toBe(400);
      expect(res.body.type).toBe('https://mingarecords.com/errors/validation');
    });
  });

  // ─── GET /api/v1/beats ────────────────────────────────────────

  describe('GET /api/v1/beats', () => {
    it('should return paginated beats with metadata', async () => {
      const paginatedResult = {
        data: [makeBeat(), makeBeat({ id: 'beat-2', slug: 'boom-bap' })],
        pagination: { page: 1, limit: 20, totalItems: 2, totalPages: 1, next: null, prev: null },
      };
      mockListCatalog.mockResolvedValue(paginatedResult);

      const res = await request(app).get('/api/v1/beats');

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.totalItems).toBe(2);
      expect(mockListCatalog).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 20, sort: 'recent' }),
      );
    });

    it('should pass filter query params to service', async () => {
      mockListCatalog.mockResolvedValue({
        data: [],
        pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 0, next: null, prev: null },
      });

      const res = await request(app).get(
        '/api/v1/beats?genre=Trap&minPrice=1000&maxPrice=5000&sort=popular&page=1&limit=10',
      );

      expect(res.status).toBe(200);
      expect(mockListCatalog).toHaveBeenCalledWith(
        expect.objectContaining({
          genre: 'Trap',
          minPrice: 1000,
          maxPrice: 5000,
          sort: 'popular',
          page: 1,
          limit: 10,
        }),
      );
    });
  });

  // ─── GET /api/v1/beats/:id ────────────────────────────────────

  describe('GET /api/v1/beats/:id', () => {
    it('should return beat by id', async () => {
      const beat = makeBeat();
      mockGetBeat.mockResolvedValue(beat);

      const res = await request(app).get('/api/v1/beats/beat-1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('beat-1');
      expect(res.body.title).toBe('Dark Trap');
    });

    it('should return 404 with RFC 7807 format when beat not found', async () => {
      mockGetBeat.mockRejectedValue(new MockBeatNotFoundError('nonexistent'));

      const res = await request(app).get('/api/v1/beats/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.type).toBe('https://mingarecords.com/errors/not-found');
      expect(res.body.title).toBe('Beat no encontrado');
      expect(res.body.status).toBe(404);
      expect(res.body.detail).toBe('Beat not found: nonexistent');
      expect(res.body.instance).toBe('/api/v1/beats/nonexistent');
    });
  });

  // ─── PATCH /api/v1/beats/:id ──────────────────────────────────

  describe('PATCH /api/v1/beats/:id', () => {
    it('should update beat when user is the owner', async () => {
      const updated = makeBeat({ title: 'Updated Title' });
      mockUpdateBeat.mockResolvedValue(updated);

      const res = await request(app)
        .patch('/api/v1/beats/beat-1')
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
      expect(mockUpdateBeat).toHaveBeenCalledWith('beat-1', { title: 'Updated Title' }, 'test-user-1');
    });

    it('should return 403 with RFC 7807 when user is not the owner', async () => {
      mockUpdateBeat.mockRejectedValue(new MockBeatForbiddenError());

      const res = await request(app)
        .patch('/api/v1/beats/beat-1')
        .send({ title: 'Hacked' });

      expect(res.status).toBe(403);
      expect(res.body.type).toBe('https://mingarecords.com/errors/forbidden');
      expect(res.body.title).toBe('Acceso denegado');
    });

    it('should return 404 with RFC 7807 when beat not found', async () => {
      mockUpdateBeat.mockRejectedValue(new MockBeatNotFoundError('nonexistent'));

      const res = await request(app)
        .patch('/api/v1/beats/nonexistent')
        .send({ title: 'Updated' });

      expect(res.status).toBe(404);
      expect(res.body.type).toBe('https://mingarecords.com/errors/not-found');
    });

    it('should return 422 with RFC 7807 for invalid status transition', async () => {
      mockUpdateBeat.mockRejectedValue(new MockInvalidStatusTransitionError('draft', 'published'));

      const res = await request(app)
        .patch('/api/v1/beats/beat-1')
        .send({ status: 'published' });

      expect(res.status).toBe(422);
      expect(res.body.type).toBe('https://mingarecords.com/errors/invalid-transition');
      expect(res.body.title).toBe('Transición de estado inválida');
    });

    it('should return 400 with RFC 7807 when no fields provided', async () => {
      const res = await request(app)
        .patch('/api/v1/beats/beat-1')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.type).toBe('https://mingarecords.com/errors/validation');
    });
  });

  // ─── DELETE /api/v1/beats/:id ─────────────────────────────────

  describe('DELETE /api/v1/beats/:id', () => {
    it('should delete beat when user is the owner', async () => {
      mockDeleteBeat.mockResolvedValue(undefined);

      const res = await request(app).delete('/api/v1/beats/beat-1');

      expect(res.status).toBe(204);
      expect(mockDeleteBeat).toHaveBeenCalledWith('beat-1', 'test-user-1');
    });

    it('should return 403 with RFC 7807 when user is not the owner', async () => {
      mockDeleteBeat.mockRejectedValue(new MockBeatForbiddenError());

      const res = await request(app).delete('/api/v1/beats/beat-1');

      expect(res.status).toBe(403);
      expect(res.body.type).toBe('https://mingarecords.com/errors/forbidden');
    });

    it('should return 404 with RFC 7807 when beat not found', async () => {
      mockDeleteBeat.mockRejectedValue(new MockBeatNotFoundError('nonexistent'));

      const res = await request(app).delete('/api/v1/beats/nonexistent');

      expect(res.status).toBe(404);
      expect(res.body.type).toBe('https://mingarecords.com/errors/not-found');
    });
  });

  // ─── GET /api/v1/beats/genres ─────────────────────────────────

  describe('GET /api/v1/beats/genres', () => {
    it('should return list of genres', async () => {
      const genres = [
        { id: '1', name: 'Trap', slug: 'trap', createdAt: new Date() },
        { id: '2', name: 'Boom Bap', slug: 'boom-bap', createdAt: new Date() },
      ];
      mockGetGenres.mockResolvedValue(genres);

      const res = await request(app).get('/api/v1/beats/genres');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].name).toBe('Trap');
    });
  });

  // ─── GET /api/v1/beats/producers/:id ─────────────────────────

  describe('GET /api/v1/beats/producers/:id', () => {
    it('should return producer profile with beats', async () => {
      const profile = { id: 'producer-1', beats: [makeBeat()] };
      mockGetProducerProfile.mockResolvedValue(profile);

      const res = await request(app).get('/api/v1/beats/producers/producer-1');

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('producer-1');
      expect(res.body.beats).toHaveLength(1);
    });
  });

  // ─── GET /api/v1/beats/producers/:id/beats ────────────────────

  describe('GET /api/v1/beats/producers/:id/beats', () => {
    it('should return beats for a producer', async () => {
      const beats = [makeBeat()];
      mockGetProducerBeats.mockResolvedValue(beats);

      const res = await request(app).get('/api/v1/beats/producers/producer-1/beats');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(mockGetProducerBeats).toHaveBeenCalledWith('producer-1', { skip: 0, take: 20 });
    });

    it('should support pagination', async () => {
      mockGetProducerBeats.mockResolvedValue([]);

      const res = await request(app).get('/api/v1/beats/producers/producer-1/beats?skip=10&take=5');

      expect(res.status).toBe(200);
      expect(mockGetProducerBeats).toHaveBeenCalledWith('producer-1', { skip: 10, take: 5 });
    });
  });

  // ─── GET /api/v1/beats/dashboard ──────────────────────────────

  describe('GET /api/v1/beats/dashboard', () => {
    it('should return dashboard stats for producer', async () => {
      const stats = { totalBeats: 5, totalPlays: 1000, totalSales: 20, revenue: 59980 };
      mockGetDashboard.mockResolvedValue(stats);

      const res = await request(app).get('/api/v1/beats/dashboard');

      expect(res.status).toBe(200);
      expect(res.body.totalBeats).toBe(5);
      expect(res.body.totalPlays).toBe(1000);
    });

    it('should return 403 when user is not a producer', async () => {
      mockUserRole = 'user';

      const res = await request(app).get('/api/v1/beats/dashboard');

      expect(res.status).toBe(403);
      expect(res.body.type).toBe('https://mingarecords.com/errors/forbidden');
      expect(res.body.title).toBe('Rol insuficiente');
    });
  });
});
