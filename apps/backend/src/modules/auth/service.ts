import type {
    User,
    RegisterInput,
    LoginInput,
    AuthResponse,
    MeResponse,
    VerifyEmailResponse,
    JWTPayload,
} from './types.js';

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
} from './repository.js';

import bcrypt from 'bcryptjs';

import jwt from 'jsonwebtoken';

import { randomBytes, createHash } from 'crypto';

import { Resend } from 'resend';

import { env } from '@/config/env.js';

import { ResendNotificationAdapter } from '@/modules/notification/index.js';

const resend = new Resend(env.resendApiKey);
const notificationPort = new ResendNotificationAdapter(resend, env.resendSenderEmail);

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

function signAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, env.jwtSecret, {
        algorithm: 'HS256',
        expiresIn: '15m',
    });
}

function generateToken(): string {
    return randomBytes(32).toString('hex');
}

function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await getUserByEmail(input.email);
    if (existingUser) {
        throw new Error('EMAIL_EXISTS');
    }

    const passwordHash = await hashPassword(input.password);

    const user = await createUser({
        email: input.email,
        passwordHash,
        alias: input.alias,
        role: input.role,
    });

    const accessToken = signAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
    });
    const refreshTokenValue = generateToken();

    await createRefreshToken({
        token: refreshTokenValue,
        userId: user.id,
        expiresAt: addDays(new Date(), 7),
    });

    // Invalidate any existing tokens before creating new one
    await deleteVerificationTokensByUserId(user.id);

    const verificationToken = generateToken();
    const verificationTokenHash = hashToken(verificationToken);

    await createVerificationToken({
        tokenHash: verificationTokenHash,
        userId: user.id,
        expiresAt: addDays(new Date(), 1),
    });

    // Send verification email - if it fails, log but don't block registration
    try {
        const verificationUrl = `${env.frontendUrl}/#/verify-email?token=${verificationToken}`;
        await notificationPort.sendVerificationEmail({
            to: user.email,
            verificationUrl,
        });
    } catch (err) {
        console.error('Failed to send verification email during registration:', err);
        // User is still created - frontend will show "Account created but we couldn't send the email"
    }

    return {
        accessToken,
        refreshToken: refreshTokenValue,
        user: {
            id: user.id,
            email: user.email,
            alias: user.alias,
            role: user.role,
            emailVerified: user.emailVerified,
        },
    };
}

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
    const user = await getUserByEmail(input.email);
    if (!user) {
        throw new Error('INVALID_CREDENTIALS');
    }

    const isValid = await comparePassword(input.password, user.passwordHash);
    if (!isValid) {
        throw new Error('INVALID_CREDENTIALS');
    }

    if (!user.emailVerified) {
        throw new Error('EMAIL_NOT_VERIFIED');
    }

    const accessToken = signAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
    });
    const refreshTokenValue = generateToken();

    await createRefreshToken({
        token: refreshTokenValue,
        userId: user.id,
        expiresAt: addDays(new Date(), 7),
    });

    return {
        accessToken,
        refreshToken: refreshTokenValue,
        user: {
            id: user.id,
            email: user.email,
            alias: user.alias,
            role: user.role,
            emailVerified: user.emailVerified,
        },
    };
}

export async function logoutUser(refreshToken: string): Promise<void> {
    await deleteRefreshToken(refreshToken);
}

export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenData = await getRefreshToken(refreshToken);
    if (!tokenData) {
        throw new Error('INVALID_TOKEN');
    }

    if (new Date() > tokenData.expiresAt) {
        throw new Error('INVALID_TOKEN');
    }

    const user = await getUserById(tokenData.userId);
    if (!user) {
        throw new Error('INVALID_TOKEN');
    }

    const accessToken = signAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
    });
    const newRefreshTokenValue = generateToken();

    await rotateRefreshToken(refreshToken, {
        token: newRefreshTokenValue,
        userId: user.id,
        expiresAt: addDays(new Date(), 7),
    });

    return { accessToken, refreshToken: newRefreshTokenValue };
}

export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
    const hashedToken = hashToken(token);
    const verificationToken = await getVerificationTokenByHash(hashedToken);

    if (!verificationToken) {
        throw new Error('INVALID_TOKEN');
    }

    if (new Date() > verificationToken.expiresAt) {
        throw new Error('TOKEN_EXPIRED');
    }

    // Idempotency: if user already verified, return success
    const user = await getUserById(verificationToken.userId);
    if (user?.emailVerified) {
        return { status: 'ALREADY_VERIFIED', message: 'Email ya verificado exitosamente' };
    }

    // Used token with unverified user = inconsistent state
    if (verificationToken.usedAt) {
        throw new Error('INVALID_TOKEN');
    }

    // Atomic operation: mark verified + mark token used
    await markEmailVerifiedAndMarkTokenUsed(verificationToken.userId, verificationToken.id);

    return { status: 'VERIFIED', message: 'Email verificado exitosamente' };
}

export async function resendVerificationEmail(email: string): Promise<void> {
    const user = await getUserByEmail(email);

    // Don't reveal if user exists or not
    if (!user) {
        return;
    }

    if (user.emailVerified) {
        return;
    }

    // Invalidate any existing tokens
    await deleteVerificationTokensByUserId(user.id);

    const verificationToken = generateToken();
    const verificationTokenHash = hashToken(verificationToken);

    await createVerificationToken({
        tokenHash: verificationTokenHash,
        userId: user.id,
        expiresAt: addDays(new Date(), 1),
    });

    const verificationUrl = `${env.frontendUrl}/#/verify-email?token=${verificationToken}`;
    try {
        await notificationPort.sendVerificationEmail({
            to: user.email,
            verificationUrl,
        });
    } catch (err) {
        console.error('Failed to resend verification email:', err);
    }
}

export async function getMe(userId: string): Promise<MeResponse> {
    const user = await getUserById(userId);
    if (!user) {
        throw new Error('USER_NOT_FOUND');
    }
    return {
        id: user.id,
        email: user.email,
        alias: user.alias,
        role: user.role,
        emailVerified: user.emailVerified,
    };
}
