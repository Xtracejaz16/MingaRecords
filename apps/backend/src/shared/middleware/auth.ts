    import jwt from 'jsonwebtoken';
    import type { Request, Response, NextFunction } from 'express';
    import { env } from '@/config/env.js';

    import type { JWTPayload } from '@/modules/auth/types.js';

    export function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
    ): void {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: 'MISSING_TOKEN', message: 'Token requerido' });
        return;
    }
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        res.status(401).json({ error: 'INVALID_TOKEN_FORMAT', message: 'Formato: Bearer <token>' });
        return;
    }
    const token = parts[1];

    try {
        const payload = jwt.verify(token, env.jwtSecret, {
        algorithms: ['HS256'],
        }) as JWTPayload;
        (req as any).user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        };

        next();
    } catch (error) {

        if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: 'TOKEN_EXPIRED', message: 'El token expiró, usá refresh' });
        return;
        }
        res.status(401).json({ error: 'INVALID_TOKEN', message: 'Token inválido' });
    }
    }