import type { AuthTab } from '../domain/auth/entities/auth';

export type AppRouteKey = 'home' | 'login' | 'register' | 'verify-email' | 'panel' | 'beats' | 'ganancias' | 'analisis' | 'actualizaciones' | 'configuracion' | 'marketplace' | 'intercambio';
export type ResolvedRouteKind = 'public' | 'private' | 'notFound';

interface RouteDefinition {
  key: AppRouteKey;
  kind: Exclude<ResolvedRouteKind, 'notFound'>;
  canonicalHash: string;
  aliases: string[];
  authTab?: AuthTab;
}

export interface ResolvedRoute {
  key: AppRouteKey | 'notFound';
  kind: ResolvedRouteKind;
  canonicalHash?: string;
  authTab?: AuthTab;
}

const ROUTES: Record<AppRouteKey, RouteDefinition> = {
  home: {
    key: 'home',
    kind: 'public',
    canonicalHash: '#/',
    aliases: ['', 'home', 'inicio'],
  },
  login: {
    key: 'login',
    kind: 'public',
    canonicalHash: '#/login',
    aliases: ['ingresar'],
    authTab: 'login',
  },
  register: {
    key: 'register',
    kind: 'public',
    canonicalHash: '#/ser-productor',
    aliases: ['register', 'producer', 'ser-productor'],
    authTab: 'register',
  },
  'verify-email': {
    key: 'verify-email',
    kind: 'public',
    canonicalHash: '#/verify-email',
    aliases: ['verificar-email'],
  },
  panel: {
    key: 'panel',
    kind: 'private',
    canonicalHash: '#/panel',
    aliases: ['dashboard'],
  },
  beats: {
    key: 'beats',
    kind: 'private',
    canonicalHash: '#/beats',
    aliases: ['lista-beats'],
  },
  ganancias: {
    key: 'ganancias',
    kind: 'private',
    canonicalHash: '#/ganancias',
    aliases: ['earnings'],
  },
  analisis: {
    key: 'analisis',
    kind: 'private',
    canonicalHash: '#/analisis',
    aliases: ['analytics'],
  },
  actualizaciones: {
    key: 'actualizaciones',
    kind: 'private',
    canonicalHash: '#/actualizaciones',
    aliases: ['updates'],
  },
  configuracion: {
    key: 'configuracion',
    kind: 'private',
    canonicalHash: '#/configuracion',
    aliases: ['settings', 'config'],
  },
  marketplace: {
    key: 'marketplace',
    kind: 'public',
    canonicalHash: '#/marketplace',
    aliases: ['marketplace', 'tienda'],
  },
  intercambio: {
    key: 'intercambio',
    kind: 'private',
    canonicalHash: '#/intercambio',
    aliases: ['intercambio', 'exchange'],
  },
};

function normalizeHash(hash: string) {
  return hash.replace(/^#/, '').replace(/^\//, '').replace(/\/+$/, '').trim().toLowerCase();
}

export function canonicalHashForRoute(key: AppRouteKey) {
  return ROUTES[key].canonicalHash;
}

export function isPrivateRoute(key: AppRouteKey) {
  return ROUTES[key].kind === 'private';
}

export function resolveHashRoute(hash: string): ResolvedRoute {
  const normalized = normalizeHash(hash).split('?')[0];

  if (normalized === '') {
    return {
      key: 'home',
      kind: 'public',
      canonicalHash: ROUTES.home.canonicalHash,
    };
  }

  const route = Object.values(ROUTES).find((definition) => {
    const canonicalPath = definition.canonicalHash.replace(/^#/, '').replace(/^\//, '');
    return canonicalPath === normalized || definition.aliases.includes(normalized);
  });

  if (!route) {
    return {
      key: 'notFound',
      kind: 'notFound',
    };
  }

  return {
    key: route.key,
    kind: route.kind,
    canonicalHash: route.canonicalHash,
    authTab: route.authTab,
  };
}
