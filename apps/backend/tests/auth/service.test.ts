import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules before importing service
vi.mock('@/modules/auth/repository.js', () => ({
    createUser: vi.fn(),
    getUserByEmail: vi.fn(),
    getUserById: vi.fn(),
    markEmailVerified: vi.fn(),
    createRefreshToken: vi.fn(),
    getRefreshToken: vi.fn(),
    deleteRefreshToken: vi.fn(),
    rotateRefreshToken: vi.fn(),
    createVerificationToken: vi.fn(),
    getVerificationToken: vi.fn(),
    deleteVerificationToken: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
    default: {
        hash: vi.fn(),
        compare: vi.fn(),
    },
}));

vi.mock('jsonwebtoken', () => ({
    default: {
        sign: vi.fn(),
    },
}));

vi.mock('resend', () => ({
    Resend: vi.fn().mockImplementation(() => ({
        emails: { send: vi.fn().mockResolvedValue({}) },
    })),
}));

vi.mock('@/config/env.js', () => ({
    env: {
        jwtSecret: 'test-secret',
        databaseUrl: 'postgresql://test',
        resendApiKey: 'test-key',
        port: 3000,
        isProduction: false,
    },
}));

vi.mock('crypto', () => ({
    randomUUID: vi.fn().mockReturnValue('mock-uuid-token'),
}));

import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    verifyEmail,
    getMe,
} from '@/modules/auth/service.js';

