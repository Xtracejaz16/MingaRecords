import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

function setHash(hash: string) {
  window.location.hash = hash;
  window.dispatchEvent(new HashChangeEvent('hashchange'));
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
    setHash('#/panel');

    render(<App />);

    expect(screen.getByText(/TU TERRITORIO DE/i)).toBeInTheDocument();
  });

  it('exposes canonical home navigation links', () => {
    render(<App />);

    expect(screen.getByRole('link', { name: /ser productor/i })).toHaveAttribute('href', '#/ser-productor');
  });
});

describe('Private route access', () => {
  const privateRoutes = ['beats', 'ganancias', 'analisis', 'actualizaciones', 'configuracion'];

  beforeEach(() => {
    window.localStorage.clear();
    setHash('#/');
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Tests for unauthenticated users - should see auth notice
  it('shows auth notice when accessing /beats without session', () => {
    setHash('#/beats');
    render(<App />);
    expect(screen.getByText(/Necesitás iniciar sesión para entrar al panel privado/i)).toBeInTheDocument();
  });

  it('shows auth notice when accessing /ganancias without session', () => {
    setHash('#/ganancias');
    render(<App />);
    expect(screen.getByText(/Necesitás iniciar sesión para entrar al panel privado/i)).toBeInTheDocument();
  });

  it('shows auth notice when accessing /analisis without session', () => {
    setHash('#/analisis');
    render(<App />);
    expect(screen.getByText(/Necesitás iniciar sesión para entrar al panel privado/i)).toBeInTheDocument();
  });

  it('shows auth notice when accessing /actualizaciones without session', () => {
    setHash('#/actualizaciones');
    render(<App />);
    expect(screen.getByText(/Necesitás iniciar sesión para entrar al panel privado/i)).toBeInTheDocument();
  });

  it('shows auth notice when accessing /configuracion without session', () => {
    setHash('#/configuracion');
    render(<App />);
    expect(screen.getByText(/Necesitás iniciar sesión para entrar al panel privado/i)).toBeInTheDocument();
  });

  // Tests for authenticated users - should access without redirect
  it('lets authenticated users access /beats', () => {
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
    setHash('#/beats');

    render(<App />);

    expect(screen.queryByText(/Necesitás iniciar sesión/i)).not.toBeInTheDocument();
  });

  it('lets authenticated users access /ganancias', () => {
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
    setHash('#/ganancias');

    render(<App />);

    expect(screen.queryByText(/Necesitás iniciar sesión/i)).not.toBeInTheDocument();
  });

  it('lets authenticated users access /analisis', () => {
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
    setHash('#/analisis');

    render(<App />);

    expect(screen.queryByText(/Necesitás iniciar sesión/i)).not.toBeInTheDocument();
  });

  it('lets authenticated users access /actualizaciones', () => {
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
    setHash('#/actualizaciones');

    render(<App />);

    expect(screen.queryByText(/Necesitás iniciar sesión/i)).not.toBeInTheDocument();
  });

  it('lets authenticated users access /configuracion', () => {
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
    setHash('#/configuracion');

    render(<App />);

    expect(screen.queryByText(/Necesitás iniciar sesión/i)).not.toBeInTheDocument();
  });
});
