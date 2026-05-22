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
    markEmailVerified,
    createRefreshToken,
    getRefreshToken,
    deleteRefreshToken,
    rotateRefreshToken,
    createVerificationToken,
    getVerificationToken,
    deleteVerificationToken,
} from './repository.js';

import bcrypt from 'bcryptjs';

import jwt from 'jsonwebtoken';

import { randomUUID } from 'crypto';

import { Resend } from 'resend';

import { env } from '@/config/env.js';

const resend = new Resend(env.resendApiKey);

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

function generateRandomToken(): string {
    return randomUUID();
}

async function sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `http://localhost:5173/#/verify-email/${token}`;
    await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Verificá tu cuenta de Minga Records',
        html: `
            <h1>¡Bienvenido a Minga Records!</h1>
            <p>Hacé click en el siguiente link para verificar tu cuenta:</p>
            <a href="${verificationUrl}">Verificar mi cuenta</a>
            <p>Este link expira en 24 horas.</p>
        `,
    });
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
    const refreshTokenValue = generateRandomToken();

    await createRefreshToken({
        token: refreshTokenValue,
        userId: user.id,
        expiresAt: addDays(new Date(), 7),
    });

    const verificationTokenValue = generateRandomToken();
    await createVerificationToken({
        token: verificationTokenValue,
        userId: user.id,
        expiresAt: addDays(new Date(), 1),
    });

    await sendVerificationEmail(user.email, verificationTokenValue);

    return {
        accessToken,
        refreshToken: refreshTokenValue,
        user: {
            id: user.id,
            email: user.email,
            alias: user.alias,
            role: user.role,
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
    const refreshTokenValue = generateRandomToken();

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
    const newRefreshTokenValue = generateRandomToken();

    await rotateRefreshToken(refreshToken, {
        token: newRefreshTokenValue,
        userId: user.id,
        expiresAt: addDays(new Date(), 7),
    });

    return { accessToken, refreshToken: newRefreshTokenValue };
}

export async function verifyEmail(token: string): Promise<VerifyEmailResponse> {
    const verificationToken = await getVerificationToken(token);
    if (!verificationToken) {
        throw new Error('INVALID_TOKEN');
    }

    if (new Date() > verificationToken.expiresAt) {
        throw new Error('TOKEN_EXPIRED');
    }

    await markEmailVerified(verificationToken.userId);

    await deleteVerificationToken(token);
    return { message: 'Email verificado exitosamente' };
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
