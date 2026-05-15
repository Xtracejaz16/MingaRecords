import { useEffect } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useNavigate } from '../../app/hooks/useAppShell';

export function useCartGuard() {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session || session.role !== 'artist') {
      navigate('#/login');
    }
  }, [session, navigate]);
}
