import { useState } from 'react';
import { resendVerificationEmail as resendUseCase } from '../../../application/auth/use-cases/resendVerificationEmail';
import type { AuthRepository } from '../../../domain/auth/ports/AuthRepository';

export function useResendVerificationEmail(repository: AuthRepository) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const resend = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await resendUseCase(repository, email);
      setSent(result.ok);
      if (!result.ok) setError(result.message);
    } catch {
      setError('No pudimos enviar el email. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return { resend, loading, error, sent };
}
