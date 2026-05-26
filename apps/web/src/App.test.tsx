import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

const PRODUCER_SESSION = {
  id: '1',
  email: 'demo@mingarecords.com',
  alias: 'Kogui Demo',
  role: 'producer',
  emailVerified: true,
  createdAt: new Date().toISOString(),
};

const ARTIST_SESSION = {
  id: '2',
  email: 'artista@mingarecords.com',
  alias: 'Minga Artista',
  role: 'artist',
  emailVerified: true,
  createdAt: new Date().toISOString(),
};

function mockFetchSession(session: unknown) {
  const fetchMock = vi.mocked(globalThis.fetch);
  fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/auth/me')) {
      return new Response(JSON.stringify(session), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(null, { status: 404 });
  });
}

function mockFetchNoSession() {
  const fetchMock = vi.mocked(globalThis.fetch);
  fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/auth/me')) {
      return new Response(null, { status: 401 });
    }
    return new Response(null, { status: 404 });
  });
}

function mockFetchLogin(session: unknown) {
  const fetchMock = vi.mocked(globalThis.fetch);
  fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/auth/login') && init?.method === 'POST') {
      return new Response(
        JSON.stringify({ accessToken: 'test-token', user: session }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    if (url.includes('/auth/me')) {
      return new Response(null, { status: 401 });
    }
    return new Response(null, { status: 404 });
  });
}

function mockFetchRegister(session: unknown) {
  const fetchMock = vi.mocked(globalThis.fetch);
  fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/api/v1/auth/register') && init?.method === 'POST') {
      return new Response(
        JSON.stringify({ accessToken: 'test-token', user: session }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      );
    }
    if (url.includes('/api/v1/auth/me')) {
      return new Response(null, { status: 401 });
    }
    return new Response(null, { status: 404 });
  });
}

describe('App routing', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    mockFetchNoSession();
    setHash('#/');
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the login screen for the canonical login alias', async () => {
    setHash('#/ingresar');

    render(<App />);

    await waitFor(() => expect(screen.getByText(/BIENVENIDO AL ORIGEN/i)).toBeInTheDocument());
    await waitFor(() => expect(window.location.hash).toBe('#/login'));
  });

  it('shows the 404 screen for unknown routes', async () => {
    setHash('#/inventado');

    render(<App />);

    await waitFor(() => expect(screen.getByText(/Ruta no encontrada/i)).toBeInTheDocument());
  });

  it('blocks private routes without session', async () => {
    setHash('#/panel');

    render(<App />);

    await waitFor(() => expect(screen.getByText(/Necesitás iniciar sesión para entrar al panel privado/i)).toBeInTheDocument());
  });

  it('lets authenticated users enter the private panel', async () => {
    mockFetchSession(PRODUCER_SESSION);
    setHash('#/panel');

    render(<App />);

    await waitFor(() => expect(screen.getByText(/Cosecha del Mes/i)).toBeInTheDocument());
  });

  it('denies artist sessions from entering the private panel', async () => {
    mockFetchSession(ARTIST_SESSION);
    setHash('#/panel');

    render(<App />);

    await waitFor(() => expect(screen.getByText(/Esa sesión no puede entrar al panel/i)).toBeInTheDocument());
  });

  it('logs in a producer from the private panel and redirects to the dashboard', async () => {
    mockFetchLogin(PRODUCER_SESSION);
    setHash('#/panel');

    render(<App />);

    await waitFor(() => expect(screen.getByLabelText(/Email/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'demo@mingarecords.com' },
    });
    fireEvent.change(screen.getByLabelText(/Contraseña sagrada/i), {
      target: { value: 'minga123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Ingresar/i }));

    await waitFor(() => expect(window.location.hash).toBe('#/panel'));
  });

  it('exposes canonical home navigation links', async () => {
    render(<App />);

    await waitFor(() => expect(screen.getByRole('link', { name: /ser productor/i })).toHaveAttribute('href', '#/ser-productor'));
  });
});

describe('Private route access', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    mockFetchNoSession();
    setHash('#/');
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const privateRoutes = [
    { hash: '#/beats', label: 'beats' },
    { hash: '#/ganancias', label: 'ganancias' },
    { hash: '#/analisis', label: 'analisis' },
    { hash: '#/actualizaciones', label: 'actualizaciones' },
    { hash: '#/configuracion', label: 'configuracion' },
  ];

  privateRoutes.forEach(({ hash, label }) => {
    it(`blocks ${label} without session and shows auth notice`, async () => {
      setHash(hash);

      render(<App />);

      await waitFor(() => expect(screen.getByText(/Necesitás iniciar sesión para acceder a esta sección/i)).toBeInTheDocument());
    });
  });

  it('lets authenticated users access #/beats', async () => {
    mockFetchSession(PRODUCER_SESSION);
    setHash('#/beats');

    render(<App />);

    await waitFor(() => expect(screen.getByText(/5 Beats Publicados/i)).toBeInTheDocument());
  });

  it('lets authenticated users access #/ganancias', async () => {
    mockFetchSession(PRODUCER_SESSION);
    setHash('#/ganancias');

    render(<App />);

    await waitFor(() => expect(screen.getByText(/Historial de Ingresos/i)).toBeInTheDocument());
  });

  it('lets authenticated users access #/analisis', async () => {
    mockFetchSession(PRODUCER_SESSION);
    setHash('#/analisis');

    render(<App />);

    await waitFor(() => expect(screen.getByText(/Métricas y Territorios/i)).toBeInTheDocument());
  });

  it('lets authenticated users access #/actualizaciones', async () => {
    mockFetchSession(PRODUCER_SESSION);
    setHash('#/actualizaciones');

    render(<App />);

    await waitFor(() => expect(screen.getByText(/Novedades y Próximamente/i)).toBeInTheDocument());
  });

  it('lets authenticated users access #/configuracion', async () => {
    mockFetchSession(PRODUCER_SESSION);
    setHash('#/configuracion');

    render(<App />);

    await waitFor(() => expect(screen.getByText(/Preferencias y Ajustes/i)).toBeInTheDocument());
  });
});