import {
    createUser,
    getUserByEmail,
    getUserById,
    markEmailVerified,
    createRefreshToken,
    getRefreshToken,
    deleteRefreshToken,
    rotateRefreshToken,
    createVerificationToken,
    getVerificationToken,
    deleteVerificationToken,
} from '@/modules/auth/repository.js';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    alias: 'testuser',
    role: 'artist' as const,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const mockUnverifiedUser = {
    ...mockUser,
    emailVerified: false,
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('registerUser', () => {
    it('should register a new user successfully', async () => {
        vi.mocked(getUserByEmail).mockResolvedValue(null);
        vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
        vi.mocked(createUser).mockResolvedValue(mockUser);
        vi.mocked(jwt.sign).mockReturnValue('access-token' as never);
        vi.mocked(createRefreshToken).mockResolvedValue(undefined);
        vi.mocked(createVerificationToken).mockResolvedValue(undefined);

        const result = await registerUser({
            email: 'test@example.com',
            password: 'Password123',
            alias: 'testuser',
            role: 'artist',
        });

        expect(result.accessToken).toBe('access-token');
        expect(result.refreshToken).toBe('mock-uuid-token');
        expect(result.user.id).toBe('user-1');
        expect(result.user.role).toBe('artist');
        expect(createUser).toHaveBeenCalledWith({
            email: 'test@example.com',
            passwordHash: 'hashed-password',
            alias: 'testuser',
            role: 'artist',
        });
        expect(createRefreshToken).toHaveBeenCalled();
        expect(createVerificationToken).toHaveBeenCalled();
    });

    it('should throw EMAIL_EXISTS if user already exists', async () => {
        vi.mocked(getUserByEmail).mockResolvedValue(mockUser);

        await expect(
            registerUser({
                email: 'test@example.com',
                password: 'Password123',
                alias: 'testuser',
                role: 'artist',
            })
        ).rejects.toThrow('EMAIL_EXISTS');
    });
});

describe('loginUser', () => {
    it('should login successfully with valid credentials', async () => {
        vi.mocked(getUserByEmail).mockResolvedValue(mockUser);
        vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
        vi.mocked(jwt.sign).mockReturnValue('access-token' as never);
        vi.mocked(createRefreshToken).mockResolvedValue(undefined);

        const result = await loginUser({
            email: 'test@example.com',
            password: 'Password123',
        });

        expect(result.accessToken).toBe('access-token');
        expect(result.user.id).toBe('user-1');
    });

    it('should throw INVALID_CREDENTIALS if user not found', async () => {
        vi.mocked(getUserByEmail).mockResolvedValue(null);

        await expect(
            loginUser({ email: 'unknown@example.com', password: 'Password123' })
        ).rejects.toThrow('INVALID_CREDENTIALS');
    });

    it('should throw INVALID_CREDENTIALS if password is wrong', async () => {
        vi.mocked(getUserByEmail).mockResolvedValue(mockUser);
        vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

        await expect(
            loginUser({ email: 'test@example.com', password: 'wrong' })
        ).rejects.toThrow('INVALID_CREDENTIALS');
    });

    it('should throw EMAIL_NOT_VERIFIED if email is not verified', async () => {
        vi.mocked(getUserByEmail).mockResolvedValue(mockUnverifiedUser);
        vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

        await expect(
            loginUser({ email: 'test@example.com', password: 'Password123' })
        ).rejects.toThrow('EMAIL_NOT_VERIFIED');
    });
});

describe('logoutUser', () => {
    it('should delete refresh token', async () => {
        vi.mocked(deleteRefreshToken).mockResolvedValue(undefined);

        await logoutUser('some-token');

        expect(deleteRefreshToken).toHaveBeenCalledWith('some-token');
    });
});

describe('refreshAccessToken', () => {
    it('should refresh tokens successfully', async () => {
        vi.mocked(getRefreshToken).mockResolvedValue({
            userId: 'user-1',
            expiresAt: new Date(Date.now() + 86400000),
        });
        vi.mocked(getUserById).mockResolvedValue(mockUser);
        vi.mocked(jwt.sign).mockReturnValue('new-access-token' as never);
        vi.mocked(rotateRefreshToken).mockResolvedValue(undefined);

        const result = await refreshAccessToken('old-token');

        expect(result.accessToken).toBe('new-access-token');
        expect(result.refreshToken).toBe('mock-uuid-token');
        expect(rotateRefreshToken).toHaveBeenCalledWith('old-token', {
            token: 'mock-uuid-token',
            userId: 'user-1',
            expiresAt: expect.any(Date),
        });
    });

    it('should throw INVALID_TOKEN if token not found', async () => {
        vi.mocked(getRefreshToken).mockResolvedValue(null);

        await expect(refreshAccessToken('bad-token')).rejects.toThrow('INVALID_TOKEN');
    });

    it('should throw INVALID_TOKEN if token is expired', async () => {
        vi.mocked(getRefreshToken).mockResolvedValue({
            userId: 'user-1',
            expiresAt: new Date(Date.now() - 86400000),
        });

        await expect(refreshAccessToken('expired-token')).rejects.toThrow('INVALID_TOKEN');
    });

    it('should throw INVALID_TOKEN if user not found', async () => {
        vi.mocked(getRefreshToken).mockResolvedValue({
            userId: 'user-1',
            expiresAt: new Date(Date.now() + 86400000),
        });
        vi.mocked(getUserById).mockResolvedValue(null);

        await expect(refreshAccessToken('token')).rejects.toThrow('INVALID_TOKEN');
    });
});

describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
        vi.mocked(getVerificationToken).mockResolvedValue({
            id: 'vt-1',
            token: 'verify-token',
            userId: 'user-1',
            expiresAt: new Date(Date.now() + 86400000),
            createdAt: new Date(),
        });
        vi.mocked(markEmailVerified).mockResolvedValue(undefined);
        vi.mocked(deleteVerificationToken).mockResolvedValue(undefined);

        const result = await verifyEmail('verify-token');

        expect(result.message).toBe('Email verificado exitosamente');
        expect(markEmailVerified).toHaveBeenCalledWith('user-1');
        expect(deleteVerificationToken).toHaveBeenCalledWith('verify-token');
    });

    it('should throw INVALID_TOKEN if verification token not found', async () => {
        vi.mocked(getVerificationToken).mockResolvedValue(null);

        await expect(verifyEmail('bad-token')).rejects.toThrow('INVALID_TOKEN');
    });

    it('should throw TOKEN_EXPIRED if verification token is expired', async () => {
        vi.mocked(getVerificationToken).mockResolvedValue({
            id: 'vt-1',
            token: 'verify-token',
            userId: 'user-1',
            expiresAt: new Date(Date.now() - 86400000),
            createdAt: new Date(),
        });

        await expect(verifyEmail('expired-token')).rejects.toThrow('TOKEN_EXPIRED');
    });
});

describe('getMe', () => {
    it('should return user data', async () => {
        vi.mocked(getUserById).mockResolvedValue(mockUser);

        const result = await getMe('user-1');

        expect(result.id).toBe('user-1');
        expect(result.email).toBe('test@example.com');
        expect(result.role).toBe('artist');
        expect(result.emailVerified).toBe(true);
    });

    it('should throw USER_NOT_FOUND if user does not exist', async () => {
        vi.mocked(getUserById).mockResolvedValue(null);

        await expect(getMe('unknown')).rejects.toThrow('USER_NOT_FOUND');
    });
});
