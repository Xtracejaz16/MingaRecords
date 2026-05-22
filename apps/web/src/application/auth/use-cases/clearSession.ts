import type { AuthRepository } from '../../../domain/auth/ports/AuthRepository';

export async function clearSession(repository: AuthRepository): Promise<void> {
  await repository.logout();
  await repository.saveSession(null);
}
