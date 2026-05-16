import { useMemo } from 'react';
import type { AuthSession } from '../../../domain/auth/entities/auth';

export type GuardVariant =
  | { allowed: true }
  | { allowed: false; variant: 'not-logged-in' | 'wrong-role' };

export function checkCartAccess(session: AuthSession | null): GuardVariant {
  if (!session) {
    return { allowed: false, variant: 'not-logged-in' };
  }
  if (session.role !== 'artist') {
    return { allowed: false, variant: 'wrong-role' };
  }
  return { allowed: true };
}

export function useCartGuard(session: AuthSession | null) {
  return useMemo(() => checkCartAccess(session), [session]);
}