import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules before importing service
vi.mock('@/modules/auth/repository.js', () => ({
    createUser: vi.fn(),
    getUserByEmail: vi.fn(),
    getUserById: vi.fn(),
    createRefreshToken: vi.fn(),
    getRefreshToken: vi.fn(),
    deleteRefreshToken: vi.fn(),
    rotateRefreshToken: vi.fn(),
    createVerificationToken: vi.fn(),
    getVerificationTokenByHash: vi.fn(),
    deleteVerificationTokensByUserId: vi.fn(),
    markEmailVerifiedAndMarkTokenUsed: vi.fn(),
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

vi.mock('@/modules/notification/index.js', () => ({
    ResendNotificationAdapter: vi.fn().mockImplementation(() => ({
        sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    })),
}));

vi.mock('resend', () => ({
    Resend: vi.fn().mockImplementation(() => ({})),
}));

vi.mock('@/config/env.js', () => ({
    env: {
        jwtSecret: 'test-secret',
        databaseUrl: 'postgresql://test',
        resendApiKey: 'test-key',
        frontendUrl: 'http://localhost:5173',
        resendSenderEmail: 'onboarding@resend.dev',
        apiUrl: 'http://localhost:3001',
        corsOrigin: 'http://localhost:5173',
        port: 3001,
        isProduction: false,
    },
}));

vi.mock('crypto', () => ({
    randomBytes: vi.fn().mockReturnValue({
        toString: vi.fn().mockReturnValue('mock-raw-token-64-chars-hex-string'),
    }),
    createHash: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnThis(),
        digest: vi.fn().mockReturnValue('mock-hashed-token-sha256'),
    }),
}));

import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    verifyEmail,
    resendVerificationEmail,
    getMe,
} from '@/modules/auth/service.js';

