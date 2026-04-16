import type { AuthTab } from '../domain/auth';

export type AppRouteKey = 'home' | 'login' | 'register' | 'panel';
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
  panel: {
    key: 'panel',
    kind: 'private',
    canonicalHash: '#/panel',
    aliases: ['dashboard'],
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
  const normalized = normalizeHash(hash);

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
