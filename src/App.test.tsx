import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function loginSession() {
  window.localStorage.setItem(
    'mingarecords.auth.session',
    JSON.stringify({
      id: '1',
      identifier: 'demo@mingarecords.com',
      alias: 'Kogui Demo',
      role: 'producer',
      createdAt: new Date().toISOString(),
    }),
  );
}

describe('App routing', () => {
  beforeEach(() => {
    window.localStorage.clear();
    setHash('#/');
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the login screen for the canonical login alias', async () => {
    setHash('#/ingresar');

    render(<App />);

    expect(screen.getByText(/BIENVENIDO AL ORIGEN/i)).toBeInTheDocument();
    await waitFor(() => expect(window.location.hash).toBe('#/login'));
  });

  it('shows the 404 screen for unknown routes', () => {
    setHash('#/inventado');

    render(<App />);

    expect(screen.getByText(/Ruta no encontrada/i)).toBeInTheDocument();
  });

  it('blocks private routes without session', () => {
    setHash('#/panel');

    render(<App />);

    expect(screen.getByText(/Necesitás iniciar sesión para entrar al panel privado/i)).toBeInTheDocument();
  });

  it('lets authenticated users enter the private panel', () => {
    loginSession();
    setHash('#/panel');

    render(<App />);

    expect(screen.getByText(/Cosecha del Mes/i)).toBeInTheDocument();
  });

  it('exposes canonical home navigation links', () => {
    render(<App />);

    expect(screen.getByRole('link', { name: /ser productor/i })).toHaveAttribute('href', '#/ser-productor');
  });
});

describe('Private route access', () => {
  beforeEach(() => {
    window.localStorage.clear();
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
    it(`blocks ${label} without session and preserves deep-link target`, () => {
      setHash(hash);

      render(<App />);

      expect(screen.getByText(/Necesitás iniciar sesión para entrar al panel privado/i)).toBeInTheDocument();
    });
  });

  it('lets authenticated users access #/beats', () => {
    loginSession();
    setHash('#/beats');

    render(<App />);

    expect(screen.getByText(/5 Beats Publicados/i)).toBeInTheDocument();
  });

  it('lets authenticated users access #/ganancias', () => {
    loginSession();
    setHash('#/ganancias');

    render(<App />);

    expect(screen.getByText(/Historial de Ingresos/i)).toBeInTheDocument();
  });

  it('lets authenticated users access #/analisis', () => {
    loginSession();
    setHash('#/analisis');

    render(<App />);

    expect(screen.getByText(/Métricas y Territorios/i)).toBeInTheDocument();
  });

  it('lets authenticated users access #/actualizaciones', () => {
    loginSession();
    setHash('#/actualizaciones');

    render(<App />);

    expect(screen.getByText(/Novedades y Próximamente/i)).toBeInTheDocument();
  });

  it('lets authenticated users access #/configuracion', () => {
    loginSession();
    setHash('#/configuracion');

    render(<App />);

    expect(screen.getByText(/Preferencias y Ajustes/i)).toBeInTheDocument();
  });
});
