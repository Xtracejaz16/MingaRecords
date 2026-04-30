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
        createdAt: '2026-04-30T00:00:00.000Z',
      }),
    );
    setHash('#/panel');

    render(<App />);

    expect(screen.getByText(/Producer Portal/i)).toBeInTheDocument();
  });

  it('denies artist sessions from entering the private panel', () => {
    window.localStorage.setItem(
      'mingarecords.auth.session',
      JSON.stringify({
        id: '2',
        identifier: 'artista@mingarecords.com',
        alias: 'Minga Artista',
        role: 'artist',
        createdAt: '2026-04-30T00:00:00.000Z',
      }),
    );
    setHash('#/panel');

    render(<App />);

    expect(screen.getByText(/Esa sesión no puede entrar al panel/i)).toBeInTheDocument();
  });

  it('cleans malformed stored session payloads on load', () => {
    window.localStorage.setItem('mingarecords.auth.session', '{broken-json');
    setHash('#/panel');

    render(<App />);

    expect(screen.getByText(/Necesitás iniciar sesión para entrar al panel privado/i)).toBeInTheDocument();
    expect(window.localStorage.getItem('mingarecords.auth.session')).toBeNull();
  });

  it('exposes canonical home navigation links', () => {
    render(<App />);

    expect(screen.getByRole('link', { name: /ser productor/i })).toHaveAttribute('href', '#/ser-productor');
  });
});
