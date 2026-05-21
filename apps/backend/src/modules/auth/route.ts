import { Router } from 'express';
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    verifyEmail,
    getMe,
} from './service.js';
import {
    RegisterInputSchema,
    LoginInputSchema,
} from './types.js';
import type { AuthenticatedRequest } from './types.js';
import type { Request, Response, NextFunction } from 'express';
import { requireAuth } from '@/shared/middleware/auth.js';
import { env } from '@/config/env.js';
import { Prisma } from '../../generated/prisma/client.js';

const refreshTokenCookieOptions = {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
};

const router = Router();

router.post('/register', async (req, res) => {
    try {
        const input = RegisterInputSchema.parse(req.body);
        const result = await registerUser(input);
        res.cookie('refreshToken', result.refreshToken, refreshTokenCookieOptions);
        res.status(201).json({ accessToken: result.accessToken, user: result.user });
    } catch (error) {
        handleAuthError(error, res);
    }
});

router.post('/login', async (req, res) => {
    try {
        const input = LoginInputSchema.parse(req.body);
        const result = await loginUser(input);
        res.cookie('refreshToken', result.refreshToken, refreshTokenCookieOptions);
        res.status(200).json({ accessToken: result.accessToken, user: result.user });
    } catch (error) {
        handleAuthError(error, res);
    }
});

router.post('/logout', async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            res.status(400).json({ error: 'MISSING_REFRESH_TOKEN' });
            return;
        }
        await logoutUser(refreshToken);
        res.clearCookie('refreshToken', refreshTokenCookieOptions);
        res.status(204).send();
    } catch (error) {
        handleAuthError(error, res);
    }
});

router.get('/me', requireAuth, async (req, res) => {
    try {
        const userId = (req as AuthenticatedRequest).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'UNAUTHORIZED' });
            return;
        }
        const result = await getMe(userId);
        res.status(200).json(result);
    } catch (error) {
        handleAuthError(error, res);
    }
});

router.get('/verify-email', async (req, res) => {
    try {
        const token = req.query.token as string;
        if (!token) {
            res.status(400).json({ error: 'MISSING_TOKEN' });
            return;
        }
        const result = await verifyEmail(token);
        res.status(200).json(result);
    } catch (error) {
        handleAuthError(error, res);
    }
});

router.post('/refresh', async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            res.status(401).json({ error: 'MISSING_REFRESH_TOKEN' });
            return;
        }
        const result = await refreshAccessToken(refreshToken);
        res.cookie('refreshToken', result.refreshToken, refreshTokenCookieOptions);
        res.status(200).json({ accessToken: result.accessToken });
    } catch (error) {
        handleAuthError(error, res);
    }
});

function handlePrismaError(error: Prisma.PrismaClientKnownRequestError, res: Response): boolean {
    switch (error.code) {
        case 'P2002': {
            const target = (error.meta?.target as string[]) ?? [];
            res.status(409).json({
                error: 'DUPLICATE_ENTRY',
                message: `Ya existe un registro con ese ${target.join(', ')}`,
            });
            return true;
        }
        case 'P2025':
            res.status(404).json({
                error: 'NOT_FOUND',
                message: 'Registro no encontrado',
            });
            return true;
        case 'P2003':
            res.status(400).json({
                error: 'FOREIGN_KEY_ERROR',
                message: 'Referencia inválida en los datos',
            });
            return true;
        default:
            return false;
    }
}

function handleAuthError(error: unknown, res: Response): void {
    if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
        if (handlePrismaError(error as Prisma.PrismaClientKnownRequestError, res)) return;
    }

    if (error instanceof Error && error.name === 'ZodError') {
        res.status(400).json({
            error: 'VALIDATION_ERROR',
            message: error.message,
        });
        return;
    }

    const message = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    switch (message) {
        case 'EMAIL_EXISTS':
            res.status(409).json({ error: 'EMAIL_EXISTS', message: 'El email ya está registrado' });
            break;
        case 'INVALID_CREDENTIALS':
            res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Email o contraseña incorrectos' });
            break;
        case 'EMAIL_NOT_VERIFIED':
            res.status(403).json({ error: 'EMAIL_NOT_VERIFIED', message: 'Verificá tu email antes de iniciar sesión' });
            break;
        case 'INVALID_TOKEN':
        case 'TOKEN_EXPIRED':
            res.status(401).json({ error: 'INVALID_TOKEN', message: 'Token inválido o expirado' });
            break;
        case 'USER_NOT_FOUND':
            res.status(404).json({ error: 'USER_NOT_FOUND', message: 'Usuario no encontrado' });
            break;
        default:
            console.error('Unexpected error:', error);
            res.status(500).json({ error: 'SERVER_ERROR', message: 'Error interno del servidor' });
    }
}

export { router as authRouter };
