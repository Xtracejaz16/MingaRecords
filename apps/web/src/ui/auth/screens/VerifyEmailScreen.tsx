import { useEffect, useRef, useState } from 'react';
import { BrandLogo } from '../../shared/components/BrandLogo';
import { useAuth } from '../hooks/useAuth';
import { useResendVerificationEmail } from '../hooks/useResendVerificationEmail';
import type { AuthRole } from '../../../domain/auth/entities/auth';

interface VerifyEmailScreenProps {
  onGoLogin: () => void;
  email?: string;
  onVerified?: (role: AuthRole) => void;
}

type VerifyStatus = 'loading' | 'success' | 'already-verified' | 'error' | 'expired' | 'gate';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function VerifyEmailScreen({ onGoLogin, email, onVerified }: VerifyEmailScreenProps) {
  const { session, loadSession, repository } = useAuth();
  const { resend, loading: resendLoading, error: resendError, sent } = useResendVerificationEmail(repository);
  const [status, setStatus] = useState<VerifyStatus>('loading');
  const [message, setMessage] = useState('');

  // On mount: if already verified, redirect immediately
  useEffect(() => {
    if (session?.emailVerified === true && onVerified) {
      onVerified(session.role);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Token verification effect
  useEffect(() => {
    let cancelled = false;

    async function verify() {
      // Extract token from URL query params
      // Supports: /verify-email?token=xxx (path) and #/verify-email?token=xxx (hash routing)
      let token = new URLSearchParams(window.location.search).get('token');
      if (!token) {
        token = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('token');
      }

      if (!token) {
        if (!cancelled) {
          setStatus('gate');
          setMessage('Revisá tu bandeja de entrada. Te enviamos un link de verificación.');
        }
        return;
      }

      try {
        const baseUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';
        const res = await fetch(`${baseUrl}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`);

        if (!cancelled) {
          if (res.ok) {
            const body = await res.json().catch(() => ({}));
            const bodyObj = body as Record<string, unknown>;
            if (bodyObj.status === 'ALREADY_VERIFIED') {
              setStatus('already-verified');
              setMessage('Tu email ya fue verificado.');
            } else {
              setStatus('success');
              setMessage('¡Email verificado exitosamente!');
            }
          } else {
            const body = await res.json().catch(() => ({}));
            const bodyObj = body as Record<string, unknown>;
            const errorCode = bodyObj.error as string | undefined;

            if (errorCode === 'TOKEN_EXPIRED') {
              setStatus('expired');
              setMessage('El link de verificación expiró. Solicitá uno nuevo.');
            } else {
              setStatus('error');
              setMessage((bodyObj.message as string) ?? 'El link es inválido.');
            }
          }
        }
      } catch {
        if (!cancelled) {
          setStatus('error');
          setMessage('No pudimos conectar con el servidor. Intentá de nuevo.');
        }
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-redirect on success/already-verified
  const onVerifiedRef = useRef(onVerified);
  onVerifiedRef.current = onVerified;

  useEffect(() => {
    if (status !== 'success' && status !== 'already-verified') return;

    let cancelled = false;

    async function redirectAfterVerification() {
      // Wait 300ms to reduce race condition while backend propagates emailVerified = true
      await sleep(300);
      const updatedSession = await loadSession();

      if (!cancelled && updatedSession?.emailVerified === true && onVerifiedRef.current) {
        // Wait 2s so user sees the confirmation message
        await sleep(2000);
        if (!cancelled) {
          onVerifiedRef.current(updatedSession.role);
        }
      }
    }

    redirectAfterVerification();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, loadSession]);

  // Resend handler
  const handleResend = async () => {
    const targetEmail = email ?? session?.email;
    if (!targetEmail) {
      onGoLogin();
      return;
    }
    await resend(targetEmail);
  };

  return (
    <section className="page-shell page-shell--dashboard min-h-screen bg-obsidian font-body text-koguiCream mineral-grain flex items-center justify-center">
      <main className="flex w-full max-w-md flex-col items-center px-4">
        <BrandLogo className="mb-8 h-16 w-16" />

        <div className="w-full border border-muiscaGold/20 bg-obsidian/80 p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto mb-6 h-8 w-8 animate-pulse bg-muiscaGold" />
              <h1 className="font-headline mb-2 text-sm uppercase tracking-widest">Verificando tu email...</h1>
              <p className="font-body text-xs italic text-koguiCream/60">Aguantá un toque</p>
            </>
          )}

          {status === 'gate' && (
            <>
              <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center bg-muiscaGold/20 text-muiscaGold">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="font-headline mb-2 text-sm uppercase tracking-widest text-muiscaGold">Revisá tu email</h1>
              <p className="font-body mb-6 text-xs italic text-koguiCream/60">{message}</p>
              <div className="grid gap-3">
                <button
                  className="primary-button primary-button--wide font-headline text-sm font-bold uppercase tracking-[0.2em]"
                  onClick={handleResend}
                  disabled={resendLoading || sent}
                >
                  {resendLoading ? 'Enviando...' : sent ? '¡Enviado!' : 'Reenviar link'}
                </button>
                {resendError && <p className="text-xs text-red-400">{resendError}</p>}
                <button
                  className="secondary-button primary-button--wide font-headline text-sm font-normal uppercase tracking-[0.2em]"
                  onClick={onGoLogin}
                >
                  Ir a iniciar sesión
                </button>
              </div>
            </>
          )}

          {(status === 'success' || status === 'already-verified') && (
            <>
              <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center bg-muiscaGold/20 text-muiscaGold">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="font-headline mb-2 text-sm uppercase tracking-widest text-muiscaGold">
                {status === 'already-verified' ? 'Ya verificado' : '¡Email verificado!'}
              </h1>
              <p className="font-body mb-6 text-xs italic text-koguiCream/60">{message}</p>
            </>
          )}

          {status === 'expired' && (
            <>
              <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center bg-amber-900/20 text-amber-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="font-headline mb-2 text-sm uppercase tracking-widest text-amber-400">Link expirado</h1>
              <p className="font-body mb-6 text-xs italic text-koguiCream/60">{message}</p>
              <div className="grid gap-3">
                <button
                  className="primary-button primary-button--wide font-headline text-sm font-bold uppercase tracking-[0.2em]"
                  onClick={handleResend}
                  disabled={resendLoading}
                >
                  {resendLoading ? 'Enviando...' : 'Solicitar nuevo link'}
                </button>
                {resendError && <p className="text-xs text-red-400">{resendError}</p>}
                <button
                  className="secondary-button primary-button--wide font-headline text-sm font-normal uppercase tracking-[0.2em]"
                  onClick={onGoLogin}
                >
                  Ir a iniciar sesión
                </button>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center bg-red-900/20 text-red-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="font-headline mb-2 text-sm uppercase tracking-widest text-red-400">Error de verificación</h1>
              <p className="font-body mb-6 text-xs italic text-koguiCream/60">{message}</p>
              <button
                className="primary-button primary-button--wide font-headline text-sm font-bold uppercase tracking-[0.2em]"
                onClick={onGoLogin}
              >
                Ir a iniciar sesión
              </button>
            </>
          )}
        </div>
      </main>
    </section>
  );
}
