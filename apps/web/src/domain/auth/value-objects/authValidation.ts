import type { AuthDraft, AuthTab } from '../entities/auth';

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validateDraft(mode: AuthTab, draft: AuthDraft): string | null {
  if (!draft.email.trim()) {
    return 'Ingresá un email.';
  }

  if (draft.email.trim().length < 3) {
    return 'El email debe tener al menos 3 caracteres.';
  }

  if (mode === 'register' && !draft.alias.trim()) {
    return 'Elegí un alias para tu proyecto.';
  }

  if (draft.password.trim().length < 4) {
    return 'La llave debe tener al menos 4 caracteres.';
  }

  return null;
}
