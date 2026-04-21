import type { AuthRepository } from '../../../domain/auth/ports/AuthRepository';

export function clearSession(repository: AuthRepository) {
  repository.saveSession(null);
}
