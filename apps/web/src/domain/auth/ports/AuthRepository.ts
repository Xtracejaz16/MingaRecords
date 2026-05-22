import type { AuthDraft, AuthResult, AuthSession } from '../entities/auth';

export interface AuthRepository {
  login(draft: AuthDraft): Promise<AuthResult>;
  register(draft: AuthDraft): Promise<AuthResult>;
  logout(): Promise<AuthResult>;
  loadSession(): Promise<AuthSession | null>;
  saveSession(session: AuthSession | null): Promise<void>;
  getCurrentUser(): Promise<AuthSession | null>;
}
