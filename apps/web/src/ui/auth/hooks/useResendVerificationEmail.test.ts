import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { AuthRepository } from '../../../domain/auth/ports/AuthRepository';
import { useResendVerificationEmail } from './useResendVerificationEmail';

function createMockRepository(options: {
  resendResult?: { ok: boolean; message: string };
} = {}): AuthRepository {
  const { resendResult = { ok: true, message: 'Email enviado.' } } = options;

  return {
    login: async () => ({ ok: false, message: '' }),
    register: async () => ({ ok: false, message: '' }),
    logout: async () => ({ ok: true, message: '' }),
    loadSession: async () => null,
    saveSession: async () => {},
    getCurrentUser: async () => null,
    resendVerificationEmail: async () => resendResult,
  };
}

describe('useResendVerificationEmail', () => {
  it('calls repository.resendVerificationEmail with the provided email', async () => {
    let receivedEmail = '';
    const repo: AuthRepository = {
      login: async () => ({ ok: false, message: '' }),
      register: async () => ({ ok: false, message: '' }),
      logout: async () => ({ ok: true, message: '' }),
      loadSession: async () => null,
      saveSession: async () => {},
      getCurrentUser: async () => null,
      resendVerificationEmail: async (email) => {
        receivedEmail = email;
        return { ok: true, message: 'Email enviado.' };
      },
    };

    const { result } = renderHook(() => useResendVerificationEmail(repo));

    await act(async () => {
      await result.current.resend('user@mingarecords.com');
    });

    expect(receivedEmail).toBe('user@mingarecords.com');
    expect(result.current.sent).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('sets error message when repository returns failure', async () => {
    const repo = createMockRepository({
      resendResult: { ok: false, message: 'Rate limit excedido.' },
    });

    const { result } = renderHook(() => useResendVerificationEmail(repo));

    await act(async () => {
      await result.current.resend('user@mingarecords.com');
    });

    expect(result.current.sent).toBe(false);
    expect(result.current.error).toBe('Rate limit excedido.');
  });

  it('sets generic error message when repository throws', async () => {
    const repo: AuthRepository = {
      login: async () => ({ ok: false, message: '' }),
      register: async () => ({ ok: false, message: '' }),
      logout: async () => ({ ok: true, message: '' }),
      loadSession: async () => null,
      saveSession: async () => {},
      getCurrentUser: async () => null,
      resendVerificationEmail: async () => {
        throw new Error('Network error');
      },
    };

    const { result } = renderHook(() => useResendVerificationEmail(repo));

    await act(async () => {
      await result.current.resend('user@mingarecords.com');
    });

    expect(result.current.sent).toBe(false);
    expect(result.current.error).toBe('No pudimos enviar el email. Intentá de nuevo.');
  });

  it('tracks loading state during resend', async () => {
    let resolveResend: (value: { ok: boolean; message: string }) => void;
    const repo: AuthRepository = {
      login: async () => ({ ok: false, message: '' }),
      register: async () => ({ ok: false, message: '' }),
      logout: async () => ({ ok: true, message: '' }),
      loadSession: async () => null,
      saveSession: async () => {},
      getCurrentUser: async () => null,
      resendVerificationEmail: async () => {
        return new Promise((resolve) => {
          resolveResend = resolve;
        });
      },
    };

    const { result } = renderHook(() => useResendVerificationEmail(repo));

    expect(result.current.loading).toBe(false);

    act(() => {
      result.current.resend('user@mingarecords.com');
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveResend!({ ok: true, message: 'Email enviado.' });
    });

    expect(result.current.loading).toBe(false);
  });
});
