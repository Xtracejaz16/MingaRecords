import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// Mock env early (before any module imports)
vi.mock('@/config/env.js', () => ({
  env: {
    jwtSecret: 'test-secret',
    isProduction: false,
    databaseUrl: 'postgresql://test',
    frontendUrl: 'http://localhost:5173',
    resendApiKey: 'test',
    resendSenderEmail: 'test@test.com',
    storageDriver: 'local',
    storageEndpoint: '',
    storageRegion: '',
    storageBucket: '',
    storageAccessKeyId: '',
    storageSecretAccessKey: '',
    storageLocalDir: './public/uploads',
  },
}));

// Mock service functions
const mockGetLicenses = vi.fn();
const mockUpsertLicenses = vi.fn();

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

class MockInvalidLicenseTypeError extends Error {
  constructor(type: string) {
    super(`Invalid license type: ${type}`);
    this.name = 'InvalidLicenseTypeError';
  }
}

class MockPriceOutOfRangeError extends Error {
  constructor(type: string, price: number, min: number, max: number) {
    super(`Price ${price} is out of range for ${type} license. Must be between ${min} and ${max} cents.`);
    this.name = 'PriceOutOfRangeError';
  }
}

vi.mock('@/modules/beats/service.js', () => ({
  createBeat: vi.fn(),
  getBeat: vi.fn(),
  listCatalog: vi.fn(),
  updateBeat: vi.fn(),
  deleteBeat: vi.fn(),
  getProducerBeats: vi.fn(),
  getProducerProfile: vi.fn(),
  getGenres: vi.fn(),
  getDashboard: vi.fn(),
  getLicenses: (...args: unknown[]) => mockGetLicenses(...args),
  upsertLicenses: (...args: unknown[]) => mockUpsertLicenses(...args),
  BeatNotFoundError: MockBeatNotFoundError,
  BeatForbiddenError: MockBeatForbiddenError,
  InvalidLicenseTypeError: MockInvalidLicenseTypeError,
  PriceOutOfRangeError: MockPriceOutOfRangeError,
}));

let mockUserRole = 'BEATMAKER';

vi.mock('@/shared/middleware/auth.js', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.user = { userId: 'producer-1', email: 'producer@test.com', role: mockUserRole };
    next();
  },
}));

// Import beats router directly (not the full app)
const { beatsRouter } = await import('@/modules/beats/route.js');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/beats', beatsRouter);
  return app;
}

describe('License HTTP API', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRole = 'BEATMAKER';
    app = createApp();
  });

  describe('GET /api/v1/beats/:id/licenses', () => {
    it('should return 200 with licenses', async () => {
      const licenses = [
        { id: 'lic-1', type: 'BASIC', priceCents: 500, isActive: true, createdAt: new Date().toISOString(), beatId: 'beat-1' },
      ];
      mockGetLicenses.mockResolvedValue(licenses);

      const res = await request(app).get('/api/v1/beats/beat-1/licenses');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].type).toBe('BASIC');
      expect(mockGetLicenses).toHaveBeenCalledWith('beat-1', 'producer-1');
    });

    it('should return 404 when beat does not exist', async () => {
      mockGetLicenses.mockRejectedValue(new MockBeatNotFoundError('nonexistent'));

      const res = await request(app).get('/api/v1/beats/nonexistent/licenses');

      expect(res.status).toBe(404);
      expect(res.body.type).toBe('https://mingarecords.com/errors/not-found');
    });

    it('should return 403 when user is not the owner', async () => {
      mockGetLicenses.mockRejectedValue(new MockBeatForbiddenError());

      const res = await request(app).get('/api/v1/beats/beat-1/licenses');

      expect(res.status).toBe(403);
      expect(res.body.type).toBe('https://mingarecords.com/errors/forbidden');
    });
  });

  describe('PUT /api/v1/beats/:id/licenses', () => {
    it('should return 200 with upserted licenses', async () => {
      const licenses = [
        { id: 'lic-1', type: 'BASIC', priceCents: 500, isActive: true, beatId: 'beat-1' },
      ];
      mockUpsertLicenses.mockResolvedValue(licenses);

      const res = await request(app)
        .put('/api/v1/beats/beat-1/licenses')
        .send([{ type: 'BASIC', priceCents: 500, isActive: true }]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(mockUpsertLicenses).toHaveBeenCalledWith('beat-1', 'producer-1', [
        { type: 'BASIC', priceCents: 500, isActive: true },
      ]);
    });

    it('should return 400 for invalid license type', async () => {
      const res = await request(app)
        .put('/api/v1/beats/beat-1/licenses')
        .send([{ type: 'INVALID', priceCents: 500 }]);

      expect(res.status).toBe(400);
      expect(res.body.type).toBe('https://mingarecords.com/errors/validation');
    });

    it('should return 400 for empty array', async () => {
      const res = await request(app)
        .put('/api/v1/beats/beat-1/licenses')
        .send([]);

      expect(res.status).toBe(400);
      expect(res.body.type).toBe('https://mingarecords.com/errors/validation');
    });

    it('should return 422 when price is out of range', async () => {
      mockUpsertLicenses.mockRejectedValue(new MockPriceOutOfRangeError('BASIC', 99999, 100, 5000));

      const res = await request(app)
        .put('/api/v1/beats/beat-1/licenses')
        .send([{ type: 'BASIC', priceCents: 99999 }]);

      expect(res.status).toBe(422);
      expect(res.body.type).toBe('https://mingarecords.com/errors/price-out-of-range');
    });

    it('should return 404 when beat does not exist', async () => {
      mockUpsertLicenses.mockRejectedValue(new MockBeatNotFoundError('nonexistent'));

      const res = await request(app)
        .put('/api/v1/beats/nonexistent/licenses')
        .send([{ type: 'BASIC', priceCents: 500 }]);

      expect(res.status).toBe(404);
    });

    it('should return 403 when user is not the owner', async () => {
      mockUpsertLicenses.mockRejectedValue(new MockBeatForbiddenError());

      const res = await request(app)
        .put('/api/v1/beats/beat-1/licenses')
        .send([{ type: 'BASIC', priceCents: 500 }]);

      expect(res.status).toBe(403);
    });
  });
});
