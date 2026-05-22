import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiAuthRepository } from '../apiAuthRepository';
import type { AuthDraft } from '../../../../domain/auth/entities/auth';

const BASE_URL = 'http://localhost:3000';

const validDraft: AuthDraft = {
  email: 'test@mingarecords.com',
  password: 'secret123',
  alias: 'Test User',
  role: 'artist',
  remember: true,
};

const apiUser = {
  id: '1',
  email: 'test@mingarecords.com',
  alias: 'Test User',
  role: 'artist',
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const apiLoginResponse = {
  accessToken: 'access-token-123',
  user: apiUser,
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorResponse(status: number, body?: unknown): Response {
  return new Response(body ? JSON.stringify(body) : null, { status });
}

function networkError() {
  return () => Promise.reject(new TypeError('Failed to fetch'));
}

describe('ApiAuthRepository', () => {
  let repo: ApiAuthRepository;

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    repo = new ApiAuthRepository();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('login', () => {
    it('sends POST /auth/login with draft body', async () => {
      const fetchMock = vi.mocked(globalThis.fetch);
      fetchMock.mockResolvedValueOnce(jsonResponse(apiLoginResponse));

      const result = await repo.login(validDraft);

      expect(fetchMock).toHaveBeenCalledWith(
        `${BASE_URL}/auth/login`,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(validDraft),
        }),
      );
      expect(result.ok).toBe(true);
      expect(result.user?.email).toBe('test@mingarecords.com');
    });

    it('stores access token from response', async () => {
      const fetchMock = vi.mocked(globalThis.fetch);
      fetchMock.mockResolvedValueOnce(jsonResponse(apiLoginResponse));

      await repo.login(validDraft);

      // Next authenticated request should include the Bearer token
      fetchMock.mockResolvedValueOnce(jsonResponse(apiUser));

      await repo.getCurrentUser();

      expect(fetchMock).toHaveBeenLastCalledWith(
        `${BASE_URL}/auth/me`,
        expect.objectContaining({
          headers: expect.any(Headers),
        }),
      );
      const lastCall = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
      const headers = (lastCall?.[1] as RequestInit)?.headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer access-token-123');
    });

    it('returns Spanish error on 400', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(errorResponse(400));

      const result = await repo.login(validDraft);

      expect(result.ok).toBe(false);
      expect(result.message).toBe('Datos inválidos. Revisá el formulario.');
    });

    it('returns Spanish error on 409 (duplicate email)', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(errorResponse(409));

      const result = await repo.login(validDraft);

      expect(result.ok).toBe(false);
      expect(result.message).toBe('Ese email ya está registrado. Probá iniciar sesión.');
    });

    it('returns Spanish error on 500', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(errorResponse(500));

      const result = await repo.login(validDraft);

      expect(result.ok).toBe(false);
      expect(result.message).toBe('Error del servidor. Intentá más tarde.');
    });

    it('uses backend error message when available (non-401)', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(
        errorResponse(400, { error: 'Email inválido' }),
      );

      const result = await repo.login(validDraft);

      expect(result.ok).toBe(false);
      expect(result.message).toBe('Email inválido');
    });

    it('returns network error when fetch throws', async () => {
      vi.mocked(globalThis.fetch).mockImplementationOnce(networkError());

      const result = await repo.login(validDraft);

      expect(result.ok).toBe(false);
      expect(result.message).toBe('No pudimos conectar con el servidor. Revisá tu conexión.');
    });
  });

  describe('register', () => {
    it('sends POST /auth/register with draft body', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse(apiLoginResponse));

      const result = await repo.register(validDraft);

      expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
        `${BASE_URL}/auth/register`,
        expect.objectContaining({ method: 'POST' }),
      );
      expect(result.ok).toBe(true);
    });

    it('returns network error when fetch throws', async () => {
      vi.mocked(globalThis.fetch).mockImplementationOnce(networkError());

      const result = await repo.register(validDraft);

      expect(result.ok).toBe(false);
      expect(result.message).toBe('No pudimos conectar con el servidor. Revisá tu conexión.');
    });
  });

  describe('logout', () => {
    it('sends POST /auth/logout with auth header', async () => {
      const fetchMock = vi.mocked(globalThis.fetch);
      // Login first to get token
      fetchMock.mockResolvedValueOnce(jsonResponse(apiLoginResponse));
      await repo.login(validDraft);

      fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
      const result = await repo.logout();

      expect(fetchMock).toHaveBeenLastCalledWith(
        `${BASE_URL}/auth/logout`,
        expect.objectContaining({ method: 'POST' }),
      );
      expect(result.ok).toBe(true);
    });

    it('clears access token after logout', async () => {
      const fetchMock = vi.mocked(globalThis.fetch);
      fetchMock.mockResolvedValueOnce(jsonResponse(apiLoginResponse));
      await repo.login(validDraft);

      fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));
      await repo.logout();

      // Next getCurrentUser should NOT have Authorization header
      fetchMock.mockResolvedValueOnce(jsonResponse(apiUser));
      await repo.getCurrentUser();

      const lastCall = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
      const headers = (lastCall?.[1] as RequestInit)?.headers as Headers;
      expect(headers.get('Authorization')).toBeNull();
    });

    it('returns network error and clears token when fetch throws', async () => {
      const fetchMock = vi.mocked(globalThis.fetch);
      fetchMock.mockResolvedValueOnce(jsonResponse(apiLoginResponse));
      await repo.login(validDraft);

      fetchMock.mockRejectedValueOnce(networkError());
      const result = await repo.logout();

      expect(result.ok).toBe(false);
      expect(result.message).toBe('No pudimos conectar con el servidor. Revisá tu conexión.');
    });
  });

  describe('getCurrentUser', () => {
    it('sends GET /auth/me and returns mapped session', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse(apiUser));

      const session = await repo.getCurrentUser();

      expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
        `${BASE_URL}/auth/me`,
        expect.objectContaining({ method: 'GET' }),
      );
      expect(session).toMatchObject({
        id: '1',
        email: 'test@mingarecords.com',
        alias: 'Test User',
        role: 'artist',
        emailVerified: true,
      });
    });

    it('returns null when response is not ok', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(errorResponse(401));

      const session = await repo.getCurrentUser();

      expect(session).toBeNull();
    });

    it('returns null when fetch throws', async () => {
      vi.mocked(globalThis.fetch).mockImplementationOnce(networkError());

      const session = await repo.getCurrentUser();

      expect(session).toBeNull();
    });

    it('returns null when response data has invalid shape', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse({ foo: 'bar' }));

      const session = await repo.getCurrentUser();

      expect(session).toBeNull();
    });
  });

  describe('loadSession', () => {
    it('delegates to getCurrentUser', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse(apiUser));

      const session = await repo.loadSession();

      expect(session).toMatchObject({ email: 'test@mingarecords.com' });
    });
  });

  describe('saveSession', () => {
    it('clears access token when session is null', async () => {
      const fetchMock = vi.mocked(globalThis.fetch);
      fetchMock.mockResolvedValueOnce(jsonResponse(apiLoginResponse));
      await repo.login(validDraft);

      await repo.saveSession(null);

      // Next getCurrentUser should NOT have Authorization header
      fetchMock.mockResolvedValueOnce(jsonResponse(apiUser));
      await repo.getCurrentUser();

      const lastCall = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
      const headers = (lastCall?.[1] as RequestInit)?.headers as Headers;
      expect(headers.get('Authorization')).toBeNull();
    });
  });

  describe('token refresh on 401', () => {
    it('refreshes token and retries original request on 401', async () => {
      const fetchMock = vi.mocked(globalThis.fetch);

      // Login to get initial token
      fetchMock.mockResolvedValueOnce(jsonResponse(apiLoginResponse));
      await repo.login(validDraft);

      // First getCurrentUser → 401
      fetchMock.mockResolvedValueOnce(errorResponse(401));
      // Refresh → new token
      fetchMock.mockResolvedValueOnce(jsonResponse({ accessToken: 'new-token' }));
      // Retry getCurrentUser → success
      fetchMock.mockResolvedValueOnce(jsonResponse(apiUser));

      const session = await repo.getCurrentUser();

      expect(fetchMock).toHaveBeenCalledTimes(4); // login + 401 + refresh + retry
      expect(session).toMatchObject({ email: 'test@mingarecords.com' });
    });

    it('returns null when refresh fails', async () => {
      const fetchMock = vi.mocked(globalThis.fetch);

      fetchMock.mockResolvedValueOnce(jsonResponse(apiLoginResponse));
      await repo.login(validDraft);

      // First getCurrentUser → 401
      fetchMock.mockResolvedValueOnce(errorResponse(401));
      // Refresh fails
      fetchMock.mockResolvedValueOnce(errorResponse(401));

      const session = await repo.getCurrentUser();

      expect(session).toBeNull();
    });

    it('does not attempt refresh when there is no access token', async () => {
      const fetchMock = vi.mocked(globalThis.fetch);

      // getCurrentUser without login → 401, no refresh attempt
      fetchMock.mockResolvedValueOnce(errorResponse(401));

      const session = await repo.getCurrentUser();

      expect(session).toBeNull();
      // Only 1 call (the initial GET /auth/me), no refresh
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('concurrent 401 queue', () => {
    it('performs only one refresh for concurrent 401s', async () => {
      const fetchMock = vi.mocked(globalThis.fetch);

      // Login to get token
      fetchMock.mockResolvedValueOnce(jsonResponse(apiLoginResponse));
      await repo.login(validDraft);

      // Both requests get 401
      fetchMock.mockResolvedValueOnce(errorResponse(401));
      fetchMock.mockResolvedValueOnce(errorResponse(401));

      // One refresh succeeds
      fetchMock.mockResolvedValueOnce(jsonResponse({ accessToken: 'refreshed-token' }));

      // Both retries succeed
      fetchMock.mockResolvedValueOnce(jsonResponse(apiUser));
      fetchMock.mockResolvedValueOnce(jsonResponse({ ...apiUser, id: '2' }));

      // Fire two concurrent getCurrentUser calls
      const [session1, session2] = await Promise.all([
        repo.getCurrentUser(),
        repo.getCurrentUser(),
      ]);

      // Only one refresh call should have been made
      const refreshCalls = fetchMock.mock.calls.filter(
        (call) => typeof call[0] === 'string' && call[0].includes('/auth/refresh'),
      );
      expect(refreshCalls).toHaveLength(1);

      expect(session1).toMatchObject({ email: 'test@mingarecords.com' });
      expect(session2).toMatchObject({ email: 'test@mingarecords.com' });
    });
  });

  describe('error mapping to Spanish', () => {
    const errorCases: Array<{ status: number; expected: string }> = [
      { status: 400, expected: 'Datos inválidos. Revisá el formulario.' },
      { status: 401, expected: 'Tu sesión expiró. Iniciá sesión de nuevo.' },
      { status: 403, expected: 'No tenés permiso para realizar esta acción.' },
      { status: 404, expected: 'Recurso no encontrado.' },
      { status: 409, expected: 'Ese email ya está registrado. Probá iniciar sesión.' },
      { status: 422, expected: 'Algunos datos no son válidos. Revisalos.' },
      { status: 500, expected: 'Error del servidor. Intentá más tarde.' },
      { status: 502, expected: 'Error del servidor. Intentá más tarde.' },
      { status: 503, expected: 'Error del servidor. Intentá más tarde.' },
    ];

    errorCases.forEach(({ status, expected }) => {
      it(`maps HTTP ${status} to "${expected}"`, async () => {
        vi.mocked(globalThis.fetch).mockResolvedValueOnce(errorResponse(status));

        const result = await repo.login(validDraft);

        expect(result.ok).toBe(false);
        expect(result.message).toBe(expected);
      });
    });
  });

  describe('session mapping', () => {
    it('maps API user with all fields correctly', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse(apiUser));

      const session = await repo.getCurrentUser();

      expect(session).toEqual({
        id: '1',
        email: 'test@mingarecords.com',
        alias: 'Test User',
        role: 'artist',
        emailVerified: true,
        createdAt: '2026-01-01T00:00:00.000Z',
      });
    });

    it('defaults missing alias to empty string', async () => {
      const partialUser = { id: '1', email: 'a@b.com', role: 'artist' };
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse(partialUser));

      const session = await repo.getCurrentUser();

      expect(session?.alias).toBe('');
    });

    it('defaults missing role to artist', async () => {
      const partialUser = { id: '1', email: 'a@b.com', alias: 'Test' };
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse(partialUser));

      const session = await repo.getCurrentUser();

      expect(session?.role).toBe('artist');
    });

    it('defaults emailVerified to false when missing', async () => {
      const partialUser = { id: '1', email: 'a@b.com', alias: 'Test', role: 'artist' };
      vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse(partialUser));

      const session = await repo.getCurrentUser();

      expect(session?.emailVerified).toBe(false);
    });
  });
});
