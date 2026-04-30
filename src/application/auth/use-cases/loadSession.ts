import type { AuthSession } from '../../../domain/auth/entities/auth';
import type { AuthRepository } from '../../../domain/auth/ports/AuthRepository';
import { ensureDemoUsersSeeded } from '../seedDemoUsers';

function isSessionShape(session: unknown): session is AuthSession {
  if (!session || typeof session !== 'object') {
    return false;
  }

  const candidate = session as Record<string, unknown>;
  return typeof candidate.id === 'string'
    && typeof candidate.identifier === 'string'
    && typeof candidate.alias === 'string'
    && (candidate.role === 'artist' || candidate.role === 'producer')
    && typeof candidate.createdAt === 'string';
}

function isValidSession(session: unknown, users: ReturnType<AuthRepository['listUsers']>) {
  if (!session) {
    return false;
  }

  if (!isSessionShape(session)) {
    return false;
  }

  const user = users.find((item) => item.identifier === session.identifier);
  return Boolean(user && user.role === session.role);
}

export function loadSession(repository: AuthRepository): AuthSession | null {
  ensureDemoUsersSeeded(repository);

  const session = repository.loadSession();
  const users = repository.listUsers();

  if (isValidSession(session, users)) {
    return session;
  }

  if (session) {
    repository.saveSession(null);
  }

  return null;
}
