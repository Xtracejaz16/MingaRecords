import type { AuthSession } from '../../../domain/auth/entities/auth';
import type { AuthRepository } from '../../../domain/auth/ports/AuthRepository';

function isSessionShape(session: unknown): session is AuthSession {
  if (!session || typeof session !== 'object') {
    return false;
  }

  const candidate = session as Record<string, unknown>;
  return typeof candidate.id === 'string'
    && typeof candidate.email === 'string'
    && typeof candidate.alias === 'string'
    && (candidate.role === 'artist' || candidate.role === 'producer')
    && typeof candidate.emailVerified === 'boolean'
    && typeof candidate.createdAt === 'string';
}

export async function loadSession(repository: AuthRepository): Promise<AuthSession | null> {
  const session = await repository.loadSession();

  if (!session || !isSessionShape(session)) {
    if (session) {
      await repository.saveSession(null);
    }
    return null;
  }

  const currentUser = await repository.getCurrentUser();
  if (currentUser) {
    return currentUser;
  }

  await repository.saveSession(null);
  return null;
}
