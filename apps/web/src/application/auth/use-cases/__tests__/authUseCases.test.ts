import { describe, expect, it } from 'vitest';
import type { AuthDraft, AuthResult, AuthSession } from '../../../../domain/auth/entities/auth';
import type { AuthRepository } from '../../../../domain/auth/ports/AuthRepository';
import { clearSession } from '../clearSession';
import { loadSession } from '../loadSession';
import { login } from '../login';
import { register } from '../register';
import { resendVerificationEmail } from '../resendVerificationEmail';

function createRepository(options: {
  loginResult?: AuthResult;
  registerResult?: AuthResult;
  resendResult?: AuthResult;
  session?: AuthSession | null;
  currentUser?: AuthSession | null;
} = {}): AuthRepository {
  const {
    loginResult = { ok: false, message: 'not implemented' },
    registerResult = { ok: false, message: 'not implemented' },
    resendResult = { ok: false, message: 'not implemented' },
    session = null,
    currentUser = null,
  } = options;

  let savedSession: AuthSession | null = session;

  return {
    login: async () => loginResult,
    register: async () => registerResult,
    logout: async () => {
      return { ok: true, message: 'Sesión cerrada.' };
    },
    loadSession: async () => savedSession,
    saveSession: async (nextSession) => {
      savedSession = nextSession;
    },
    getCurrentUser: async () => currentUser,
    resendVerificationEmail: async () => resendResult,
  };
}

const loginDraft: AuthDraft = {
  email: 'demo@mingarecords.com',
  password: 'minga123',
  alias: '',
  role: 'artist',
  remember: true,
};

describe('auth use cases', () => {
  describe('login', () => {
    it('validates login fields before authentication', async () => {
      const repo = createRepository();
      const result = await login(repo, { ...loginDraft, email: '  ', password: '' });

      expect(result.ok).toBe(false);
      expect(result.message).toBe('Ingresá un email.');
    });

    it('delegates to repository.login after validation passes', async () => {
      const session: AuthSession = {
        id: '1',
        email: 'demo@mingarecords.com',
        alias: 'Kogui Demo',
        role: 'artist',
        emailVerified: false,
        createdAt: '2026-04-30T00:00:00.000Z',
      };
      const repo = createRepository({
        loginResult: { ok: true, message: 'Sesión iniciada.', user: session },
      });

      const result = await login(repo, loginDraft);

      expect(result.ok).toBe(true);
      expect(result.user?.email).toBe('demo@mingarecords.com');
    });

    it('normalizes email before sending to repository', async () => {
      let receivedEmail = '';
      const repo: AuthRepository = {
        login: async (draft) => {
          receivedEmail = draft.email;
          return { ok: true, message: 'ok' };
        },
        register: async () => ({ ok: false, message: '' }),
        logout: async () => ({ ok: true, message: '' }),
        loadSession: async () => null,
        saveSession: async () => {},
        getCurrentUser: async () => null,
        resendVerificationEmail: async () => ({ ok: false, message: '' }),
      };

      await login(repo, { ...loginDraft, email: '  Demo@MingaRecords.COM  ' });

      expect(receivedEmail).toBe('demo@mingarecords.com');
    });
  });

  describe('register', () => {
    it('validates register fields before delegation', async () => {
      const repo = createRepository();
      const result = await register(repo, { ...loginDraft, email: '  ', password: '' });

      expect(result.ok).toBe(false);
      expect(result.message).toBe('Ingresá un email.');
    });

    it('delegates to repository.register after validation passes', async () => {
      const session: AuthSession = {
        id: '2',
        email: 'new@mingarecords.com',
        alias: 'Nueva Minga',
        role: 'producer',
        emailVerified: false,
        createdAt: '2026-04-30T00:00:00.000Z',
      };
      const repo = createRepository({
        registerResult: { ok: true, message: 'Registro creado.', user: session },
      });

      const result = await register(repo, {
        ...loginDraft,
        email: 'new@mingarecords.com',
        alias: 'Nueva Minga',
        role: 'producer',
      });

      expect(result.ok).toBe(true);
      expect(result.user?.email).toBe('new@mingarecords.com');
    });
  });

  describe('loadSession', () => {
    it('returns null when no session is stored', async () => {
      const repo = createRepository({ session: null });
      const result = await loadSession(repo);

      expect(result).toBeNull();
    });

    it('returns session when stored session is valid and backend confirms', async () => {
      const session: AuthSession = {
        id: '1',
        email: 'demo@mingarecords.com',
        alias: 'Kogui Demo',
        role: 'producer',
        emailVerified: true,
        createdAt: '2026-04-30T00:00:00.000Z',
      };
      const repo = createRepository({ session, currentUser: session });
      const result = await loadSession(repo);

      expect(result).toMatchObject({ email: 'demo@mingarecords.com', role: 'producer' });
    });

    it('clears session when stored session has invalid shape', async () => {
      const repo = createRepository({ session: { id: '1' } as unknown as AuthSession });
      const result = await loadSession(repo);

      expect(result).toBeNull();
    });

    it('clears session when backend does not confirm it', async () => {
      const session: AuthSession = {
        id: '1',
        email: 'demo@mingarecords.com',
        alias: 'Kogui Demo',
        role: 'producer',
        emailVerified: false,
        createdAt: '2026-04-30T00:00:00.000Z',
      };
      const repo = createRepository({ session, currentUser: null });
      const result = await loadSession(repo);

      expect(result).toBeNull();
    });
  });

  describe('clearSession', () => {
    it('calls logout and clears the persisted session', async () => {
      const session: AuthSession = {
        id: '1',
        email: 'demo@mingarecords.com',
        alias: 'Kogui Demo',
        role: 'producer',
        emailVerified: false,
        createdAt: new Date().toISOString(),
      };
      const repo = createRepository({ session });

      await clearSession(repo);

      const reloaded = await repo.loadSession();
      expect(reloaded).toBeNull();
    });
  });

  describe('resendVerificationEmail', () => {
    it('delegates to repository.resendVerificationEmail with the provided email', async () => {
      let receivedEmail = '';
      const repo: AuthRepository = {
        login: async () => ({ ok: false, message: '' }),
        register: async () => ({ ok: false, message: '' }),
        logout: async () => ({ ok: true, message: '' }),
        loadSession: async () => null,
        saveSession: async () => {},
        getCurrentUser: async () => null,
        resendVerificationEmail: async (email) => {
          receivedEmail = email;
          return { ok: true, message: 'Email enviado.' };
        },
      };

      const result = await resendVerificationEmail(repo, 'user@mingarecords.com');

      expect(receivedEmail).toBe('user@mingarecords.com');
      expect(result.ok).toBe(true);
      expect(result.message).toBe('Email enviado.');
    });

    it('returns failure result from repository', async () => {
      const repo = createRepository({
        resendResult: { ok: false, message: 'Rate limit excedido.' },
      });

      const result = await resendVerificationEmail(repo, 'user@mingarecords.com');

      expect(result.ok).toBe(false);
      expect(result.message).toBe('Rate limit excedido.');
    });
  });
});