describe('Marketplace access', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    mockFetchNoSession();
    setHash('#/');
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('bloquea #/marketplace sin sesión → muestra mensaje auth', async () => {
    setHash('#/marketplace');

    render(<App />);

    await waitFor(() => expect(screen.getByText(/Necesitás iniciar sesión para entrar al marketplace/i)).toBeInTheDocument());
  });

  it('permite acceso a #/marketplace con sesión artist', async () => {
    mockFetchSession(ARTIST_SESSION);
    setHash('#/marketplace');

    render(<App />);

    await waitFor(() => expect(screen.getByText(/Cosecha del Mes/i)).toBeInTheDocument());
  });

  it('deniega acceso a #/marketplace para role producer → MarketplaceDeniedScreen', async () => {
    mockFetchSession(PRODUCER_SESSION);
    setHash('#/marketplace');

    render(<App />);

    await waitFor(() => expect(screen.getByText(/Esa sesión no puede entrar al marketplace/i)).toBeInTheDocument());
  });
});

describe('Post-login redirect by role', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    mockFetchNoSession();
    setHash('#/');
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('login artist redirige a #/marketplace', async () => {
    mockFetchLogin(ARTIST_SESSION);
    setHash('#/login');

    render(<App />);

    await waitFor(() => expect(screen.getByLabelText(/Email/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'artista@mingarecords.com' },
    });
    fireEvent.change(screen.getByLabelText(/Contraseña sagrada/i), {
      target: { value: 'minga123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Ingresar/i }));

    await waitFor(() => expect(window.location.hash).toBe('#/marketplace'));
  });

  it('login producer redirige a #/panel', async () => {
    mockFetchLogin(PRODUCER_SESSION);
    setHash('#/login');

    render(<App />);

    await waitFor(() => expect(screen.getByLabelText(/Email/i)).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'demo@mingarecords.com' },
    });
    fireEvent.change(screen.getByLabelText(/Contraseña sagrada/i), {
      target: { value: 'minga123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Ingresar/i }));

    await waitFor(() => expect(window.location.hash).toBe('#/panel'));
  });
});

describe('Post-register redirect to verify-email', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    mockFetchNoSession();
    setHash('#/');
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const UNVERIFIED_SESSION = {
    id: '3',
    email: 'new@mingarecords.com',
    alias: 'Nuevo Minga',
    role: 'artist',
    emailVerified: false,
    createdAt: new Date().toISOString(),
  };

  it('register artist redirige a #/verify-email', async () => {
    mockFetchRegister(UNVERIFIED_SESSION);
    setHash('#/register');

    render(<App />);

    await waitFor(() => expect(screen.getByLabelText(/Email/i)).toBeInTheDocument());

    // Select artist role (default, but ensure it's selected)
    fireEvent.click(screen.getByLabelText(/Artista/i));

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'new@mingarecords.com' },
    });
    fireEvent.change(screen.getByLabelText(/Contraseña sagrada/i), {
      target: { value: 'Minga123' },
    });
    fireEvent.change(screen.getByLabelText(/Alias/i), {
      target: { value: 'Nuevo Minga' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Registrarme/i }));

    await waitFor(() => expect(window.location.hash).toBe('#/verify-email'));
  });

  it('register producer redirige a #/verify-email', async () => {
    const unverifiedProducer = { ...UNVERIFIED_SESSION, role: 'producer' };
    mockFetchRegister(unverifiedProducer);
    setHash('#/register');

    render(<App />);

    await waitFor(() => expect(screen.getByLabelText(/Email/i)).toBeInTheDocument());

    // Select producer role
    fireEvent.click(screen.getByLabelText(/Productor/i));

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'new@mingarecords.com' },
    });
    fireEvent.change(screen.getByLabelText(/Contraseña sagrada/i), {
      target: { value: 'Minga123' },
    });
    fireEvent.change(screen.getByLabelText(/Alias/i), {
      target: { value: 'Nuevo Minga' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Registrarme/i }));

    await waitFor(() => expect(window.location.hash).toBe('#/verify-email'));
  });
});

describe('Email verified gate', () => {
  const UNVERIFIED_SESSION = {
    id: '3',
    email: 'new@mingarecords.com',
    alias: 'Nuevo Minga',
    role: 'artist',
    emailVerified: false,
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    mockFetchNoSession();
    setHash('#/');
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('blocks private routes when emailVerified is false', async () => {
    mockFetchSession(UNVERIFIED_SESSION);
    setHash('#/panel');

    render(<App />);

    await waitFor(() => expect(screen.getByText(/Revisá tu email/i)).toBeInTheDocument());
  });

  it('blocks marketplace when emailVerified is false', async () => {
    mockFetchSession(UNVERIFIED_SESSION);
    setHash('#/marketplace');

    render(<App />);

    await waitFor(() => expect(screen.getByText(/Revisá tu email/i)).toBeInTheDocument());
  });

  it('allows access to private routes when emailVerified is true', async () => {
    mockFetchSession(PRODUCER_SESSION);
    setHash('#/panel');

    render(<App />);

    await waitFor(() => expect(screen.getByText(/Cosecha del Mes/i)).toBeInTheDocument());
  });

  it('allows access to marketplace when emailVerified is true', async () => {
    mockFetchSession(ARTIST_SESSION);
    setHash('#/marketplace');

    render(<App />);

    await waitFor(() => expect(screen.getByText(/Cosecha del Mes/i)).toBeInTheDocument());
  });
});
