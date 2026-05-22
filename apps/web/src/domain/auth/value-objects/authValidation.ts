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

  if (draft.password.trim().length < 8) {
    return 'La llave debe tener al menos 8 caracteres.';
  }

  if (!/[A-Z]/.test(draft.password)) {
    return 'La llave debe tener al menos una mayúscula.';
  }

  if (!/[0-9]/.test(draft.password)) {
    return 'La llave debe tener al menos un número.';
  }

  return null;
}
