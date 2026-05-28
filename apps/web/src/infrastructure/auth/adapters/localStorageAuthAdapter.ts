import type { AuthDraft, AuthResult, AuthSession, AuthUser } from '../../../domain/auth/entities/auth';
import { createUser, toSession } from '../../../domain/auth/entities/auth';
import type { AuthRepository } from '../../../domain/auth/ports/AuthRepository';
import { normalizeEmail } from '../../../domain/auth/value-objects/authValidation';
import { AUTH_STORAGE_KEYS } from '../constants/storageKeys';

function hasWindow() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStorage<T>(key: string): T | null {
  if (!hasWindow()) {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(key);
    return null;
  }
}

function writeStorage<T>(key: string, value: T | null) {
  if (!hasWindow()) {
    return;
  }

  try {
    if (value === null) {
      window.localStorage.removeItem(key);
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Intentionally ignore storage quota / privacy mode errors in the demo bridge.
  }
}

function readUsers(): AuthUser[] {
  return readStorage<AuthUser[]>(AUTH_STORAGE_KEYS.users) ?? [];
}

function writeUsers(users: AuthUser[]) {
  writeStorage(AUTH_STORAGE_KEYS.users, users);
}

export function createLocalStorageAuthAdapter(): AuthRepository {
  return {
    async login(draft: AuthDraft): Promise<AuthResult> {
      const email = normalizeEmail(draft.email);
      const users = readUsers();
      const user = users.find((item) => item.email === email);

      if (!user) {
        return { ok: false, message: 'No encontramos ese usuario. Probá registrarte.' };
      }

      // Password check omitted — localStorage adapter is a fallback; real auth is via API.
      const session: AuthSession = {
        id: user.id,
        email: user.email,
        alias: user.alias,
        role: user.role,
        emailVerified: false,
        createdAt: user.createdAt,
      };

      if (draft.remember) {
        writeStorage(AUTH_STORAGE_KEYS.session, session);
      }

      return { ok: true, message: 'Sesión iniciada. Bienvenid@ de vuelta.', user: session };
    },

    async register(draft: AuthDraft): Promise<AuthResult> {
      const email = normalizeEmail(draft.email);
      const users = readUsers();
      const existingUser = users.find((user) => user.email === email);

      if (existingUser) {
        return { ok: false, message: 'Ese email ya está registrado. Probá iniciar sesión.' };
      }

      const newUser = createUser(draft, email);
      writeUsers([...users, newUser]);

      const session = toSession(newUser);
      if (draft.remember) {
        writeStorage(AUTH_STORAGE_KEYS.session, session);
      }

      return { ok: true, message: 'Registro creado. Ya podés entrar a la minga.', user: session };
    },

    async logout(): Promise<AuthResult> {
      writeStorage(AUTH_STORAGE_KEYS.session, null);
      return { ok: true, message: 'Sesión cerrada.' };
    },

    async loadSession(): Promise<AuthSession | null> {
      return readStorage<AuthSession>(AUTH_STORAGE_KEYS.session);
    },

    async saveSession(session: AuthSession | null): Promise<void> {
      writeStorage(AUTH_STORAGE_KEYS.session, session);
    },

    async getCurrentUser(): Promise<AuthSession | null> {
      return readStorage<AuthSession>(AUTH_STORAGE_KEYS.session);
    },

    async resendVerificationEmail(): Promise<AuthResult> {
      return { ok: true, message: 'Si el email existe, se envió un nuevo link de verificación.' };
    },
  };
}
