import { beforeEach, describe, expect, it } from 'vitest';
import type { AuthDraft, AuthSession, AuthUser } from '../../../../domain/auth/entities/auth';
import type { AuthRepository } from '../../../../domain/auth/ports/AuthRepository';
import { clearSession } from '../clearSession';
import { loadSession } from '../loadSession';
import { login } from '../login';
import { register } from '../register';
import { ensureDemoUsersSeeded } from '../../seedDemoUsers';
import { DEMO_USERS } from '../../../../domain/auth/entities/auth';

function createRepository(initialUsers: AuthUser[] = [], initialSession: AuthSession | null = null): AuthRepository {
  let users = [...initialUsers];
  let session = initialSession;

  return {
    listUsers: () => users,
    saveUsers: (nextUsers) => {
      users = [...nextUsers];
    },
    loadSession: () => session,
    saveSession: (nextSession) => {
      session = nextSession;
    },
  };
}

const loginDraft: AuthDraft = {
  identifier: 'demo@mingarecords.com',
  password: 'minga123',
  alias: '',
  role: 'artist',
  remember: true,
};

describe('auth use cases', () => {
  let repository: AuthRepository;

  beforeEach(() => {
    repository = createRepository();
  });

  it('validates login fields before authentication', () => {
    const result = login(repository, { ...loginDraft, identifier: '  ', password: '' });

    expect(result.ok).toBe(false);
    expect(result.message).toBe('Ingresá un usuario o email.');
  });

  it('rejects duplicate registrations', () => {
    const result = register(repository, {
      ...loginDraft,
      alias: 'Nueva Minga',
      role: 'producer',
      password: 'abcd',
    });

    expect(result.ok).toBe(false);
    expect(result.message).toBe('Ese usuario ya existe. Probá iniciar sesión.');
  });

  it('persists remembered sessions when registering', () => {
    const result = register(repository, {
      identifier: 'artist@mingarecords.com',
      password: 'abcd',
      alias: 'Artista Minga',
      role: 'artist',
      remember: true,
    });

    expect(result.ok).toBe(true);
    expect(loadSession(repository)?.alias).toBe('Artista Minga');
  });

  it('seeds exactly the two demo credentials', () => {
    ensureDemoUsersSeeded(repository);

    expect(repository.listUsers()).toHaveLength(2);
    expect(repository.listUsers().map((user) => user.identifier).sort()).toEqual(
      DEMO_USERS.map((user) => user.identifier).sort(),
    );
  });

  it('keeps valid stored sessions and removes malformed ones', () => {
    const validSession: AuthSession = {
      id: 'producer-1',
      identifier: DEMO_USERS[0].identifier,
      alias: DEMO_USERS[0].alias,
      role: 'producer',
      createdAt: '2026-04-30T00:00:00.000Z',
    };

    repository = createRepository([
      {
        id: validSession.id,
        identifier: validSession.identifier,
        password: DEMO_USERS[0].password,
        alias: validSession.alias,
        role: validSession.role,
        createdAt: validSession.createdAt,
      },
      {
        id: 'artist-1',
        identifier: DEMO_USERS[1].identifier,
        password: DEMO_USERS[1].password,
        alias: DEMO_USERS[1].alias,
        role: 'artist',
        createdAt: '2026-04-30T00:00:00.000Z',
      },
    ], validSession);

    expect(loadSession(repository)).toMatchObject(validSession);

    repository = createRepository([], {
      id: 'orphan',
      identifier: 'ghost@mingarecords.com',
      alias: 'Ghost',
      role: 'producer',
      createdAt: '2026-04-30T00:00:00.000Z',
    });

    expect(loadSession(repository)).toBeNull();

    repository = createRepository([], {
      id: 'broken',
      identifier: 'ghost@mingarecords.com',
      alias: 'Ghost',
      role: 'producer',
      createdAt: '2026-04-30T00:00:00.000Z',
    });

    expect(loadSession(repository)).toBeNull();
    expect(repository.loadSession()).toBeNull();
  });

  it('clears the session on logout', () => {
    repository = createRepository([], {
      id: '1',
      identifier: 'demo@mingarecords.com',
      alias: 'Kogui Demo',
      role: 'producer',
      createdAt: new Date().toISOString(),
    });

    clearSession(repository);

    expect(loadSession(repository)).toBeNull();
  });
});
