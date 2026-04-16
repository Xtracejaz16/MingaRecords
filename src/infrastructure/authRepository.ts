import type { AuthRepository } from '../application/auth';
import { AUTH_STORAGE_KEYS } from '../application/auth';
import type { AuthSession, AuthUser } from '../domain/auth';

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

export function createBrowserAuthRepository(): AuthRepository {
  return {
    listUsers: () => readStorage<AuthUser[]>(AUTH_STORAGE_KEYS.users) ?? [],
    saveUsers: (users) => writeStorage(AUTH_STORAGE_KEYS.users, users),
    loadSession: () => readStorage<AuthSession>(AUTH_STORAGE_KEYS.session),
    saveSession: (session) => writeStorage(AUTH_STORAGE_KEYS.session, session),
  };
}
