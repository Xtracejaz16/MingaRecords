import { useEffect, useState } from 'react';
import { clearSession as clearSessionUseCase } from '../../../application/auth/use-cases/clearSession';
import { loadSession as loadSessionUseCase } from '../../../application/auth/use-cases/loadSession';
import { login as loginUseCase } from '../../../application/auth/use-cases/login';
import { register as registerUseCase } from '../../../application/auth/use-cases/register';
import type { AuthDraft, AuthResult, AuthSession, AuthTab } from '../../../domain/auth/entities/auth';
import { ApiAuthRepository } from '../../../infrastructure/auth/adapters/apiAuthRepository';

export function useAuth() {
  const [repository] = useState(() => new ApiAuthRepository());
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    loadSessionUseCase(repository).then((loaded) => {
      if (!cancelled) {
        setSession(loaded);
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [repository]);

  const submitAuth = async (mode: AuthTab, draft: AuthDraft): Promise<AuthResult> => {
    const result = mode === 'login'
      ? await loginUseCase(repository, draft)
      : await registerUseCase(repository, draft);

    if (result.ok) {
      setSession(result.user ?? null);
    }

    return result;
  };

  const logout = async (): Promise<void> => {
    await clearSessionUseCase(repository);
    setSession(null);
  };

  const loadSession = async (): Promise<AuthSession | null> => {
    const currentSession = await loadSessionUseCase(repository);
    setSession(currentSession);
    return currentSession;
  };

  return {
    session,
    isLoading,
    submitAuth,
    logout,
    loadSession,
    repository,
  };
}
