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

  if (resolvedRoute.key === 'panel' && !session) {
    return (
      <AuthScreen
        initialTab="login"
        onBackHome={goHome}
        onSubmit={handleSubmit('panel')}
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

  if (resolvedRoute.key === 'panel' && session) {
    return <DashboardPage />;
  }

  if ((resolvedRoute.key === 'beats' || resolvedRoute.key === 'ganancias' || resolvedRoute.key === 'analisis' || resolvedRoute.key === 'actualizaciones' || resolvedRoute.key === 'configuracion') && !session) {
    return (
      <AuthScreen
        initialTab="login"
        onBackHome={goHome}
        onSubmit={handleSubmit('panel')}
        notice="Necesitás iniciar sesión para entrar al panel privado."
      />
    );
  }

  if (resolvedRoute.key === 'beats' && session) {
    return <BeatsPage />;
  }

  if (resolvedRoute.key === 'ganancias' && session) {
    return <GananciasPage />;
  }

  if (resolvedRoute.key === 'analisis' && session) {
    return <AnalisisPage />;
  }

  if (resolvedRoute.key === 'actualizaciones' && session) {
    return <ActualizacionesPage />;
  }

  if (resolvedRoute.key === 'configuracion' && session) {
    return <ConfiguracionPage />;
  }

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
