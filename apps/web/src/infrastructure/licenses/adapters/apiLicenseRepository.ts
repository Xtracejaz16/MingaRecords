import type { BeatLicense, LicenseTypeValue } from '../../../domain/licenses/entities/license.js';

const ACCESS_TOKEN_KEY = 'mr_access_token';
const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

const ERROR_MESSAGES: Record<number, string> = {
  400: 'Datos inválidos. Revisá el formulario.',
  401: 'Tu sesión expiró. Iniciá sesión de nuevo.',
  403: 'No tenés permiso para realizar esta acción.',
  404: 'Recurso no encontrado.',
  422: 'Precio fuera del rango permitido para esta licencia.',
  500: 'Error del servidor. Intentá más tarde.',
};

function readToken(): string | null {
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export class ApiLicenseRepository {
  async getLicenses(beatId: string): Promise<BeatLicense[]> {
    const token = readToken();
    const res = await fetch(`${API_BASE}/api/v1/beats/${beatId}/licenses`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const obj = body as Record<string, unknown>;
      throw new Error((obj.detail as string) ?? (obj.error as string) ?? ERROR_MESSAGES[res.status] ?? 'Error al cargar licencias');
    }

    return res.json() as Promise<BeatLicense[]>;
  }

  async upsertLicenses(
    beatId: string,
    licenses: Array<{ type: LicenseTypeValue; priceCents: number; isActive?: boolean }>,
  ): Promise<BeatLicense[]> {
    const token = readToken();
    const res = await fetch(`${API_BASE}/api/v1/beats/${beatId}/licenses`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(licenses),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const obj = body as Record<string, unknown>;
      throw new Error((obj.detail as string) ?? (obj.error as string) ?? ERROR_MESSAGES[res.status] ?? 'Error al guardar licencias');
    }

    return res.json() as Promise<BeatLicense[]>;
  }
}
