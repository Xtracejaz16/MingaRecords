import type { AuthSession } from '../../../domain/auth/entities/auth';
import type { AuthRepository } from '../../../domain/auth/ports/AuthRepository';

export function loadSession(repository: AuthRepository): AuthSession | null {
  return repository.loadSession();
}
