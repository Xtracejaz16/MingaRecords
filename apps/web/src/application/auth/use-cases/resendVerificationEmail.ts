import type { AuthResult } from '../../../domain/auth/entities/auth';
import type { AuthRepository } from '../../../domain/auth/ports/AuthRepository';

export async function resendVerificationEmail(
  repository: AuthRepository,
  email: string,
): Promise<AuthResult> {
  return repository.resendVerificationEmail(email);
}
