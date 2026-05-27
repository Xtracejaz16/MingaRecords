import { useEffect, useState } from 'react';
import type { AuthDraft, AuthResult, AuthTab } from '../../../domain/auth/entities/auth';
import { useAuth } from '../../auth/hooks/useAuth';
import { canonicalHashForRoute, resolveHashRoute, type AppRouteKey } from '../../../routing/routes';

export function useAppShell() {
  const { session, isLoading, submitAuth, logout } = useAuth();
  const [hash, setHash] = useState(() => window.location.hash || '#/');

  useEffect(() => {
    const syncRouteFromHash = () => {
      setHash(window.location.hash || '#/');
    };

    syncRouteFromHash();
    window.addEventListener('hashchange', syncRouteFromHash);

    return () => window.removeEventListener('hashchange', syncRouteFromHash);
  }, []);

  const resolvedRoute = resolveHashRoute(hash);

  useEffect(() => {
    if (resolvedRoute.kind === 'notFound' || !resolvedRoute.canonicalHash) {
      return;
    }

    // If the current hash already resolves to the same route key, skip
    // normalization so we preserve path/query params that routes like
    // verify-email/<token> depend on.
    const currentResolved = resolveHashRoute(window.location.hash);
    if (currentResolved.key === resolvedRoute.key) {
      return;
    }

    window.location.hash = resolvedRoute.canonicalHash;
  }, [resolvedRoute.canonicalHash, resolvedRoute.kind, resolvedRoute.key]);

  const navigateTo = (target: AppRouteKey) => {
    window.location.hash = canonicalHashForRoute(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAuth = (tab: AuthTab) => {
    navigateTo(tab === 'login' ? 'login' : 'register');
  };

  const handleSubmit = (nextRoute: AppRouteKey) => async (mode: AuthTab, draft: AuthDraft): Promise<AuthResult> => {
    const result = await submitAuth(mode, draft);

    if (result.ok && result.user) {
      if (mode === 'register') {
        navigateTo('verify-email');
      } else {
        const targetRoute =
          result.user.role === 'artist'
            ? 'marketplace'
            : result.user.role === 'producer'
              ? 'panel'
              : nextRoute;
        navigateTo(targetRoute);
      }
    }

    return result;
  };

  const handleLogout = async () => {
    await logout();
    navigateTo('login');
  };

  const goHome = () => navigateTo('home');

  return {
    session,
    isLoading,
    resolvedRoute,
    navigateTo,
    goHome,
    openAuth,
    handleSubmit,
    handleLogout,
  };
}