import {
    createUser,
    getUserByEmail,
    getUserById,
    createRefreshToken,
    getRefreshToken,
    deleteRefreshToken,
    rotateRefreshToken,
    createVerificationToken,
    getVerificationTokenByHash,
    deleteVerificationTokensByUserId,
    markEmailVerifiedAndMarkTokenUsed,
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
        vi.mocked(deleteVerificationTokensByUserId).mockResolvedValue(undefined);
        vi.mocked(createVerificationToken).mockResolvedValue(undefined);

        const result = await registerUser({
            email: 'test@example.com',
            password: 'Password123',
            alias: 'testuser',
            role: 'artist',
        });

        expect(result.accessToken).toBe('access-token');
        expect(result.refreshToken).toBe('mock-raw-token-64-chars-hex-string');
        expect(result.user.id).toBe('user-1');
        expect(result.user.role).toBe('artist');
        expect(createUser).toHaveBeenCalledWith({
            email: 'test@example.com',
            passwordHash: 'hashed-password',
            alias: 'testuser',
            role: 'artist',
        });
        expect(createRefreshToken).toHaveBeenCalled();
        expect(deleteVerificationTokensByUserId).toHaveBeenCalledWith('user-1');
        expect(createVerificationToken).toHaveBeenCalledWith({
            tokenHash: 'mock-hashed-token-sha256',
            userId: 'user-1',
            expiresAt: expect.any(Date),
        });
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

    it('should still register user even if email sending fails', async () => {
        vi.mocked(getUserByEmail).mockResolvedValue(null);
        vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
        vi.mocked(createUser).mockResolvedValue(mockUser);
        vi.mocked(jwt.sign).mockReturnValue('access-token' as never);
        vi.mocked(createRefreshToken).mockResolvedValue(undefined);
        vi.mocked(deleteVerificationTokensByUserId).mockResolvedValue(undefined);
        vi.mocked(createVerificationToken).mockResolvedValue(undefined);

        // Mock notification adapter to throw
        const { ResendNotificationAdapter } = await import('@/modules/notification/index.js');
        vi.mocked(ResendNotificationAdapter).mockImplementation(() => ({
            sendVerificationEmail: vi.fn().mockRejectedValue(new Error('Email service down')),
        }));

        const result = await registerUser({
            email: 'test@example.com',
            password: 'Password123',
            alias: 'testuser',
            role: 'artist',
        });

        expect(result.accessToken).toBe('access-token');
        expect(result.user.id).toBe('user-1');
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
        expect(result.refreshToken).toBe('mock-raw-token-64-chars-hex-string');
        expect(rotateRefreshToken).toHaveBeenCalledWith('old-token', {
            token: 'mock-raw-token-64-chars-hex-string',
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
    it('should verify email successfully with hashed token', async () => {
        vi.mocked(getVerificationTokenByHash).mockResolvedValue({
            id: 'vt-1',
            tokenHash: 'mock-hashed-token-sha256',
            userId: 'user-1',
            expiresAt: new Date(Date.now() + 86400000),
            createdAt: new Date(),
        });
        vi.mocked(getUserById).mockResolvedValue(mockUnverifiedUser);
        vi.mocked(markEmailVerifiedAndMarkTokenUsed).mockResolvedValue(undefined);

        const result = await verifyEmail('raw-token');

        expect(result.status).toBe('VERIFIED');
        expect(result.message).toBe('Email verificado exitosamente');
        expect(markEmailVerifiedAndMarkTokenUsed).toHaveBeenCalledWith('user-1', 'vt-1');
    });

    it('should return ALREADY_VERIFIED if user is already verified', async () => {
        vi.mocked(getVerificationTokenByHash).mockResolvedValue({
            id: 'vt-1',
            tokenHash: 'mock-hashed-token-sha256',
            userId: 'user-1',
            expiresAt: new Date(Date.now() + 86400000),
            createdAt: new Date(),
            usedAt: new Date(),
        });
        vi.mocked(getUserById).mockResolvedValue(mockUser);

        const result = await verifyEmail('raw-token');

        expect(result.status).toBe('ALREADY_VERIFIED');
        expect(markEmailVerifiedAndMarkTokenUsed).not.toHaveBeenCalled();
    });

    it('should throw INVALID_TOKEN if verification token not found', async () => {
        vi.mocked(getVerificationTokenByHash).mockResolvedValue(null);

        await expect(verifyEmail('bad-token')).rejects.toThrow('INVALID_TOKEN');
    });

    it('should throw TOKEN_EXPIRED if verification token is expired', async () => {
        vi.mocked(getVerificationTokenByHash).mockResolvedValue({
            id: 'vt-1',
            tokenHash: 'mock-hashed-token-sha256',
            userId: 'user-1',
            expiresAt: new Date(Date.now() - 86400000),
            createdAt: new Date(),
        });

        await expect(verifyEmail('expired-token')).rejects.toThrow('TOKEN_EXPIRED');
    });

    it('should throw INVALID_TOKEN if token is used but user is not verified (inconsistent state)', async () => {
        vi.mocked(getVerificationTokenByHash).mockResolvedValue({
            id: 'vt-1',
            tokenHash: 'mock-hashed-token-sha256',
            userId: 'user-1',
            expiresAt: new Date(Date.now() + 86400000),
            createdAt: new Date(),
            usedAt: new Date(),
        });
        vi.mocked(getUserById).mockResolvedValue(mockUnverifiedUser);

        await expect(verifyEmail('raw-token')).rejects.toThrow('INVALID_TOKEN');
    });
});

describe('resendVerificationEmail', () => {
    it('should send verification email for unverified user', async () => {
        vi.mocked(getUserByEmail).mockResolvedValue(mockUnverifiedUser);
        vi.mocked(deleteVerificationTokensByUserId).mockResolvedValue(undefined);
        vi.mocked(createVerificationToken).mockResolvedValue(undefined);

        await resendVerificationEmail('test@example.com');

        expect(deleteVerificationTokensByUserId).toHaveBeenCalledWith('user-1');
        expect(createVerificationToken).toHaveBeenCalledWith({
            tokenHash: 'mock-hashed-token-sha256',
            userId: 'user-1',
            expiresAt: expect.any(Date),
        });
    });

    it('should not throw if user does not exist', async () => {
        vi.mocked(getUserByEmail).mockResolvedValue(null);

        await expect(resendVerificationEmail('unknown@example.com')).resolves.toBeUndefined();
    });

    it('should not throw if user is already verified', async () => {
        vi.mocked(getUserByEmail).mockResolvedValue(mockUser);

        await expect(resendVerificationEmail('test@example.com')).resolves.toBeUndefined();
        expect(deleteVerificationTokensByUserId).not.toHaveBeenCalled();
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
