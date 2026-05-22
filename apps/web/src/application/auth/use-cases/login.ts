import type { AuthDraft, AuthResult } from '../../../domain/auth/entities/auth';
import type { AuthRepository } from '../../../domain/auth/ports/AuthRepository';
import { normalizeEmail, validateDraft } from '../../../domain/auth/value-objects/authValidation';

export async function login(repository: AuthRepository, draft: AuthDraft): Promise<AuthResult> {
  const validationError = validateDraft('login', draft);
  if (validationError) {
    return { ok: false, message: validationError };
  }

  const normalized = normalizeEmail(draft.email);
  return repository.login({ ...draft, email: normalized });
}
