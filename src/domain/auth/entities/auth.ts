export type AuthTab = 'login' | 'register';
export type AuthRole = 'artist' | 'producer';

export interface AuthDraft {
  identifier: string;
  password: string;
  alias: string;
  role: AuthRole;
  remember: boolean;
}

export interface AuthUser {
  id: string;
  identifier: string;
  password: string;
  alias: string;
  role: AuthRole;
  createdAt: string;
}

export interface AuthSession {
  id: string;
  identifier: string;
  alias: string;
  role: AuthRole;
  createdAt: string;
}

export interface AuthResult {
  ok: boolean;
  message: string;
  user?: AuthSession;
}

export const DEMO_CREDENTIALS = {
  identifier: 'demo@mingarecords.com',
  password: 'minga123',
  alias: 'Kogui Demo',
  role: 'producer' as const,
};

export function createUser(input: AuthDraft, normalizedIdentifier: string): AuthUser {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `user-${Date.now()}`,
    identifier: normalizedIdentifier,
    password: input.password,
    alias: input.alias.trim() || 'Minguit@ sin nombre',
    role: input.role,
    createdAt: new Date().toISOString(),
  };
}

export function toSession(user: AuthUser): AuthSession {
  return {
    id: user.id,
    identifier: user.identifier,
    alias: user.alias,
    role: user.role,
    createdAt: user.createdAt,
  };
}
