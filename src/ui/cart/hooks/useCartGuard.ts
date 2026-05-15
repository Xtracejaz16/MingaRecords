import { useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';

export function useCartGuard() {
  const { session } = useAuth();

  useEffect(() => {
    if (!session || session.role !== 'artist') {
      window.location.hash = '#/login';
    }
  }, [session]);
}
