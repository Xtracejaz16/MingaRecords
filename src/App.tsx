import { useEffect, useMemo, useState, useCallback } from 'react';
import { createAuthService } from './application/auth';
import type { AuthDraft, AuthSession, AuthTab } from './domain/auth';
import { createBrowserAuthRepository } from './infrastructure/authRepository';
import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { NotFoundScreen } from './screens/NotFoundScreen';
import { PanelScreen } from './screens/PanelScreen';
import { canonicalHashForRoute, resolveHashRoute, type AppRouteKey } from './routing/routes';
import './index.css';

function App() {
  const repository = useMemo(() => createBrowserAuthRepository(), []);
  const authService = useMemo(() => createAuthService(repository), [repository]);

  const [session, setSession] = useState<AuthSession | null>(() => repository.loadSession());
  const [hash, setHash] = useState(() => window.location.hash || '#/');

  const syncRouteFromHash = useCallback(() => {
    setHash(window.location.hash || '#/');
  }, []);

  useEffect(() => {
    syncRouteFromHash();
    window.addEventListener('hashchange', syncRouteFromHash);

    return () => window.removeEventListener('hashchange', syncRouteFromHash);
  }, [syncRouteFromHash]);

  const route = useMemo(() => resolveHashRoute(hash), [hash]);

  useEffect(() => {
    if (route.kind === 'notFound' || !route.canonicalHash) {
      return;
    }

    if (window.location.hash !== route.canonicalHash) {
      window.history.replaceState(null, '', route.canonicalHash);
      setHash(route.canonicalHash);
    }
  }, [route.canonicalHash, route.kind]);

const navigateTo = useCallback((target: AppRouteKey) => {
    window.location.hash = canonicalHashForRoute(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openAuth = useCallback((tab: AuthTab) => {
    navigateTo(tab === 'login' ? 'login' : 'register');
  }, [navigateTo]);

  const submitAuth = useCallback(
    (nextRoute: AppRouteKey) => (mode: AuthTab, draft: AuthDraft) => {
      const result = mode === 'login' ? authService.login(draft) : authService.register(draft);

      if (result.ok && result.user) {
        setSession(result.user);
        navigateTo(nextRoute);
      }

      return result;
    },
    [authService, navigateTo],
  );

  const handleLogout = useCallback(() => {
    setSession(null);
    authService.clearSession();
    navigateTo('home');
  }, [authService, navigateTo]);

  const goHome = useCallback(() => navigateTo('home'), [navigateTo]);

  if (route.key === 'panel' && !session) {
    return (
      <AuthScreen
        initialTab="login"
        onBackHome={goHome}
        onSubmit={submitAuth('panel')}
        session={session}
        notice="Necesitás iniciar sesión para entrar al panel privado."
      />
    );
  }

  if (route.kind === 'notFound') {
    return (
      <NotFoundScreen
        onGoHome={goHome}
        onGoLogin={() => openAuth('login')}
      />
    );
  }

  if (route.key === 'panel' && session) {
    return <PanelScreen onGoHome={goHome} onLogout={handleLogout} session={session} />;
  }

  if (route.key === 'login' || route.key === 'register') {
    return (
      <AuthScreen
        initialTab={route.authTab ?? 'login'}
        onBackHome={goHome}
        onSubmit={submitAuth('home')}
        session={session}
      />
    );
  }

  return (
    <HomeScreen />
  );
}

export default App;
