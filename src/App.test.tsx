import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

    expect(screen.getByText(/Conectate sin esperar backend/i)).toBeInTheDocument();
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

  it('lets authenticated users enter the private panel', async () => {
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

    expect(screen.getByText(/Panel de productor listo para crecer/i)).toBeInTheDocument();
  });

  it('navigates through canonical home actions', () => {
    render(<App />);

    fireEvent.click(screen.getAllByRole('button', { name: /ser productor/i })[0]);

    expect(window.location.hash).toBe('#/ser-productor');
  });
});
