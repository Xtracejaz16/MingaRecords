import type { AppRouteKey } from './routing/routes';
import { useAppShell } from './ui/app/hooks/useAppShell';
import { AuthScreen } from './ui/auth/screens/AuthScreen';
import { DashboardPage } from './ui/dashboard/components/DashboardPage';
import { HomeScreen } from './ui/home/screens/HomeScreen';
import { NotFoundScreen } from './ui/app/screens/NotFoundScreen';
import { BeatsPage } from './ui/beats/components/BeatsPage';
import { GananciasPage } from './ui/ganancias/components/GananciasPage';
import { AnalisisPage } from './ui/analisis/components/AnalisisPage';
import { ActualizacionesPage } from './ui/actualizaciones/components/ActualizacionesPage';
import { ConfiguracionPage } from './ui/configuracion/components/ConfiguracionPage';
import './index.css';

function App() {
  const { session, resolvedRoute, goHome, openAuth, handleSubmit } = useAppShell();

  if (resolvedRoute.kind === 'private' && !session) {
    return (
      <AuthScreen
        initialTab="login"
        onBackHome={goHome}
        onSubmit={handleSubmit(resolvedRoute.key as AppRouteKey)}
        notice="Necesitás iniciar sesión para entrar al panel privado."
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

  if (resolvedRoute.key === 'login' || resolvedRoute.key === 'register') {
    return (
      <AuthScreen
        initialTab={resolvedRoute.authTab ?? 'login'}
        onBackHome={goHome}
        onSubmit={handleSubmit('home')}
      />
    );
  }

  return <HomeScreen />;
}

export default App;
