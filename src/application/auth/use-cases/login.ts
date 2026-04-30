import { toSession, type AuthDraft, type AuthResult } from '../../../domain/auth/entities/auth';
import type { AuthRepository } from '../../../domain/auth/ports/AuthRepository';
import { normalizeIdentifier, validateDraft } from '../../../domain/auth/value-objects/authValidation';
import { ensureDemoUsersSeeded } from '../seedDemoUsers';

export function login(repository: AuthRepository, draft: AuthDraft): AuthResult {
  ensureDemoUsersSeeded(repository);

  const validationError = validateDraft('login', draft);
  if (validationError) {
    return { ok: false, message: validationError };
  }

  const identifier = normalizeIdentifier(draft.identifier);
  const users = repository.listUsers();
  const user = users.find((item) => item.identifier === identifier);

  if (!user) {
    return { ok: false, message: 'No encontramos ese usuario. Probá registrarte.' };
  }

  if (user.password !== draft.password) {
    return { ok: false, message: 'La llave no coincide. Revisala y volvé a intentar.' };
  }

  const session = toSession(user);
  if (draft.remember) {
    repository.saveSession(session);
  }

  return { ok: true, message: 'Sesión iniciada. Bienvenid@ de vuelta.', user: session };
}
