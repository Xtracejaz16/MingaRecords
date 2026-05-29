import type { AuthRepository } from '../../../domain/auth/ports/AuthRepository';
import type { AuthDraft, AuthResult, AuthSession } from '../../../domain/auth/entities/auth';

const ERROR_MESSAGES: Record<number, string> = {
  400: 'Datos inválidos. Revisá el formulario.',
  401: 'Tu sesión expiró. Iniciá sesión de nuevo.',
  403: 'No tenés permiso para realizar esta acción.',
  404: 'Recurso no encontrado.',
  409: 'Ese email ya está registrado. Probá iniciar sesión.',
  422: 'Algunos datos no son válidos. Revisalos.',
};

const NETWORK_ERROR = 'No pudimos conectar con el servidor. Revisá tu conexión.';
const DEFAULT_SERVER_ERROR = 'Error del servidor. Intentá más tarde.';

const ACCESS_TOKEN_KEY = 'mr_access_token';

function readToken(): string | null {
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null): void {
  try {
    if (token === null) {
      window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    } else {
      window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
    }
  } catch {
    // Ignore storage errors
  }
}

export class ApiAuthRepository implements AuthRepository {
  private accessToken: string | null = readToken();
  private refreshPromise: Promise<string | null> | null = null;
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';
  }

  async login(draft: AuthDraft): Promise<AuthResult> {
    return this.authRequest('/api/v1/auth/login', draft);
  }

  async register(draft: AuthDraft): Promise<AuthResult> {
    return this.authRequest('/api/v1/auth/register', draft);
  }

  async logout(): Promise<AuthResult> {
    try {
      const res = await this.fetchWithAuth(`${this.baseUrl}/api/v1/auth/logout`, { method: 'POST' });
      this.accessToken = null;
      writeToken(null);

      if (!res.ok) {
        return this.toAuthResult(res);
      }

      return { ok: true, message: 'Sesión cerrada.' };
    } catch {
      this.accessToken = null;
      writeToken(null);
      return { ok: false, message: NETWORK_ERROR };
    }
  }

  async loadSession(): Promise<AuthSession | null> {
    return this.getCurrentUser();
  }

  async saveSession(session: AuthSession | null): Promise<void> {
    if (!session) {
      this.accessToken = null;
      writeToken(null);
    }
  }

  async getCurrentUser(): Promise<AuthSession | null> {
    try {
      const res = await this.fetchWithAuth(`${this.baseUrl}/api/v1/auth/me`, { method: 'GET' });
      if (!res.ok) return null;
      const data = await res.json();
      return this.toSession(data);
    } catch {
      return null;
    }
  }

  async resendVerificationEmail(email: string): Promise<AuthResult> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        return this.toAuthResult(res);
      }

      return { ok: true, message: 'Si el email existe, se envió un nuevo link de verificación.' };
    } catch {
      return { ok: false, message: NETWORK_ERROR };
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private async authRequest(path: string, draft: AuthDraft): Promise<AuthResult> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });

      if (!res.ok) {
        return this.toAuthResult(res);
      }

      const data = await res.json();
      this.accessToken = (data as Record<string, unknown>).accessToken as string ?? null;
      writeToken(this.accessToken);
      const user = (data as Record<string, unknown>).user;
      const session = this.toSession(user);
      return { ok: true, message: 'Sesión iniciada.', user: session ?? undefined };
    } catch {
      return { ok: false, message: NETWORK_ERROR };
    }
  }

  private async fetchWithAuth(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    const res = await fetch(input, { ...init, headers });

    if (res.status === 401 && this.accessToken) {
      return this.handle401(input, init);
    }

    return res;
  }

  private async handle401(input: RequestInfo, init: RequestInit): Promise<Response> {
    if (this.refreshPromise) {
      const newToken = await this.refreshPromise;
      if (!newToken) {
        this.accessToken = null;
        writeToken(null);
        return new Response(null, { status: 401 });
      }
      this.accessToken = newToken;
      writeToken(newToken);
      return this.fetchWithAuth(input, init);
    }

    this.refreshPromise = this.performRefresh();
    const newToken = await this.refreshPromise;
    this.refreshPromise = null;

    if (!newToken) {
      this.accessToken = null;
      writeToken(null);
      return new Response(null, { status: 401 });
    }

    this.accessToken = newToken;
    writeToken(newToken);
    return this.fetchWithAuth(input, init);
  }

  private async performRefresh(): Promise<string | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = await res.json();
      return (data as Record<string, unknown>).accessToken as string ?? null;
    } catch {
      return null;
    }
  }

  private toSession(data: unknown): AuthSession | null {
    if (!data || typeof data !== 'object') return null;
    const obj = data as Record<string, unknown>;
    if (typeof obj.id !== 'string' || typeof obj.email !== 'string') return null;

    return {
      id: obj.id,
      email: obj.email,
      alias: typeof obj.alias === 'string' ? obj.alias : '',
      role: obj.role === 'BEATMAKER' || obj.role === 'BUYER' || obj.role === 'ADMIN' ? obj.role : 'BEATMAKER',
      emailVerified: Boolean(obj.emailVerified),
      createdAt: typeof obj.createdAt === 'string' ? obj.createdAt : new Date().toISOString(),
    };
  }

  private async toAuthResult(res: Response): Promise<AuthResult> {
    const message = ERROR_MESSAGES[res.status] ?? DEFAULT_SERVER_ERROR;

    try {
      const body = await res.json();
      const bodyObj = body as Record<string, unknown>;
      const backendMessage = (bodyObj.error ?? bodyObj.message) as string | undefined;
      if (backendMessage && res.status !== 401) {
        return { ok: false, message: backendMessage };
      }
    } catch {
      // No JSON body — use default message
    }

    return { ok: false, message };
  }
}
