export type AuthTab = 'login' | 'register';
export type AuthRole = 'BEATMAKER' | 'BUYER' | 'ADMIN';

export interface AuthDraft {
  email: string;
  password: string;
  alias: string;
  role: AuthRole;
  remember: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  alias: string;
  role: AuthRole;
  createdAt: string;
}

export interface AuthSession {
  id: string;
  email: string;
  alias: string;
  role: AuthRole;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthResult {
  ok: boolean;
  message: string;
  user?: AuthSession;
}

export function createUser(input: AuthDraft, normalizedEmail: string): AuthUser {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `user-${Date.now()}`,
    email: normalizedEmail,
    alias: input.alias.trim() || 'Minguit@ sin nombre',
    role: input.role,
    createdAt: new Date().toISOString(),
  };
}

export function toSession(user: AuthUser): AuthSession {
  return {
    id: user.id,
    email: user.email,
    alias: user.alias,
    role: user.role,
    emailVerified: false,
    createdAt: user.createdAt,
  };
}
