import type {
    User,
    VerificationToken,
} from './types.js';

import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '@/config/env.js';

const adapter = new PrismaPg({
    connectionString: env.databaseUrl,
});

const prisma = new PrismaClient({ adapter });

export async function createUser(
    data: {
        email: string;
        passwordHash: string;
        alias: string;
        role: 'producer' | 'artist';
    }
): Promise<User> {
    const user = await prisma.user.create({ data });
    return user as unknown as User;
}

export async function getUserByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user as unknown as User | null;
}

export async function getUserById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user as unknown as User | null;
}

export async function markEmailVerified(userId: string): Promise<void> {
    await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: true },
    });
}

export async function createRefreshToken(
    data: {
        token: string;
        userId: string;
        expiresAt: Date;
    }
): Promise<void> {
    await prisma.refreshToken.create({ data });
}

export async function getRefreshToken(token: string): Promise<{ userId: string; expiresAt: Date } | null> {
    const refreshToken = await prisma.refreshToken.findUnique({
        where: { token },
        select: { userId: true, expiresAt: true },
    });
    return refreshToken;
}

export async function deleteRefreshToken(token: string): Promise<void> {
    await prisma.refreshToken.delete({
        where: { token },
    });
}

export async function rotateRefreshToken(
    oldToken: string,
    newTokenData: { token: string; userId: string; expiresAt: Date }
): Promise<void> {
    await prisma.$transaction([
        prisma.refreshToken.delete({ where: { token: oldToken } }),
        prisma.refreshToken.create({ data: newTokenData }),
    ]);
}

export async function createVerificationToken(
    data: {
        tokenHash: string;
        userId: string;
        expiresAt: Date;
    }
): Promise<void> {
    await prisma.verificationToken.create({ data });
}

export async function getVerificationTokenByHash(tokenHash: string): Promise<VerificationToken | null> {
    const verificationToken = await prisma.verificationToken.findUnique({
        where: { tokenHash },
    });
    return verificationToken;
}

export async function deleteVerificationTokenByHash(tokenHash: string): Promise<void> {
    await prisma.verificationToken.delete({
        where: { tokenHash },
    });
}

export async function deleteVerificationTokensByUserId(userId: string): Promise<void> {
    await prisma.verificationToken.deleteMany({
        where: { userId },
    });
}

export async function markEmailVerifiedAndMarkTokenUsed(
    userId: string,
    tokenId: string
): Promise<void> {
    await prisma.$transaction([
        prisma.user.update({
            where: { id: userId },
            data: { emailVerified: true },
        }),
        prisma.verificationToken.update({
            where: { id: tokenId },
            data: { usedAt: new Date() },
        }),
    ]);
}
