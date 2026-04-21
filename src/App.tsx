import { useAppShell } from './ui/app/hooks/useAppShell';
import { AuthScreen } from './ui/auth/screens/AuthScreen';
import { PanelScreen } from './ui/auth/screens/PanelScreen';
import { HomeScreen } from './ui/home/screens/HomeScreen';
import { NotFoundScreen } from './ui/app/screens/NotFoundScreen';
import './index.css';

function App() {
  const { session, resolvedRoute, goHome, openAuth, handleSubmit, handleLogout } = useAppShell();

  if (resolvedRoute.key === 'panel' && !session) {
    return (
      <AuthScreen
        initialTab="login"
        onBackHome={goHome}
        onSubmit={handleSubmit('panel')}
        session={session}
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
    return <PanelScreen onGoHome={goHome} onLogout={handleLogout} session={session} />;
  }

  if (resolvedRoute.key === 'login' || resolvedRoute.key === 'register') {
    return (
      <AuthScreen
        initialTab={resolvedRoute.authTab ?? 'login'}
        onBackHome={goHome}
        onSubmit={handleSubmit('home')}
        session={session}
      />
    );
  }

  return <HomeScreen />;
}

export default App;
