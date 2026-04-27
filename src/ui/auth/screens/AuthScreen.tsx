import { useEffect, useState, type FormEvent } from 'react';
import { EyeIcon, EyeOffIcon, Music2, Waves } from 'lucide-react';
import type { AuthDraft, AuthResult, AuthTab } from '../../../domain/auth/entities/auth';
import { BrandLogo } from '../../shared/components/BrandLogo';

interface AuthScreenProps {
  initialTab: AuthTab;
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

export function AuthScreen({ initialTab, onBackHome, onSubmit, notice }: AuthScreenProps) {
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
        <BrandLogo />

        <button className="ghost-button" type="button" onClick={onBackHome}>
          Volver al inicio
        </button>
      </nav>

      <main className="min-h-screen flex items-center justify-center pt-24 px-4">
        <section className="w-full max-w-lg mx-auto rounded-none auth-card-shell p-10 shadow-[0_0_40px_rgba(69,43,0,0.15)] border border-muiscaGold/20">
          <div className="space-y-5">
              {notice ? <div className="auth-feedback auth-feedback--neutral font-body text-xs">{notice}</div> : null}

              <header className="auth-hero">
              <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-widest uppercase">BIENVENIDO AL ORIGEN</h1>
              <p className="font-body text-base font-light italic tracking-wide">Únete al tejido digital de la música ancestral</p>
            </header>

            <div className="flex gap-5 border-b border-muiscaGold/20">
                <button
                  className={tab === 'login' ? 'tab-button is-active w-full font-headline text-sm font-normal uppercase tracking-widest' : 'tab-button w-full font-headline text-sm font-normal uppercase tracking-widest'}
                  type="button"
                  onClick={() => setTab('login')}
                >
                Entrar
              </button>
                <button
                  className={tab === 'register' ? 'tab-button is-active w-full font-headline text-sm font-normal uppercase tracking-widest' : 'tab-button w-full font-headline text-sm font-normal uppercase tracking-widest'}
                  type="button"
                  onClick={() => setTab('register')}
                >
                Unirme a la Minga
              </button>
            </div>

            <div className="auth-emblem" aria-hidden="true">
              <svg viewBox="0 0 64 64" className="h-9 w-9 text-[#8b6a2a]" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="32" cy="12" r="4" />
                <circle cx="32" cy="52" r="4" />
                <circle cx="12" cy="32" r="4" />
                <circle cx="52" cy="32" r="4" />
                <circle cx="21" cy="21" r="4" />
                <circle cx="43" cy="21" r="4" />
                <circle cx="21" cy="43" r="4" />
                <circle cx="43" cy="43" r="4" />
                <path d="M32 16v12M32 36v12M16 32h12M36 32h12M24 24l6 6M40 24l-6 6M24 40l6-6M40 40l-6-6" />
              </svg>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {tab === 'register' ? (
                <div className="mb-8 grid grid-cols-2 gap-4">
                  <label className="group relative cursor-pointer">
                    <input
                      checked={draft.role === 'producer'}
                      className="peer hidden"
                      name="role"
                      type="radio"
                      value="producer"
                      onChange={() => handleChange('role', 'producer')}
                    />
                    <div className="rounded-none border border-muiscaGold/30 p-4 text-center transition-all duration-300 peer-checked:border-muiscaGold peer-checked:bg-muiscaGold/5">
                      <Waves className="mx-auto mb-2 h-5 w-5 text-koguiCream/70 transition-colors peer-checked:text-muiscaGold" />
                      <span className="font-headline block text-[10px] uppercase tracking-tighter">SOY PRODUCTOR</span>
                    </div>
                  </label>

                  <label className="group relative cursor-pointer">
                    <input
                      checked={draft.role === 'artist'}
                      className="peer hidden"
                      name="role"
                      type="radio"
                      value="artist"
                      onChange={() => handleChange('role', 'artist')}
                    />
                    <div className="rounded-none border border-muiscaGold/30 p-4 text-center transition-all duration-300 peer-checked:border-muiscaGold peer-checked:bg-muiscaGold/5">
                      <Music2 className="mx-auto mb-2 h-5 w-5 text-koguiCream/70 transition-colors peer-checked:text-muiscaGold" />
                      <span className="font-headline block text-[10px] uppercase tracking-tighter">SOY ARTISTA</span>
                    </div>
                  </label>
                </div>
              ) : null}

              <label className="field font-headline text-[10px] font-normal uppercase tracking-widest">
                <span>Nombre de usuario o email</span>
                <input
                  className="w-full font-body text-base font-normal placeholder:italic placeholder:opacity-30"
                  value={draft.identifier}
                  onChange={(event) => handleChange('identifier', event.target.value)}
                  placeholder="Ej: guerrero_zenu"
                  type="text"
                />
              </label>

              {tab === 'register' ? (
                  <label className="field font-headline text-[10px] font-normal uppercase tracking-widest">
                    <span>Alias del proyecto</span>
                    <input
                      className="w-full font-body text-base font-normal placeholder:italic placeholder:opacity-30"
                      value={draft.alias}
                      onChange={(event) => handleChange('alias', event.target.value)}
                      placeholder="Tu nombre artístico"
                    type="text"
                  />
                </label>
              ) : null}

              <label className="field field--password font-headline text-[10px] font-normal uppercase tracking-widest">
                <span>Contraseña sagrada</span>
                <input
                  className="w-full pr-12 font-body text-base font-normal placeholder:italic placeholder:opacity-30"
                  value={draft.password}
                  onChange={(event) => handleChange('password', event.target.value)}
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                />
                <button className="field__toggle flex h-8 w-8 items-center justify-center" type="button" onClick={() => setShowPassword((current) => !current)}>
                  {showPassword ? <EyeOffIcon className="h-5 w-5 text-muiscaGold" /> : <EyeIcon className="h-5 w-5 text-muiscaGold" />}
                </button>
              </label>

              <div className="flex items-center justify-between gap-5">
                <label className="checkbox">
                  <input
                    checked={draft.remember}
                    type="checkbox"
                    onChange={(event) => handleChange('remember', event.target.checked)}
                  />
                  <span className="font-body text-xs font-normal italic">Recordar mi esencia</span>
                </label>

                <button className="link-button font-body text-xs font-normal underline underline-offset-4" type="button" onClick={() => setFeedback('Recuperación todavía pendiente para la fase API.') }>
                  ¿Olvidaste tu llave?
                </button>
              </div>

              {feedback ? <div className={`auth-feedback auth-feedback--${feedbackTone}`}>{feedback}</div> : null}

              <div className="grid gap-5">
                <button className="primary-button primary-button--wide font-headline text-sm font-bold uppercase tracking-[0.2em]" type="submit">
                  {tab === 'login' ? 'Ingresar' : 'Registrarme'}
                </button>
                <button
                  className="secondary-button primary-button--wide font-headline text-sm font-normal uppercase tracking-[0.2em]"
                  type="button"
                  onClick={() => setTab((current) => (current === 'login' ? 'register' : 'login'))}
                >
                  {tab === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </section>
  );
}
