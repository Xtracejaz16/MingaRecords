# 03 — Estrategia de Repositorio (Monorepo)

> **Versión:** 1.1 — **Fecha:** 12 de mayo de 2026

---

## 3.1 Decisión: Monorepo con Turborepo

### ¿Por qué Monorepo sobre Multirepo?

| Factor | Monorepo (Turborepo) | Multirepo (4-6 repos) | Ganador |
|--------|---------------------|---------------------|---------|
| **DX para 2 devs** | `pnpm dev` levanta todo | 4-6 terminales, 4-6 `pnpm install` | Monorepo |
| **Tipos compartidos** | 1 paquete `@mingarecords/shared` importado directamente | Publicar package npm o copiar tipos entre repos | Monorepo |
| **Refactors cross-service** | 1 PR, 1 branch | 4-6 PRs coordinados manualmente | Monorepo |
| **CI/CD** | 1 pipeline detecta cambios con Turborepo cache | 4-6 pipelines independientes a mantener | Monorepo |
| **Deploy independencia** | Turborepo filtra qué servicios buildear | Cada repo se deploya independiente | Empate |
| **Versionado** | Un solo tag `v1.2.0` para todo el monorepo | Tags por servicio `auth-v1.0.0` | Multirepo (pero no lo necesitamos en MVP) |
| **Complejidad setup inicial** | Configurar Turborepo (~1 día) | 4-6 repos, 4-6 CI setups (~2-3 días) | Monorepo |
| **Onboarding nuevo dev** | `git clone` + `pnpm install` + `pnpm dev` | Clonar 4-6 repos, coordinar versiones | Monorepo |

**Veredicto**: Monorepo. Para 2 developers, la simplicidad operativa de un solo comando para todo supera cualquier ventaja teórica del multirepo. Además, Turborepo con caché remota (Vercel) acelera los builds al reusar caché entre servicios.

### Tradeoff aceptado
Perdemos versionado independiente por servicio (el multirepo permite tags separados como `auth-v1.2.0`), pero **en MVP esto no es necesario**. Si en v2 necesitamos versionado independiente, Turborepo soporta `--filter` para releases por servicio sin necesidad de separar repos.

---

## 3.2 Estructura Completa del Monorepo

