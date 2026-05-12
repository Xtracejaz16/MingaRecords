import { useAppShell } from './ui/app/hooks/useAppShell';
import { AuthScreen } from './ui/auth/screens/AuthScreen';
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
import './index.css';

function App() {
  const { session, resolvedRoute, goHome, openAuth, handleSubmit } = useAppShell();

  if (resolvedRoute.kind === 'private' && resolvedRoute.key !== 'notFound' && !session) {
    const targetLabel = resolvedRoute?.key === 'marketplace' ? 'entrar al marketplace' : 'entrar al panel privado';

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

  if (resolvedRoute.key === 'marketplace' && session?.role === 'producer') {
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
