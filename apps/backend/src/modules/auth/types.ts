import { z } from 'zod';
import type { Request } from 'express';

export type Role = 'BEATMAKER' | 'BUYER' | 'ADMIN';

export interface User {
    id: string;
    email: string;
    passwordHash: string;
    alias: string;
    role: Role;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface JWTPayload {
    userId: string;
    email: string;
    role: Role;
    iat: number;
    exp: number;
}

export interface VerificationToken {
    id: string;
    tokenHash: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
    usedAt: Date | null;
}

export const RegisterInputSchema = z.object({
    email: z.string().email('Debe ser un email valido'),
    password: z.string().min(8, 'Mínimo 8 caracteres')
        .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
        .regex(/[0-9]/, 'Debe tener al menos un número'),
    alias: z.string().min(1, 'El alias es obligatorio'),
    role: z.enum(['BEATMAKER', 'BUYER'], {
        message: 'El rol debe ser BEATMAKER o BUYER',
    }),
});

export const LoginInputSchema = z.object({
    email: z.string().email('Debe ser un email valido'),
    password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const VerifyEmailSchema = z.object({
    token: z.string().min(1, 'Token de verificación requerido'),
});

export const ResendVerificationSchema = z.object({
    email: z.string().email('Debe ser un email valido'),
});

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        email: string;
        alias: string;
        role: Role;
        emailVerified: boolean;
    };
}

export interface MeResponse {
    id: string;
    email: string;
    alias: string;
    role: Role;
    emailVerified: boolean;
}

export interface VerifyEmailResponse {
    status: 'VERIFIED' | 'ALREADY_VERIFIED';
    message: string;
}

export type RegisterInput = z.infer<typeof RegisterInputSchema>;
export type LoginInput = z.infer<typeof LoginInputSchema>;
export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>;

export interface AuthenticatedRequest extends Request {
    user: JWTPayload;
}
