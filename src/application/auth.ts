import {
  DEMO_CREDENTIALS,
  type AuthDraft,
  type AuthResult,
  type AuthSession,
  type AuthUser,
  createUser,
  normalizeIdentifier,
  toSession,
  validateDraft,
} from '../domain/auth';

export const AUTH_STORAGE_KEYS = {
  users: 'mingarecords.auth.users',
  session: 'mingarecords.auth.session',
} as const;

export interface AuthRepository {
  listUsers: () => AuthUser[];
  saveUsers: (users: AuthUser[]) => void;
  loadSession: () => AuthSession | null;
  saveSession: (session: AuthSession | null) => void;
}

export function createAuthService(repository: AuthRepository) {
  const seedUsers = () => {
    if (repository.listUsers().length > 0) {
      return;
    }

    repository.saveUsers([
      {
        id: 'seed-demo-user',
        identifier: DEMO_CREDENTIALS.identifier,
        password: DEMO_CREDENTIALS.password,
        alias: DEMO_CREDENTIALS.alias,
        role: DEMO_CREDENTIALS.role,
        createdAt: new Date().toISOString(),
      },
    ]);
  };

  seedUsers();

  const authenticate = (mode: 'login' | 'register', draft: AuthDraft): AuthResult => {
    const validationError = validateDraft(mode, draft);
    if (validationError) {
      return { ok: false, message: validationError };
    }

    const identifier = normalizeIdentifier(draft.identifier);
    const users = repository.listUsers();

    if (mode === 'register') {
      const existingUser = users.find((user) => user.identifier === identifier);
      if (existingUser) {
        return { ok: false, message: 'Ese usuario ya existe. Probá iniciar sesión.' };
      }

      const newUser = createUser(draft);
      repository.saveUsers([...users, newUser]);

      const session = toSession(newUser);
      if (draft.remember) {
        repository.saveSession(session);
      }

      return { ok: true, message: 'Registro creado. Ya podés entrar a la minga.', user: session };
    }

    const user = users.find((item) => item.identifier === identifier);
    if (!user) {
      return { ok: false, message: 'No encontramos ese usuario. Probá registrarte.' };
    }

    if (user.password !== draft.password) {
      return { ok: false, message: 'La llave no coincide. Revisala y volvé a intentar.' };
    }

    const session = toSession(user);
    if (draft.remember) {
      repository.saveSession(session);
    }

    return { ok: true, message: 'Sesión iniciada. Bienvenid@ de vuelta.', user: session };
  };

  return {
    login: (draft: AuthDraft) => authenticate('login', draft),
    register: (draft: AuthDraft) => authenticate('register', draft),
    loadSession: () => repository.loadSession(),
    clearSession: () => repository.saveSession(null),
    storageKeys: AUTH_STORAGE_KEYS,
  };
}
