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

export interface DemoCredential {
  identifier: string;
  password: string;
  alias: string;
  role: AuthRole;
  createdAt: string;
}

export const DEMO_USERS = [
  {
    identifier: 'demo@mingarecords.com',
    password: 'minga123',
    alias: 'Kogui Demo',
    role: 'producer',
    createdAt: '2026-04-30T00:00:00.000Z',
  },
  {
    identifier: 'artista@mingarecords.com',
    password: 'minga123',
    alias: 'Minga Artista',
    role: 'artist',
    createdAt: '2026-04-30T00:00:00.000Z',
  },
] as const satisfies readonly DemoCredential[];

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