```
mingarecords/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                    # Lint + type-check + test (todos los servicios)
│   │   ├── deploy-auth.yml           # Deploy Auth Service
│   │   ├── deploy-catalog.yml        # Deploy Catalog Service
│   │   ├── deploy-streaming.yml      # Deploy Streaming Service
│   │   ├── deploy-payments.yml       # Deploy Payments Service
│   │   ├── deploy-user.yml           # Deploy User Service (v2)
│   │   └── deploy-notification.yml   # Deploy Notification Service (v2)
│   └── dependabot.yml
│
├── apps/
│   ├── web/                          # Frontend React existente
│   │   ├── src/
│   │   │   ├── domain/               # Entidades, puertos (existente)
│   │   │   ├── application/          # Casos de uso (existente)
│   │   │   ├── infrastructure/       # Adaptadores (existente)
│   │   │   └── ui/                   # Componentes React (existente)
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   ├── auth/                         # Auth Microservice (NUEVO — MVP)
│   │   ├── src/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── user.ts
│   │   │   │   │   └── auth-token.ts
│   │   │   │   ├── ports/
│   │   │   │   │   ├── user-repository.ts
│   │   │   │   │   ├── token-service.ts
│   │   │   │   │   └── email-service.ts
│   │   │   │   └── value-objects/
│   │   │   │       ├── email.ts
│   │   │   │       └── password.ts
│   │   │   ├── application/
│   │   │   │   └── use-cases/
│   │   │   │       ├── register.ts
│   │   │   │       ├── login.ts
│   │   │   │       ├── refresh-token.ts
│   │   │   │       ├── verify-email.ts
│   │   │   │       └── update-profile.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── http/
│   │   │   │   │   ├── server.ts       # Fastify instance
│   │   │   │   │   ├── routes/
│   │   │   │   │   │   ├── auth.routes.ts
│   │   │   │   │   │   └── user.routes.ts
│   │   │   │   │   └── middleware/
│   │   │   │   │       ├── error-handler.ts  # RFC 7807
│   │   │   │   │       └── auth-guard.ts
│   │   │   │   ├── database/
│   │   │   │   │   ├── prisma/
│   │   │   │   │   │   └── schema.prisma      # Schema "auth"
│   │   │   │   │   └── user-repository.ts     # Implementación real
│   │   │   │   ├── adapters/
│   │   │   │   │   ├── jwt-token-service.ts    # jsonwebtoken
│   │   │   │   │   └── resend-email-service.ts # Resend SDK
│   │   │   │   └── config/
│   │   │   │       └── env.ts              # Zod-validated env vars
│   │   │   └── index.ts                    # Entry point
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   ├── catalog/                      # Catalog Microservice (NUEVO — MVP)
│   │   ├── src/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── beat.ts
│   │   │   │   │   ├── genre.ts
│   │   │   │   │   └── producer-profile.ts
│   │   │   │   └── ports/
│   │   │   │       ├── beat-repository.ts
│   │   │   │       └── streaming-client.ts
│   │   │   ├── application/
│   │   │   │   └── use-cases/
│   │   │   │       ├── create-beat.ts
│   │   │   │       ├── list-beats.ts
│   │   │   │       ├── search-beats.ts
│   │   │   │       ├── get-beat.ts
│   │   │   │       ├── update-beat.ts
│   │   │   │       └── get-producer-profile.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── http/
│   │   │   │   │   ├── server.ts
│   │   │   │   │   ├── routes/
│   │   │   │   │   └── middleware/
│   │   │   │   ├── database/
│   │   │   │   │   ├── prisma/schema.prisma  # Schema "catalog"
│   │   │   │   │   ├── beat-repository.ts
│   │   │   │   │   └── producer-profile-repository.ts
│   │   │   │   └── adapters/
│   │   │   │       ├── streaming-client.ts   # HTTP client → Streaming
│   │   │   │       └── config/env.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   ├── streaming/                    # Streaming Microservice (NUEVO — MVP)
│   │   ├── src/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   └── audio-file.ts
│   │   │   │   └── ports/
│   │   │   │       ├── audio-storage.ts
│   │   │   │       └── audio-processor.ts
│   │   │   ├── application/
│   │   │   │   └── use-cases/
│   │   │   │       ├── upload-audio.ts
│   │   │   │       ├── generate-preview.ts
│   │   │   │       └── stream-audio.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── http/
│   │   │   │   │   ├── server.ts
│   │   │   │   │   ├── routes/
│   │   │   │   │   └── middleware/
│   │   │   │   ├── adapters/
│   │   │   │   │   ├── r2-storage.ts         # Cloudflare R2 (aws-sdk)
│   │   │   │   │   ├── ffmpeg-processor.ts   # fluent-ffmpeg
│   │   │   │   │   └── catalog-client.ts     # HTTP client → Catalog
│   │   │   │   └── config/env.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   ├── payments/                     # Payments Microservice (NUEVO — MVP)
│   │   ├── src/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── transaction.ts
│   │   │   │   │   └── license.ts
│   │   │   │   └── ports/
│   │   │   │       ├── payment-gateway.ts
│   │   │   │       ├── transaction-repository.ts
│   │   │   │       └── license-repository.ts
│   │   │   ├── application/
│   │   │   │   └── use-cases/
│   │   │   │       ├── create-checkout.ts
│   │   │   │       ├── handle-webhook.ts
│   │   │   │       ├── get-transactions.ts
│   │   │   │       └── process-refund.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── http/
│   │   │   │   │   ├── server.ts
│   │   │   │   │   ├── routes/
│   │   │   │   │   └── middleware/
│   │   │   │   ├── database/
│   │   │   │   │   ├── prisma/schema.prisma  # Schema "payments"
│   │   │   │   │   └── transaction-repository.ts
│   │   │   │   └── adapters/
│   │   │   │       ├── stripe-gateway.ts
│   │   │   │       ├── catalog-client.ts     # HTTP client → Catalog
│   │   │   │       └── config/env.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   ├── user/                         # User Microservice (v2)
│   │   ├── src/
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── user-profile.ts
│   │   │   │   │   └── follow.ts
│   │   │   │   └── ports/
│   │   │   │       ├── user-profile-repository.ts
│   │   │   │       └── follow-repository.ts
│   │   │   ├── application/
│   │   │   │   └── use-cases/
│   │   │   │       ├── get-profile.ts
│   │   │   │       ├── update-profile.ts
│   │   │   │       ├── follow-user.ts
│   │   │   │       └── get-followers.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── http/
│   │   │   │   │   ├── server.ts
│   │   │   │   │   └── routes/
│   │   │   │   ├── database/
│   │   │   │   │   ├── prisma/schema.prisma  # Schema "users"
│   │   │   │   │   └── user-profile-repository.ts
│   │   │   │   └── config/env.ts
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── Dockerfile
│   │
│   └── notification/                 # Notification Microservice (v2)
│       ├── src/
│       │   ├── domain/
│       │   │   ├── entities/
│       │   │   │   ├── notification.ts
│       │   │   │   └── template.ts
│       │   │   └── ports/
│       │   │       ├── notification-channel.ts
│       │   │       ├── template-repository.ts
│       │   │       └── user-preference-service.ts
│       │   ├── application/
│       │   │   └── use-cases/
│       │   │       ├── send-notification.ts
│       │   │       ├── create-template.ts
│       │   │       └── manage-preferences.ts
│       │   ├── infrastructure/
│       │   │   ├── http/
│       │   │   │   ├── server.ts
│       │   │   │   └── routes/
│       │   │   ├── adapters/
│       │   │   │   ├── email-channel.ts      # Resend
│       │   │   │   ├── push-channel.ts       # Web Push API
│       │   │   │   └── in-app-channel.ts     # SSE/WebSocket
│       │   │   └── config/env.ts
│       │   └── index.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── Dockerfile
│
├── packages/
│   ├── shared/                       # Código compartido entre servicios
│   │   ├── src/
│   │   │   ├── types/
│   │   │   │   ├── api.ts            # Tipos de request/response comunes
│   │   │   │   ├── errors.ts         # RFC 7807 error types
│   │   │   │   └── pagination.ts     # PaginationParams, PaginatedResponse<T>
│   │   │   ├── middleware/
│   │   │   │   ├── jwt-guard.ts      # Middleware Fastify compartido
│   │   │   │   ├── error-handler.ts  # RFC 7807 error handler compartido
│   │   │   │   └── request-logger.ts # Pino logger middleware
│   │   │   ├── utils/
│   │   │   │   ├── slug.ts           # Generación de slugs amigables
│   │   │   │   └── env.ts            # Zod env schema helpers
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── audio-utils/                  # Utilidades de audio compartidas (solo Streaming y Catalog)
│   │   ├── src/
│   │   │   ├── validation.ts         # Validar MIME types, tamaño, magic bytes
│   │   │   ├── metadata.ts           # Extraer BPM, key, duration (ffprobe)
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── eslint-config/                # ESLint config compartida
│       ├── base.js
│       ├── react.js
│       └── package.json
│
├── tooling/
│   ├── docker-compose.yml           # Desarrollo local: PostgreSQL + Redis
│   ├── .env.example                 # Template de variables de entorno
│   └── scripts/
│       ├── setup-dev.ps1            # Script de primer setup (PowerShell — Windows)
│       └── migrate-all.sh           # Corre migraciones de todos los servicios
│
├── docs/
│   ├── decisions/                    # ADRs (existente)
│   │   ├── ADR-001.md
│   │   ├── ADR-002.md
│   │   └── ADR-003-estrategia-comunicacion.md
│   ├── sdd/
│   │   └── mingarecords-backend/     # Este documento
│   └── openapi/                      # Contratos OpenAPI por servicio
│       ├── auth.openapi.yaml
│       ├── catalog.openapi.yaml
│       ├── streaming.openapi.yaml
│       ├── payments.openapi.yaml
│       ├── user.openapi.yaml         # (v2)
│       └── notification.openapi.yaml # (v2)
│
├── turbo.json                        # Configuración de Turborepo
├── pnpm-workspace.yaml               # Workspaces de pnpm
├── pnpm-lock.yaml
├── package.json                      # Root package.json
├── tsconfig.base.json                # TypeScript config base
└── AGENTS.md                         # Rules para AI agents (existente)
```

