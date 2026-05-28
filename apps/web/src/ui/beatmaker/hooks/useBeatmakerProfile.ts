import { useState, useCallback } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

interface BeatmakerProfileForm {
  artistName: string;
  genre: string;
  profileImage: string;
}

export function useBeatmakerProfile() {
  const { session, getAccessToken } = useAuth();
  const [form, setForm] = useState<BeatmakerProfileForm>({
    artistName: session?.alias ?? '',
    genre: '',
    profileImage: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateField = useCallback((key: keyof BeatmakerProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
    setSuccess(null);
  }, []);

  const save = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = getAccessToken();
      const res = await fetch(`${API_BASE}/api/v1/beatmaker/perfil`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          artistName: form.artistName || null,
          genre: form.genre || null,
          profileImage: form.profileImage || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as Record<string, unknown>).error as string ?? (data as Record<string, unknown>).message as string ?? 'Error al guardar el perfil');
      }

      setSuccess('Perfil guardado correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setSaving(false);
    }
  }, [form, getAccessToken]);

  return { form, updateField, save, saving, error, success, session };
}
