# Tracker: Auth API Integration

## Estado

En progreso — ver child PRs abajo.

## Descripción

Migración del sistema de autenticación de localStorage-only a backend REST API con arquitectura hexagonal.

## Child PRs

- [ ] #38 — Domain + Infra + Application
- [ ] #39 — UI + Tests

## Decisiones

- Access token en memoria (no localStorage)
- Refresh token vía httpOnly cookie
- Native fetch (sin axios)
- Use cases async
