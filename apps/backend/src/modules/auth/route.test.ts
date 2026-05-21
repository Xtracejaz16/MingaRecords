import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock service layer
vi.mock('./service.js', () => ({
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
    refreshAccessToken: vi.fn(),
    verifyEmail: vi.fn(),
    getMe: vi.fn(),
}));

// Mock env
vi.mock('@/config/env.js', () => ({
    env: {
        jwtSecret: 'test-secret',
        databaseUrl: 'postgresql://test',
        resendApiKey: 'test-key',
        port: 3000,
        isProduction: false,
    },
}));

// Mock auth middleware to pass through
vi.mock('@/shared/middleware/auth.js', () => ({
    requireAuth: (req: any, _res: any, next: any) => {
        req.user = { userId: 'user-1', email: 'test@example.com', role: 'artist' };
        next();
    },
}));

// Mock Prisma
vi.mock('../../generated/prisma/client.js', () => ({
    Prisma: {
        PrismaClientKnownRequestError: class PrismaClientKnownRequestError extends Error {
            code: string;
            meta?: Record<string, unknown>;
            constructor(message: string, { code, meta }: { code: string; meta?: Record<string, unknown> }) {
                super(message);
                this.name = 'PrismaClientKnownRequestError';
                this.code = code;
                this.meta = meta;
            }
        },
    },
}));

import { app } from '../app.js';
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    verifyEmail,
    getMe,
} from './service.js';

beforeEach(() => {
    vi.clearAllMocks();
});

describe('POST /api/v1/auth/register', () => {
    it('should register user and set refresh token cookie', async () => {
        vi.mocked(registerUser).mockResolvedValue({
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            user: { id: 'user-1', email: 'test@example.com', alias: 'testuser', role: 'artist' },
        });

        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                email: 'test@example.com',
                password: 'Password123',
                alias: 'testuser',
                role: 'artist',
            });

        expect(res.status).toBe(201);
        expect(res.body.accessToken).toBe('access-token');
        expect(res.body.user.id).toBe('user-1');
        expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 409 on EMAIL_EXISTS', async () => {
        vi.mocked(registerUser).mockRejectedValue(new Error('EMAIL_EXISTS'));

        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                email: 'existing@example.com',
                password: 'Password123',
                alias: 'testuser',
                role: 'artist',
            });

        expect(res.status).toBe(409);
        expect(res.body.error).toBe('EMAIL_EXISTS');
    });

    it('should return 400 on invalid input', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                email: 'not-an-email',
                password: 'short',
                alias: '',
                role: 'invalid',
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('VALIDATION_ERROR');
    });
});

describe('POST /api/v1/auth/login', () => {
    it('should login and return access token', async () => {
        vi.mocked(loginUser).mockResolvedValue({
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            user: { id: 'user-1', email: 'test@example.com', alias: 'testuser', role: 'artist' },
        });

        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'test@example.com', password: 'Password123' });

        expect(res.status).toBe(200);
        expect(res.body.accessToken).toBe('access-token');
    });

    it('should return 401 on INVALID_CREDENTIALS', async () => {
        vi.mocked(loginUser).mockRejectedValue(new Error('INVALID_CREDENTIALS'));

        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'test@example.com', password: 'wrong' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('INVALID_CREDENTIALS');
    });

    it('should return 403 on EMAIL_NOT_VERIFIED', async () => {
        vi.mocked(loginUser).mockRejectedValue(new Error('EMAIL_NOT_VERIFIED'));

        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({ email: 'test@example.com', password: 'Password123' });

        expect(res.status).toBe(403);
        expect(res.body.error).toBe('EMAIL_NOT_VERIFIED');
    });
});

describe('POST /api/v1/auth/logout', () => {
    it('should logout and clear cookie', async () => {
        vi.mocked(logoutUser).mockResolvedValue(undefined);

        const res = await request(app)
            .post('/api/v1/auth/logout')
            .set('Cookie', ['refreshToken=some-token']);

        expect(res.status).toBe(204);
        expect(logoutUser).toHaveBeenCalledWith('some-token');
    });

    it('should return 400 if no refresh token cookie', async () => {
        const res = await request(app).post('/api/v1/auth/logout');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('MISSING_REFRESH_TOKEN');
    });
});

describe('GET /api/v1/auth/me', () => {
    it('should return user data', async () => {
        vi.mocked(getMe).mockResolvedValue({
            id: 'user-1',
            email: 'test@example.com',
            alias: 'testuser',
            role: 'artist',
            emailVerified: true,
        });

        const res = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(200);
        expect(res.body.id).toBe('user-1');
    });

    it('should return 404 on USER_NOT_FOUND', async () => {
        vi.mocked(getMe).mockRejectedValue(new Error('USER_NOT_FOUND'));

        const res = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('USER_NOT_FOUND');
    });
});

describe('GET /api/v1/auth/verify-email', () => {
    it('should verify email successfully', async () => {
        vi.mocked(verifyEmail).mockResolvedValue({ message: 'Email verificado exitosamente' });

        const res = await request(app)
            .get('/api/v1/auth/verify-email')
            .query({ token: 'valid-token' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Email verificado exitosamente');
    });

    it('should return 400 if no token provided', async () => {
        const res = await request(app).get('/api/v1/auth/verify-email');

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('MISSING_TOKEN');
    });

    it('should return 401 on INVALID_TOKEN', async () => {
        vi.mocked(verifyEmail).mockRejectedValue(new Error('INVALID_TOKEN'));

        const res = await request(app)
            .get('/api/v1/auth/verify-email')
            .query({ token: 'bad-token' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('INVALID_TOKEN');
    });
});

describe('POST /api/v1/auth/refresh', () => {
    it('should refresh tokens successfully', async () => {
        vi.mocked(refreshAccessToken).mockResolvedValue({
            accessToken: 'new-access',
            refreshToken: 'new-refresh',
        });

        const res = await request(app)
            .post('/api/v1/auth/refresh')
            .set('Cookie', ['refreshToken=old-refresh']);

        expect(res.status).toBe(200);
        expect(res.body.accessToken).toBe('new-access');
        expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 if no refresh token cookie', async () => {
        const res = await request(app).post('/api/v1/auth/refresh');

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('MISSING_REFRESH_TOKEN');
    });

    it('should return 401 on INVALID_TOKEN', async () => {
        vi.mocked(refreshAccessToken).mockRejectedValue(new Error('INVALID_TOKEN'));

        const res = await request(app)
            .post('/api/v1/auth/refresh')
            .set('Cookie', ['refreshToken=bad-token']);

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('INVALID_TOKEN');
    });
});
