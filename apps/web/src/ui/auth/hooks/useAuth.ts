import { useState } from 'react';
import { clearSession as clearSessionUseCase } from '../../../application/auth/use-cases/clearSession';
import { loadSession as loadSessionUseCase } from '../../../application/auth/use-cases/loadSession';
import { login as loginUseCase } from '../../../application/auth/use-cases/login';
import { register as registerUseCase } from '../../../application/auth/use-cases/register';
import type { AuthDraft, AuthResult, AuthSession, AuthTab } from '../../../domain/auth/entities/auth';
import { createLocalStorageAuthAdapter } from '../../../infrastructure/auth/adapters/localStorageAuthAdapter';

export function useAuth() {
  const [repository] = useState(() => createLocalStorageAuthAdapter());
  const [session, setSession] = useState<AuthSession | null>(() => loadSessionUseCase(repository));

  const syncSession = () => {
    const currentSession = loadSessionUseCase(repository);
    setSession(currentSession);

    return currentSession;
  };

  const submitAuth = (mode: AuthTab, draft: AuthDraft): AuthResult => {
    const result = mode === 'login'
      ? loginUseCase(repository, draft)
      : registerUseCase(repository, draft);

    if (result.ok) {
      setSession(result.user ?? null);
    }

    return result;
  };

  const logout = () => {
    clearSessionUseCase(repository);
    setSession(null);
  };

  return {
    session,
    submitAuth,
    logout,
    loadSession: syncSession,
  };
}
