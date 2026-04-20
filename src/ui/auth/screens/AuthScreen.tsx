import { useEffect, useState, type FormEvent } from 'react';
import type { CSSProperties } from 'react';
import type { AuthDraft, AuthResult, AuthSession, AuthTab } from '../../../domain/auth/entities/auth';

interface AuthScreenProps {
  initialTab: AuthTab;
  session: AuthSession | null;
  onBackHome: () => void;
  onSubmit: (mode: AuthTab, draft: AuthDraft) => AuthResult;
  notice?: string;
}

const emptyDraft: AuthDraft = {
  identifier: '',
  password: '',
  alias: '',
  role: 'artist',
  remember: true,
};

export function AuthScreen({ initialTab, session, onBackHome, onSubmit, notice }: AuthScreenProps) {
  const [tab, setTab] = useState<AuthTab>(initialTab);
  const [draft, setDraft] = useState<AuthDraft>(emptyDraft);
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackTone, setFeedbackTone] = useState<'success' | 'error' | 'neutral'>('neutral');

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    setFeedback('');
    setShowPassword(false);
  }, [tab]);

  const handleChange = (field: keyof AuthDraft, value: string | boolean) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = onSubmit(tab, draft);
    setFeedback(result.message);
    setFeedbackTone(result.ok ? 'success' : 'error');

    if (result.ok) {
      setDraft((current) => ({
        ...current,
        password: '',
      }));
    }
  };

  return (
    <section className="page-shell page-shell--auth">
      <div className="page-shell__grain" />
      <div className="page-shell__pattern" />
      <div className="auth-orb" />

      <nav className="topbar topbar--auth">
        <div>
          <p className="topbar__eyebrow">MingaRecords</p>
          <strong className="topbar__brand">Bienvenido al origen</strong>
        </div>

        <button className="ghost-button" type="button" onClick={onBackHome}>
          Volver al inicio
        </button>
      </nav>

      <main className="auth-layout">
        <section className="auth-card">
          <div className="auth-card__head">
            <p className="eyebrow">Entrada ritual</p>
            <h1>Conectate sin esperar backend.</h1>
            <p>
              Login y registro funcionan con una capa local, validaciones suaves y estructura lista para la próxima API.
            </p>
          </div>

          {notice ? <div className="auth-feedback auth-feedback--neutral">{notice}</div> : null}

          {session ? <div className="session-banner">Sesión activa: {session.alias}</div> : null}

          <div className="auth-tabs" role="tablist" aria-label="Autenticación" style={{ '--active-tab': tab } as CSSProperties}>
            <button
              className={tab === 'login' ? 'tab-button is-active' : 'tab-button'}
              type="button"
              onClick={() => setTab('login')}
            >
              Entrar
            </button>
            <button
              className={tab === 'register' ? 'tab-button is-active' : 'tab-button'}
              type="button"
              onClick={() => setTab('register')}
            >
              Unirme a la Minga
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {tab === 'register' ? (
              <div className="role-grid">
                <label className={draft.role === 'producer' ? 'role-card is-selected' : 'role-card'}>
                  <input
                    checked={draft.role === 'producer'}
                    name="role"
                    type="radio"
                    value="producer"
                    onChange={() => handleChange('role', 'producer')}
                  />
                  <span className="role-card__title">Soy productor</span>
                  <span className="role-card__meta">Beatmaker / Sello / Creador</span>
                </label>

                <label className={draft.role === 'artist' ? 'role-card is-selected' : 'role-card'}>
                  <input
                    checked={draft.role === 'artist'}
                    name="role"
                    type="radio"
                    value="artist"
                    onChange={() => handleChange('role', 'artist')}
                  />
                  <span className="role-card__title">Soy artista</span>
                  <span className="role-card__meta">Buscador / Oyente / Curador</span>
                </label>
              </div>
            ) : null}

            <label className="field">
              <span>Nombre de usuario o email</span>
              <input
                value={draft.identifier}
                onChange={(event) => handleChange('identifier', event.target.value)}
                placeholder="Ej: guerrero_zenu"
                type="text"
              />
            </label>

            {tab === 'register' ? (
              <label className="field">
                <span>Alias del proyecto</span>
                <input
                  value={draft.alias}
                  onChange={(event) => handleChange('alias', event.target.value)}
                  placeholder="Tu nombre artístico"
                  type="text"
                />
              </label>
            ) : null}

            <label className="field field--password">
              <span>Contraseña sagrada</span>
              <input
                value={draft.password}
                onChange={(event) => handleChange('password', event.target.value)}
                placeholder="••••••••"
                type={showPassword ? 'text' : 'password'}
              />
              <button className="field__toggle" type="button" onClick={() => setShowPassword((current) => !current)}>
                {showPassword ? 'Ocultar' : 'Ver'}
              </button>
            </label>

            <div className="auth-row">
              <label className="checkbox">
                <input
                  checked={draft.remember}
                  type="checkbox"
                  onChange={(event) => handleChange('remember', event.target.checked)}
                />
                <span>Recordar mi esencia</span>
              </label>

              <button className="link-button" type="button" onClick={() => setFeedback('Recuperación todavía pendiente para la fase API.') }>
                ¿Olvidaste tu llave?
              </button>
            </div>

            {feedback ? <div className={`auth-feedback auth-feedback--${feedbackTone}`}>{feedback}</div> : null}

            <div className="auth-actions">
              <button className="primary-button primary-button--wide" type="submit">
                {tab === 'login' ? 'Ingresar' : 'Registrarme'}
              </button>
              <button
                className="secondary-button primary-button--wide"
                type="button"
                onClick={() => setTab((current) => (current === 'login' ? 'register' : 'login'))}
              >
                {tab === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta'}
              </button>
            </div>

            <div className="auth-hint">
              <strong>Demo:</strong> demo@mingarecords.com / minga123
            </div>
          </form>
        </section>

        <aside className="auth-side">
          <div className="auth-side__tile">
            <p className="panel-label">Estructura ADR</p>
            <h2>Dominio, aplicación e infraestructura</h2>
            <p>El login queda listo para crecer sin atarse a la capa visual ni a un proveedor concreto.</p>
          </div>

          <div className="auth-side__tile auth-side__tile--accent">
            <p className="panel-label">Back to home</p>
            <h2>Siempre volvés al centro</h2>
            <p>El botón superior devuelve a la página principal sin perder la sesión activa.</p>
          </div>
        </aside>
      </main>
    </section>
  );
}
