import { useAppShell } from './ui/app/hooks/useAppShell';
import { AuthScreen } from './ui/auth/screens/AuthScreen';
import { DashboardPage } from './ui/dashboard/components/DashboardPage';
import { HomeScreen } from './ui/home/screens/HomeScreen';
import { NotFoundScreen } from './ui/app/screens/NotFoundScreen';
import { PanelDeniedScreen } from './ui/app/screens/PanelDeniedScreen';
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

  if (resolvedRoute.key === 'panel' && session?.role === 'artist') {
    return (
      <PanelDeniedScreen
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

  if (resolvedRoute.key === 'panel' && session) {
    return <DashboardPage />;
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
