import { createUser, toSession, type AuthDraft, type AuthResult } from '../../../domain/auth/entities/auth';
import type { AuthRepository } from '../../../domain/auth/ports/AuthRepository';
import { normalizeIdentifier, validateDraft } from '../../../domain/auth/value-objects/authValidation';
import { ensureDemoUserSeeded } from '../seedDemoUser';

export function register(repository: AuthRepository, draft: AuthDraft): AuthResult {
  ensureDemoUserSeeded(repository);

  const validationError = validateDraft('register', draft);
  if (validationError) {
    return { ok: false, message: validationError };
  }

  const identifier = normalizeIdentifier(draft.identifier);
  const users = repository.listUsers();
  const existingUser = users.find((user) => user.identifier === identifier);

  if (existingUser) {
    return { ok: false, message: 'Ese usuario ya existe. Probá iniciar sesión.' };
  }

  const newUser = createUser(draft, identifier);
  repository.saveUsers([...users, newUser]);

  const session = toSession(newUser);
  if (draft.remember) {
    repository.saveSession(session);
  }

  return { ok: true, message: 'Registro creado. Ya podés entrar a la minga.', user: session };
}
