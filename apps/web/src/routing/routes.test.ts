import { describe, expect, it } from 'vitest';
import { canonicalHashForRoute, resolveHashRoute } from './routes';

describe('route resolver', () => {
  it('keeps login aliases canonical', () => {
    expect(resolveHashRoute('#/ingresar')).toMatchObject({
      key: 'login',
      kind: 'public',
      canonicalHash: '#/login',
    });
  });

  it('keeps register aliases canonical', () => {
    expect(resolveHashRoute('#/producer')).toMatchObject({
      key: 'register',
      kind: 'public',
      canonicalHash: '#/ser-productor',
    });
  });

  it('resolves home aliases to the home route', () => {
    expect(resolveHashRoute('#/inicio')).toMatchObject({
      key: 'home',
      kind: 'public',
      canonicalHash: '#/',
    });
  });

  it('returns notFound for unknown hashes', () => {
    expect(resolveHashRoute('#/ruta-inventada')).toMatchObject({
      key: 'notFound',
      kind: 'notFound',
    });
  });

  it('exposes canonical route hashes', () => {
    expect(canonicalHashForRoute('panel')).toBe('#/panel');
  });
});
