import type { AuthSession, AuthUser } from '../entities/auth';

export interface AuthRepository {
  listUsers: () => AuthUser[];
  saveUsers: (users: AuthUser[]) => void;
  loadSession: () => AuthSession | null;
  saveSession: (session: AuthSession | null) => void;
}
