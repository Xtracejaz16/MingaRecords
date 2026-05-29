import { useState, useCallback } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

interface BeatmakerProfileForm {
  artistName: string;
  genre: string;
  profileImage: string;
}

interface FieldErrors {
  artistName?: string;
  genre?: string;
}

export function useBeatmakerProfile() {
  const { session, getAccessToken } = useAuth();
  const [form, setForm] = useState<BeatmakerProfileForm>({
    artistName: session?.alias ?? '',
    genre: '',
    profileImage: '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const updateField = useCallback((key: keyof BeatmakerProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[key as keyof FieldErrors];
      return next;
    });
    setError(null);
    setSuccess(null);
  }, []);

  const validate = useCallback((): boolean => {
    const errors: FieldErrors = {};

    if (!form.artistName.trim()) {
      errors.artistName = 'El nombre artístico es obligatorio';
    }

    if (!form.genre) {
      errors.genre = 'Seleccioná un género musical';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form.artistName, form.genre]);

  const save = useCallback(async () => {
    if (!validate()) return;

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
  }, [form, getAccessToken, validate]);

  return { form, fieldErrors, updateField, save, saving, error, success, session };
}
