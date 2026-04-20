import { useEffect, useState } from 'react';
import type { AuthDraft, AuthTab } from '../../../domain/auth/entities/auth';
import { useAuth } from '../../auth/hooks/useAuth';
import { canonicalHashForRoute, resolveHashRoute, type AppRouteKey } from '../../../routing/routes';

export function useAppShell() {
  const { session, submitAuth, logout } = useAuth();
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

    if (window.location.hash !== resolvedRoute.canonicalHash) {
      window.history.replaceState(null, '', resolvedRoute.canonicalHash);
      setHash(resolvedRoute.canonicalHash);
    }
  }, [resolvedRoute.canonicalHash, resolvedRoute.kind]);

  const navigateTo = (target: AppRouteKey) => {
    window.location.hash = canonicalHashForRoute(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAuth = (tab: AuthTab) => {
    navigateTo(tab === 'login' ? 'login' : 'register');
  };

  const handleSubmit = (nextRoute: AppRouteKey) => (mode: AuthTab, draft: AuthDraft) => {
    const result = submitAuth(mode, draft);

    if (result.ok && result.user) {
      navigateTo(nextRoute);
    }

    return result;
  };

  const handleLogout = () => {
    logout();
    navigateTo('home');
  };

  const goHome = () => navigateTo('home');

  return {
    session,
    resolvedRoute,
    goHome,
    openAuth,
    handleSubmit,
    handleLogout,
  };
}
