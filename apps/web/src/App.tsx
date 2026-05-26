import { useAppShell } from './ui/app/hooks/useAppShell';
import { AuthScreen } from './ui/auth/screens/AuthScreen';
import { VerifyEmailScreen } from './ui/auth/screens/VerifyEmailScreen';
import { DashboardPage } from './ui/dashboard/components/DashboardPage';
import { HomeScreen } from './ui/home/screens/HomeScreen';
import { NotFoundScreen } from './ui/app/screens/NotFoundScreen';
import { PanelDeniedScreen } from './ui/app/screens/PanelDeniedScreen';
import { MarketplaceDeniedScreen } from './ui/app/screens/MarketplaceDeniedScreen';
import { BeatsPage } from './ui/beats/components/BeatsPage';
import { GananciasPage } from './ui/ganancias/components/GananciasPage';
import { AnalisisPage } from './ui/analisis/components/AnalisisPage';
import { ActualizacionesPage } from './ui/actualizaciones/components/ActualizacionesPage';
import { ConfiguracionPage } from './ui/configuracion/components/ConfiguracionPage';
import { MarketplacePage } from './ui/marketplace/pages/MarketplacePage';
import { IntercambioPage } from './ui/cart/components/IntercambioPage';
import './index.css';
import { useEffect } from 'react';

function App() {
  // Detect legacy /verify-email?token=xxx paths (from old email links)
  // and convert them to hash routing so VerifyEmailScreen can process them
  // Uses hash assignment (no reload) so useAppShell can pick it up via hashchange
  useEffect(() => {
    if (
      window.location.pathname.startsWith('/verify-email') &&
      !window.location.hash.startsWith('#/verify-email')
    ) {
      const search = window.location.search;
      window.location.hash = `/verify-email${search}`;
    }
  }, []);

  const { session, isLoading, resolvedRoute, goHome, openAuth, handleSubmit, navigateTo } = useAppShell();

  if (isLoading) {
    return (
      <main className="page-shell page-shell--dashboard min-h-screen bg-obsidian font-body text-koguiCream mineral-grain flex items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 bg-muiscaGold animate-pulse" />
          <span className="font-headline text-sm tracking-widest text-koguiCream/60 uppercase">Cargando...</span>
        </div>
      </main>
    );
  }

  const isVerified = session?.emailVerified === true;
  const allowedUnverified: string[] = ['home', 'login', 'register', 'verify-email'];

  // Gate: logged in but email not verified → force verify-email screen
  if (session && !isVerified && !allowedUnverified.includes(resolvedRoute.key)) {
    return (
      <VerifyEmailScreen
        email={session.email}
        onGoLogin={() => openAuth('login')}
        onVerified={(role) => navigateTo(role === 'artist' ? 'marketplace' : 'panel')}
      />
    );
  }

  if (resolvedRoute.kind === 'private' && resolvedRoute.key !== 'notFound' && !session) {
    const targetLabel =
      resolvedRoute.key === 'marketplace'
        ? 'entrar al marketplace'
        : resolvedRoute.key === 'panel'
          ? 'entrar al panel privado'
          : 'acceder a esta sección';

    return (
      <AuthScreen
        initialTab="login"
        onBackHome={goHome}
        onSubmit={handleSubmit(resolvedRoute.key)}
        notice={`Necesitás iniciar sesión para ${targetLabel}.`}
      />
    );
  }

  if (resolvedRoute.key === 'panel' && session?.role === 'artist') {
    return (
      <PanelDeniedScreen
        onGoHome={goHome}
        onGoLogin={() => openAuth('login')}
      />
    );
  }

  // Gate: marketplace requires verified email
  if (resolvedRoute.key === 'marketplace' && session && !isVerified) {
    return (
      <VerifyEmailScreen
        email={session.email}
        onGoLogin={() => openAuth('login')}
        onVerified={(role) => navigateTo(role === 'artist' ? 'marketplace' : 'panel')}
      />
    );
  }

  if (resolvedRoute.key === 'marketplace' && !session) {
    return (
      <AuthScreen
        initialTab="login"
        onBackHome={goHome}
        onSubmit={handleSubmit('marketplace')}
        notice="Necesitás iniciar sesión para entrar al marketplace."
      />
    );
  }

  if (resolvedRoute.key === 'marketplace' && session?.role === 'producer') {
    return (
      <MarketplaceDeniedScreen
        onGoHome={goHome}
        onGoLogin={() => openAuth('login')}
      />
    );
  }

  if (resolvedRoute.key === 'intercambio' && session?.role === 'producer') {
    return (
      <MarketplaceDeniedScreen
        onGoHome={goHome}
        onGoLogin={() => openAuth('login')}
      />
    );
  }

  if (resolvedRoute.kind === 'notFound') {
    return (
      <NotFoundScreen
        onGoHome={goHome}
        onGoLogin={() => openAuth('login')}
      />
    );
  }

  if (resolvedRoute.key === 'panel') return <DashboardPage />;
  if (resolvedRoute.key === 'beats') return <BeatsPage />;
  if (resolvedRoute.key === 'ganancias') return <GananciasPage />;
  if (resolvedRoute.key === 'analisis') return <AnalisisPage />;
  if (resolvedRoute.key === 'actualizaciones') return <ActualizacionesPage />;
  if (resolvedRoute.key === 'configuracion') return <ConfiguracionPage />;
  if (resolvedRoute.key === 'marketplace') return <MarketplacePage />;
  if (resolvedRoute.key === 'intercambio') return <IntercambioPage />;

  if (resolvedRoute.key === 'verify-email') {
    return (
      <VerifyEmailScreen
        email={session?.email}
        onGoLogin={() => openAuth('login')}
        onVerified={(role) => navigateTo(role === 'artist' ? 'marketplace' : 'panel')}
      />
    );
  }

  if (resolvedRoute.key === 'login' || resolvedRoute.key === 'register') {
    return (
      <AuthScreen
        initialTab={resolvedRoute.authTab ?? 'login'}
        onBackHome={goHome}
        onSubmit={handleSubmit('panel')}
      />
    );
  }

  return <HomeScreen />;
}

export default App;
