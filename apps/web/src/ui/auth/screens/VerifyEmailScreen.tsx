import { useEffect, useState } from 'react';
import { BrandLogo } from '../../shared/components/BrandLogo';

interface VerifyEmailScreenProps {
  onGoLogin: () => void;
}

type VerifyStatus = 'loading' | 'success' | 'error';

export function VerifyEmailScreen({ onGoLogin }: VerifyEmailScreenProps) {
  const [status, setStatus] = useState<VerifyStatus>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      // Extract token from hash: #/verify-email/<token>
      const hash = window.location.hash;
      const match = hash.match(/\/verify-(?:email|verificar)\/(.+)/);
      const token = match?.[1];

      if (!token) {
        if (!cancelled) {
          setStatus('error');
          setMessage('Link de verificación inválido. Faltó el token.');
        }
        return;
      }

      try {
        const baseUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`);

        if (!cancelled) {
          if (res.ok) {
            setStatus('success');
            setMessage('¡Email verificado exitosamente! Ya podés iniciar sesión.');
          } else {
            const body = await res.json().catch(() => ({}));
            const errorMsg = (body as Record<string, { message?: string }>).message ?? 'El link es inválido o expiró.';
            setStatus('error');
            setMessage(errorMsg);
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

          {status === 'success' && (
            <>
              <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center bg-muiscaGold/20 text-muiscaGold">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="font-headline mb-2 text-sm uppercase tracking-widest text-muiscaGold">¡Email verificado!</h1>
              <p className="font-body mb-6 text-xs italic text-koguiCream/60">{message}</p>
              <button
                className="primary-button primary-button--wide font-headline text-sm font-bold uppercase tracking-[0.2em]"
                onClick={onGoLogin}
              >
                Iniciar sesión
              </button>
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
