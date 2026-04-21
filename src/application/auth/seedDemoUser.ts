import { DEMO_CREDENTIALS, type AuthUser } from '../../domain/auth/entities/auth';
import type { AuthRepository } from '../../domain/auth/ports/AuthRepository';

export function ensureDemoUserSeeded(repository: AuthRepository) {
  if (repository.listUsers().length > 0) {
    return;
  }

  const demoUser: AuthUser = {
    id: 'seed-demo-user',
    identifier: DEMO_CREDENTIALS.identifier,
    password: DEMO_CREDENTIALS.password,
    alias: DEMO_CREDENTIALS.alias,
    role: DEMO_CREDENTIALS.role,
    createdAt: new Date().toISOString(),
  };

  repository.saveUsers([demoUser]);
}
