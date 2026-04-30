import { DEMO_USERS, type AuthUser } from '../../domain/auth/entities/auth';
import type { AuthRepository } from '../../domain/auth/ports/AuthRepository';

const DEMO_USER_IDS = new Set(DEMO_USERS.map((user) => user.identifier));

function createDemoUser(identifier: string, alias: string, password: string, role: AuthUser['role']): AuthUser {
  return {
    id: `seed-${identifier}`,
    identifier,
    password,
    alias,
    role,
    createdAt: '2026-04-30T00:00:00.000Z',
  };
}

export function ensureDemoUsersSeeded(repository: AuthRepository) {
  const existingUsers = repository.listUsers();
  const normalizedUsers = existingUsers.filter((user) => !DEMO_USER_IDS.has(user.identifier));
  const demoUsers = DEMO_USERS.map((demoUser) => {
    const existingUser = existingUsers.find((user) => user.identifier === demoUser.identifier);

    if (!existingUser) {
      return createDemoUser(demoUser.identifier, demoUser.alias, demoUser.password, demoUser.role);
    }

    return {
      ...existingUser,
      identifier: demoUser.identifier,
      password: demoUser.password,
      alias: demoUser.alias,
      role: demoUser.role,
      createdAt: demoUser.createdAt,
    };
  });

  const nextUsers = [...normalizedUsers, ...demoUsers];
  const hasChanges = nextUsers.length !== existingUsers.length
    || nextUsers.some((user, index) => {
      const previousUser = existingUsers[index];
      return !previousUser
        || previousUser.identifier !== user.identifier
        || previousUser.password !== user.password
        || previousUser.alias !== user.alias
        || previousUser.role !== user.role;
    });

  if (hasChanges) {
    repository.saveUsers(nextUsers);
  }
}
