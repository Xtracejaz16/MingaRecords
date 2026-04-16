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

export function normalizeIdentifier(value: string) {
  return value.trim().toLowerCase();
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

export function createUser(input: AuthDraft): AuthUser {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? `user-${Date.now()}`,
    identifier: normalizeIdentifier(input.identifier),
    password: input.password,
    alias: input.alias.trim() || 'Minguit@ sin nombre',
    role: input.role,
    createdAt: new Date().toISOString(),
  };
}

export function validateDraft(mode: AuthTab, draft: AuthDraft): string | null {
  if (!draft.identifier.trim()) {
    return 'Ingresá un usuario o email.';
  }

  if (draft.identifier.trim().length < 3) {
    return 'El identificador debe tener al menos 3 caracteres.';
  }

  if (mode === 'register' && !draft.alias.trim()) {
    return 'Elegí un alias para tu proyecto.';
  }

  if (draft.password.trim().length < 4) {
    return 'La llave debe tener al menos 4 caracteres.';
  }

  return null;
}
