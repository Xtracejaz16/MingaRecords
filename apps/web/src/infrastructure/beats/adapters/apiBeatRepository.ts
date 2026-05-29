import type { Beat, CreateBeatInput } from '../../../domain/beats/entities/beat.js';

interface ListBeatsParams {
  page?: number;
  limit?: number;
  genre?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  sort?: string;
}

interface PaginatedBeats {
  data: Beat[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    next: number | null;
    prev: number | null;
  };
}

interface UploadResult {
  key: string;
  url: string;
}

const ACCESS_TOKEN_KEY = 'mr_access_token';

const ERROR_MESSAGES: Record<number, string> = {
  400: 'Datos inválidos. Revisá el formulario.',
  401: 'Tu sesión expiró. Iniciá sesión de nuevo.',
  403: 'No tenés permiso para realizar esta acción.',
  404: 'Recurso no encontrado.',
  500: 'Error del servidor. Intentá más tarde.',
};

function readToken(): string | null {
  try {
    return window.localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export class ApiBeatRepository {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';
  }

  async getBeats(params: ListBeatsParams = {}): Promise<PaginatedBeats> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.genre) searchParams.set('genre', params.genre);
    if (params.minPrice !== undefined) searchParams.set('minPrice', String(params.minPrice));
    if (params.maxPrice !== undefined) searchParams.set('maxPrice', String(params.maxPrice));
    if (params.q) searchParams.set('q', params.q);
    if (params.sort) searchParams.set('sort', params.sort);

    const qs = searchParams.toString();
    const url = `${this.baseUrl}/api/v1/beats${qs ? `?${qs}` : ''}`;

    const res = await fetch(url);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as Record<string, unknown>).error as string ?? ERROR_MESSAGES[res.status] ?? 'Error al cargar beats');
    }

    return res.json() as Promise<PaginatedBeats>;
  }

  async getBeat(id: string): Promise<Beat> {
    const res = await fetch(`${this.baseUrl}/api/v1/beats/${id}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error((body as Record<string, unknown>).error as string ?? ERROR_MESSAGES[res.status] ?? 'Beat no encontrado');
    }
    return res.json() as Promise<Beat>;
  }

  async createBeat(input: CreateBeatInput): Promise<Beat> {
    const token = readToken();
    const res = await fetch(`${this.baseUrl}/api/v1/beats`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const obj = body as Record<string, unknown>;
      throw new Error((obj.detail as string) ?? (obj.error as string) ?? ERROR_MESSAGES[res.status] ?? 'Error al crear beat');
    }

    return res.json() as Promise<Beat>;
  }

  async deleteBeat(id: string): Promise<void> {
    const token = readToken();
    const res = await fetch(`${this.baseUrl}/api/v1/beats/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const obj = body as Record<string, unknown>;
      throw new Error((obj.error as string) ?? ERROR_MESSAGES[res.status] ?? 'Error al eliminar beat');
    }
  }

  async uploadAudio(beatId: string, file: File): Promise<UploadResult> {
    const token = readToken();
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${this.baseUrl}/api/v1/storage/upload/${beatId}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const obj = body as Record<string, unknown>;
      throw new Error((obj.error as string) ?? ERROR_MESSAGES[res.status] ?? 'Error al subir audio');
    }

    return res.json() as Promise<UploadResult>;
  }

  async uploadCover(beatId: string, file: File): Promise<UploadResult> {
    const token = readToken();
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${this.baseUrl}/api/v1/storage/cover/${beatId}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const obj = body as Record<string, unknown>;
      throw new Error((obj.error as string) ?? ERROR_MESSAGES[res.status] ?? 'Error al subir portada');
    }

    return res.json() as Promise<UploadResult>;
  }
}