---

## 3.3 Configuración de Turborepo

### `turbo.json` (raíz)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "globalEnv": ["NODE_ENV", "CI"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "type-check": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"],
      "inputs": ["src/**/*.ts", "test/**/*.ts", "**/*.test.ts"]
    },
    "db:migrate": {
      "cache": false
    },
    "db:generate": {
      "cache": false,
      "dependsOn": ["^build"]
    },
    "docker:build": {
      "dependsOn": ["build"],
      "cache": false
    }
  }
}
```

### `pnpm-workspace.yaml`

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Root `package.json` (scripts clave)

```json
{
  "name": "mingarecords",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "db:migrate": "turbo run db:migrate",
    "db:generate": "turbo run db:generate",
    "docker:up": "docker compose -f tooling/docker-compose.yml up -d",
    "docker:down": "docker compose -f tooling/docker-compose.yml down",
    "clean": "turbo run clean && Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue"
  }
}
```

---

## 3.4 Paquetes Compartidos (`@mingarecords/shared`)

### Justificación

El código que se repite en 3+ servicios **debe** estar en `@mingarecords/shared`. Código usado en solo 2 servicios **puede** estar compartido si la duplicación causa más dolor que la abstracción.

### Qué SÍ va en shared

| Código | Razón |
|--------|-------|
| Tipos de respuesta HTTP (RFC 7807) | Todos los servicios devuelven errores con el mismo formato |
| Tipos de paginación | Catalog y Payments usan paginación |
| Middleware JWT | Auth, Catalog, Streaming, Payments validan JWT |
| Logger (Pino) config | Todos los servicios usan el mismo formato de log estructurado |
| Env schema helper | Todos los servicios validan env vars con Zod al iniciar |
| Tipos de API comunes | `User`, `Beat`, `Transaction` types se usan cross-service |
| Circuit breaker simple | Implementación compartida del circuit breaker (50 líneas) |

### Qué NO va en shared

| Código | Razón | Alternativa |
|--------|-------|-------------|
| Lógica de negocio | Cada servicio tiene su propio domain | Duplicar si es necesario (preferible a acoplar dominios) |
| Configuración de DB | Cada servicio puede tener DB diferente en el futuro | Por schema de Prisma, no por código compartido |
| Validaciones específicas de dominio | El email en Auth no es igual al título en Catalog | Validar en cada domain con value objects |
| Implementaciones de adaptadores | Cada servicio tiene sus propias dependencias externas | Los puertos son compartidos, las implementaciones NO |

### `@mingarecords/audio-utils`

Paquete específico para Streaming y Catalog (solo 2 servicios, pero la lógica es compleja y propensa a errores):

| Código | Razón |
|--------|-------|
| Validación de MIME types reales (magic bytes) | Los archivos de audio pueden tener extensiones falsas. Validar por magic bytes (`file-type` package) es propenso a errores si se duplica |
| Extracción de metadata (ffprobe) | BPM, key, duration, sample rate. ffprobe tiene una API compleja; exponer una interfaz simple compartida evita bugs |
| Constantes: formatos permitidos, tamaño máximo | Centralizar `ALLOWED_AUDIO_FORMATS = ['audio/wav', 'audio/mpeg']` y `MAX_FILE_SIZE = 100 * 1024 * 1024` evita inconsistencias |

---

## 3.5 Estrategia de Versionado y Releases

### Versionado

- **Versión semántica global**: `v1.0.0` para el monorepo completo.
- Un solo `CHANGELOG.md` en raíz, secciones por servicio.
- Tags de git: `v1.0.0`, `v1.0.1`, etc.
- Releases de GitHub creadas manualmente por el equipo.

### Estrategia de Release por Servicio

Aunque es monorepo, cada servicio se deploya independientemente:

```
Cambio en Catalog → CI detecta cambio en apps/catalog/** →
→ Build + Test solo Catalog → Deploy Catalog →
→ Auth, Streaming, Payments no se redeployan
```

Turborepo filtra automáticamente con `turbo run build --filter=[HEAD^1]...[HEAD]`. Si solo cambió Catalog, solo Catalog se buildeará y deployará.

### Hotfix y Rollback

- **Hotfix**: Branch desde `main` → fix → PR → merge → deploy automático del servicio afectado.
- **Rollback**: Revert PR o `git revert` + deploy automático. Railway soporta rollback instantáneo (último deploy exitoso).

---

## 3.6 CI/CD Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                     GITHUB ACTIONS CI/CD                         │
│                                                                  │
│  ci.yml (CADA PUSH a PR o main):                                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ 1. Checkout + Setup pnpm + Node 22                         │  │
│  │ 2. pnpm install --frozen-lockfile                          │  │
│  │ 3. turbo run lint                                           │  │
│  │ 4. turbo run type-check                                     │  │
│  │ 5. turbo run test                                           │  │
│  │ 6. turbo run build (con caché remota Vercel)               │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  deploy-{service}.yml (SOLO en push a main, con path filter):    │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ if: github.ref == 'refs/heads/main'                        │  │
│  │ paths: apps/{service}/**                                   │  │
│  │                                                            │  │
│  │ 1. Build Docker image                                      │  │
│  │ 2. Push a Railway container registry                       │  │
│  │ 3. Railway auto-deploy trigger                             │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Optimización de CI para Monorepo

- **Caché de Turborepo**: Usamos `actions/cache` con la caché `.turbo` para builds incrementales.
- **Caché de pnpm**: `pnpm store` cacheado entre runs.
- **Path filters**: Los workflows de deploy solo se disparan si cambiaron archivos del servicio correspondiente.
- **Parallel jobs**: `lint`, `type-check`, y `test` corren en jobs paralelos.

### Ejemplo de GitHub Actions deploy filter

```yaml
# .github/workflows/deploy-catalog.yml
name: Deploy Catalog Service

on:
  push:
    branches: [main]
    paths:
      - 'apps/catalog/**'
      - 'packages/shared/**'
      - 'packages/audio-utils/**'
```

---

## 3.7 Desarrollo Local con Docker Compose

### `tooling/docker-compose.yml`

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: minga
      POSTGRES_PASSWORD: minga_dev
      POSTGRES_DB: mingarecords
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

### Flujo de desarrollo

```bash
# Primer setup (una vez)
pnpm install
pnpm docker:up                    # Levanta PostgreSQL + Redis
pnpm db:migrate                   # Corre migraciones de Prisma en todos los servicios
pnpm dev                          # Levanta TODOS los servicios en paralelo

# Desarrollo diario
pnpm docker:up                    # Si no estaban corriendo
pnpm dev --filter=@mingarecords/catalog  # Solo Catalog
pnpm test --filter=@mingarecords/auth    # Solo tests de Auth
pnpm type-check                   # Chequeo de tipos en todos los servicios
```

---

## 3.8 Pacto de No-Acople

Para mantener la independencia que justificó microservicios:

1. **Ningún servicio importa código fuente de otro servicio.** Solo usa paquetes `@mingarecords/shared` o `@mingarecords/audio-utils`.
2. **La comunicación es solo por HTTP.** No hay imports directos ni bases de datos compartidas a nivel código (solo a nivel infraestructura con schemas separados).
3. **Si un servicio necesita datos de otro**, hace una llamada HTTP con timeout de 5s y circuit breaker. Si el otro servicio no responde, aplica graceful degradation (ej: Catalog muestra beats aunque no pueda consultar stats de Streaming; el estado del beat se muestra como `processing`).
4. **Los tipos compartidos en `@mingarecords/shared`** son interfaces tontas (solo datos, sin lógica). Si un tipo necesita lógica, pertenece al domain de un servicio específico.
5. **Cada servicio tiene su propio `package.json`** con sus propias dependencias. No hay dependencias compartidas a nivel de monorepo excepto las de root para tooling.

---

## 3.9 Elección de Framework Backend: Fastify sobre NestJS

### Comparación

| Factor | Fastify | NestJS | Ganador (para 2 devs) |
|--------|---------|--------|------------------------|
| **Curva de aprendizaje** | Baja. API simple, plugin system intuitivo | Alta. Decorators, módulos, providers, guards, interceptors, pipes... | Fastify |
| **Performance** | 60k req/s (líder en benchmarks Node) | 20k req/s (usa Express por defecto) | Fastify |
| **TypeScript** | Excelente. Tipado inferido de schemas | Excelente. Nativo TS, pero verboso | Empate |
| **Validación** | JSON Schema nativo (más rápido que Zod en runtime) | Class Validator + DTOs con decoradores | Fastify (para APIs simples) |
| **Hexagonal fit** | Perfecto: registrás plugins/routes sin imponer estructura | Impone estructura de módulos que compite con hexagonal | Fastify |
| **Documentación** | Buena, ejemplos concisos | Excelente, pero muy densa | Empate |
| **Tamaño del boilerplate** | ~15 líneas para un servidor funcional | ~50 líneas (módulo, controlador, servicio, main.ts) | Fastify |
| **Ecosistema de plugins** | Rico: CORS, rate-limit, JWT, multipart, static, swagger | Integrado: OpenAPI, guards, interceptors | Empate |
| **Mantenimiento** | Independiente, sponsored por OpenJS Foundation | Mantenido por un solo dev (Kamil Mysliwiec) | Fastify (menor riesgo de bus factor) |
| **Adopción** | Walmart, BBC, hotstar | Ampliamente usado en enterprise | — |

### Veredicto

**Fastify** gana contundentemente para este proyecto:

1. **2 developers**: La curva de aprendizaje de NestJS (decorators, DI container, módulos) es innecesaria cuando ya estamos aprendiendo arquitectura hexagonal. Fastify se aprende en 2 horas.
2. **Hexagonal architecture**: Fastify no impone estructura — se integra naturalmente como adaptador HTTP en la capa `infrastructure/http/`. NestJS impone su propia arquitectura de módulos que compite conceptualmente con hexagonal.
3. **Performance**: Para un servicio de streaming de audio, la baja latencia de Fastify es crítica.
4. **Menos boilerplate**: Cada servicio tiene ~14 archivos de dominio/aplicación. Agregar el overhead de NestJS (módulos, decoradores, providers) duplicaría el código sin beneficio.
5. **JSON Schema sobre Zod en runtime**: Fastify valida requests con JSON Schema (compilado a `ajv`), que es más rápido que Zod en runtime. Zod se usa solo para validar env vars al iniciar (no en el hot path).

**Cuándo reconsiderar NestJS**: Si el equipo crece a 5+ developers y necesitamos estandarización fuerte entre servicios, NestJS ofrece mejor DX para equipos grandes. Pero para 2 devs, es overkill.
