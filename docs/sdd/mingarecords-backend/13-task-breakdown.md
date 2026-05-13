# 13 — Desglose de Tareas (EPIC → FEATURE → TASK → SUBTASK)

> **Versión:** 1.0 — **Fecha:** 12 de mayo de 2026
> **Formato:** EPIC → FEATURE → TASK → SUBTASK
> **Estimaciones:** Días-hombre (d/h). Un dev full day = 6h productivas. Semana = 5 días.

---

## Convenciones de Estimación

| Símbolo | Significado | Rango |
|---------|-------------|-------|
| XS | Extra small | 0.5 – 1 d/h |
| S | Small | 1 – 2 d/h |
| M | Medium | 2 – 4 d/h |
| L | Large | 4 – 8 d/h |
| XL | Extra large | 8 – 16 d/h (partir en tareas más chicas) |

**Prioridades**:
- **P0**: Bloquea el MVP. Hacer AHORA.
- **P1**: Necesario para MVP. Hacer esta semana.
- **P2**: Mejora significativa. Hacer este mes.
- **P3**: Nice to have. Backlog.

---

## EPIC 1: Platform Foundation (Fase 0 — Semanas 1-2)

**Objetivo**: Scaffolding completo. Cero features de negocio. Todo tooling.

### FEATURE 1.1: Repository Setup

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 1.1.1 | Initialize Turborepo monorepo | P0 | S | — | Sebas |
| 1.1.2 | Configure pnpm workspaces (`pnpm-workspace.yaml`) | P0 | XS | 1.1.1 | Sebas |
| 1.1.3 | Set up TypeScript base config (`tsconfig.base.json`) | P0 | XS | 1.1.1 | Sebas |
| 1.1.4 | Create `turbo.json` with pipeline definitions | P0 | S | 1.1.1 | Sebas |
| 1.1.5 | Create root `package.json` with scripts (`dev`, `build`, `test`, `lint`) | P0 | XS | 1.1.1 | Sebas |
| 1.1.6 | Set up ESLint + Prettier shared config (`packages/eslint-config`) | P0 | M | 1.1.1 | Sebas |
| 1.1.7 | Configure `.gitignore`, `.dockerignore`, `.prettierignore` | P0 | XS | 1.1.1 | Yair |
| 1.1.8 | Create `tooling/docker-compose.yml` (PostgreSQL 16 + Redis 7) | P0 | S | — | Yair |
| 1.1.9 | Create `.env.example` template for all services | P0 | S | — | Yair |
| 1.1.10 | Set up `@mingarecords/shared` package scaffold | P0 | S | 1.1.1 | Sebas |

**Subtask detail for 1.1.2 (pnpm workspaces)**:
```
├── 1.1.2.1: Create pnpm-workspace.yaml with packages: ["apps/*", "packages/*"]
├── 1.1.2.2: Verify pnpm install resolves all workspaces correctly
├── 1.1.2.3: Test cross-package imports: apps/catalog → @mingarecords/shared
```

**Subtask detail for 1.1.10 (shared package)**:
```
├── 1.1.10.1: Create types/api.ts (APIResponse<T>, PaginatedResponse<T>, ErrorResponse)
├── 1.1.10.2: Create types/errors.ts (RFC 7807 ProblemDetail)
├── 1.1.10.3: Create types/pagination.ts (PaginationParams, PaginationMeta)
├── 1.1.10.4: Create middleware/jwt-guard.ts (Fastify onRequest hook, JWT validation)
├── 1.1.10.5: Create middleware/error-handler.ts (Fastify setErrorHandler, RFC 7807)
├── 1.1.10.6: Create middleware/request-logger.ts (Pino logger, structured JSON)
├── 1.1.10.7: Create utils/slug.ts (generateSlug function)
├── 1.1.10.8: Create utils/env.ts (Zod env schema factory)
├── 1.1.10.9: Export all from index.ts barrel
```

### FEATURE 1.2: Microservice Scaffolds

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 1.2.1 | Scaffold Auth Service (`apps/auth`) with Fastify | P0 | M | 1.1.10 | Yair |
| 1.2.2 | Scaffold Catalog Service (`apps/catalog`) with Fastify | P0 | M | 1.1.10 | Sebas |
| 1.2.3 | Scaffold Streaming Service (`apps/streaming`) with Fastify | P0 | M | 1.1.10 | Yair |
| 1.2.4 | Scaffold Payments Service (`apps/payments`) with Fastify | P0 | M | 1.1.10 | Sebas |
| 1.2.5 | `/health` endpoint in all 4 services | P0 | XS | 1.2.1–1.2.4 | Yair |

**Subtask detail for 1.2.1 (Auth Service scaffold)**:
```
├── 1.2.1.1: Create apps/auth/package.json with deps (fastify, jsonwebtoken, bcrypt, zod)
├── 1.2.1.2: Create apps/auth/tsconfig.json extending tsconfig.base.json
├── 1.2.1.3: Create domain/entities/user.ts (interface)
├── 1.2.1.4: Create domain/ports/user-repository.ts (interface)
├── 1.2.1.5: Create infrastructure/http/server.ts (Fastify instance, CORS, plugins)
├── 1.2.1.6: Create infrastructure/config/env.ts (Zod-validated env vars)
├── 1.2.1.7: Create index.ts entry point (start server)
├── 1.2.1.8: Verify service starts with pnpm dev --filter=@mingarecords/auth
```
> Servicios 1.2.2–1.2.4 siguen estructura IDÉNTICA, cambiando nombres de entidades y puertos.

### FEATURE 1.3: Database & Prisma Setup

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 1.3.1 | Install Prisma in Auth, Catalog, Payments services | P0 | S | 1.2.1–1.2.4 | Sebas |
| 1.3.2 | Create `schema.auth.prisma` (users, refresh_tokens) | P0 | S | 1.3.1 | Sebas |
| 1.3.3 | Create `schema.catalog.prisma` (beats, genres, producer_profiles) | P0 | S | 1.3.1 | Sebas |
| 1.3.4 | Create `schema.payments.prisma` (transactions, licenses) | P0 | S | 1.3.1 | Sebas |
| 1.3.5 | Configure Prisma multi-schema at connection level | P0 | M | 1.3.2–1.3.4 | Sebas |
| 1.3.6 | Create `db:migrate` script per service + root script | P0 | XS | 1.3.5 | Sebas |
| 1.3.7 | Test migrations run correctly (local Docker PostgreSQL) | P0 | S | 1.3.6 | Sebas |

**Subtask detail for 1.3.2 (schema.auth.prisma)**:
```
├── 1.3.2.1: Define User model (id uuid, email unique, password_hash, role enum, verified bool, created_at, updated_at)
├── 1.3.2.2: Define RefreshToken model (id uuid, user_id FK, token_hash, expires_at, created_at)
├── 1.3.2.3: Generate Prisma client for auth schema
├── 1.3.2.4: Run prisma migrate dev --schema=apps/auth/prisma/schema.prisma → verify table creation
```

### FEATURE 1.4: CI/CD Setup

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 1.4.1 | Create `.github/workflows/ci.yml` (lint + type-check + test + build) | P0 | L | 1.1, 1.2, 1.3 | Yair |
| 1.4.2 | Create `deploy-auth.yml` workflow (paths filter + Railway deploy) | P0 | M | 1.2.1 | Yair |
| 1.4.3 | Create `deploy-catalog.yml` workflow | P0 | S | 1.2.2 | Yair |
| 1.4.4 | Create `deploy-streaming.yml` workflow | P0 | S | 1.2.3 | Yair |
| 1.4.5 | Create `deploy-payments.yml` workflow | P0 | S | 1.2.4 | Yair |
| 1.4.6 | Create `preview-deploy.yml` (PR preview environments) | P0 | M | 1.4.2–1.4.5 | Yair |
| 1.4.7 | Create `rollback.yml` workflow | P1 | S | 1.4.2 | Yair |
| 1.4.8 | Configure branch protection rules on `main` | P0 | XS | — | Yair |
| 1.4.9 | Verify CI pipeline succeeds on PR | P0 | S | 1.4.1 | Yair + Sebas |
| 1.4.10 | Verify deploy pipeline deploys to staging on merge to main | P0 | M | 1.4.2–1.4.5 | Yair |

### FEATURE 1.5: Docker

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 1.5.1 | Create Dockerfile (multi-stage) for Auth Service | P0 | M | 1.2.1, 1.3.2 | Yair |
| 1.5.2 | Create Dockerfile for Catalog Service | P0 | S | 1.2.2, 1.3.3 | Yair |
| 1.5.3 | Create Dockerfile for Streaming Service (include ffmpeg) | P0 | M | 1.2.3 | Yair |
| 1.5.4 | Create Dockerfile for Payments Service | P0 | S | 1.2.4, 1.3.4 | Yair |
| 1.5.5 | Test `docker build` for each service locally | P0 | M | 1.5.1–1.5.4 | Yair |

### FEATURE 1.6: Infrastructure Provisioning

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 1.6.1 | Create Railway project + 4 services (auth, catalog, streaming, payments) | P0 | M | — | Yair + Sebas |
| 1.6.2 | Create Supabase project + get DATABASE_URL | P0 | S | — | Sebas |
| 1.6.3 | Create Cloudflare R2 bucket (`mingarecords-audio`) + API tokens | P0 | S | — | Sebas |
| 1.6.4 | Create Upstash Redis database + get URL | P0 | XS | — | Yair |
| 1.6.5 | Create Resend account + verify domain | P0 | S | — | Yair |
| 1.6.6 | Create Stripe account (test mode) + get API keys | P0 | S | — | Yair + Sebas |
| 1.6.7 | Create BunnyCDN pull zone pointing to R2 bucket | P0 | S | 1.6.3 | Sebas |
| 1.6.8 | Configure GitHub Secrets for all credentials | P0 | S | 1.6.1–1.6.7 | Yair |
| 1.6.9 | Configure Railway env vars from GitHub Secrets | P0 | M | 1.6.8 | Yair |
| 1.6.10 | Test end-to-end: deploy to staging → service responds | P0 | M | 1.6.9, 1.4 | Yair + Sebas |

---

## EPIC 2: Auth Service (Fase 1 — Semanas 3-4)

**Objetivo**: Usuarios pueden registrarse, loguearse y mantener sesión con JWT.

### FEATURE 2.1: User Registration

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 2.1.1 | Implement `UserRepository` (Prisma adapter) | P0 | M | 1.3.2 | Sebas |
| 2.1.2 | Implement `Email` value object (validation: formato, dominio) | P0 | S | — | Sebas |
| 2.1.3 | Implement `Password` value object (min 8 chars, hash con bcrypt) | P0 | S | — | Sebas |
| 2.1.4 | Implement `RegisterUseCase` (domain + application) | P0 | M | 2.1.1, 2.1.2, 2.1.3 | Sebas |
| 2.1.5 | Create `POST /api/v1/auth/register` route | P0 | S | 2.1.4 | Sebas |
| 2.1.6 | Add Zod validation schema for register request body | P0 | S | — | Sebas |
| 2.1.7 | Handle duplicate email error (409 Conflict RFC 7807) | P0 | XS | 2.1.5 | Sebas |
| 2.1.8 | Unit tests for RegisterUseCase (success, duplicate, invalid email, weak password) | P0 | M | 2.1.4 | Sebas |
| 2.1.9 | Integration test for POST /auth/register (real DB) | P0 | M | 2.1.5 | Sebas |

### FEATURE 2.2: User Login

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 2.2.1 | Implement `JwtTokenService` adapter (sign + verify) | P0 | M | — | Yair |
| 2.2.2 | Implement access token generation (1h expiry, claims: sub, role, email) | P0 | S | 2.2.1 | Yair |
| 2.2.3 | Implement refresh token generation (7d expiry, stored hashed in DB) | P0 | M | 2.2.1 | Yair |
| 2.2.4 | Implement `LoginUseCase` | P0 | M | 2.2.1, 2.2.2, 2.2.3, 2.1.1 | Yair |
| 2.2.5 | Create `POST /api/v1/auth/login` route | P0 | S | 2.2.4 | Yair |
| 2.2.6 | Set refresh token as httpOnly cookie (`Set-Cookie`) | P0 | S | 2.2.5 | Yair |
| 2.2.7 | Handle invalid credentials (401 Unauthorized RFC 7807) | P0 | XS | 2.2.5 | Yair |
| 2.2.8 | Unit tests for LoginUseCase | P0 | M | 2.2.4 | Yair |
| 2.2.9 | Integration test for POST /auth/login | P0 | M | 2.2.5 | Yair |

### FEATURE 2.3: Token Refresh

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 2.3.1 | Implement `RefreshTokenUseCase` | P0 | M | 2.2.3, 2.1.1 | Yair |
| 2.3.2 | Create `POST /api/v1/auth/refresh` route | P0 | S | 2.3.1 | Yair |
| 2.3.3 | Handle expired/invalid refresh tokens | P0 | S | 2.3.2 | Yair |
| 2.3.4 | Rotate refresh token on each use (revoke old, issue new) | P1 | M | 2.3.1 | Yair |

### FEATURE 2.4: User Profile

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 2.4.1 | Implement `GetProfileUseCase` | P0 | S | 2.1.1 | Sebas |
| 2.4.2 | Create `GET /api/v1/auth/me` route (auth required) | P0 | S | 2.4.1, JWT guard | Sebas |
| 2.4.3 | Implement `UpdateProfileUseCase` | P1 | M | 2.1.1 | Sebas |
| 2.4.4 | Create `PATCH /api/v1/auth/me` route | P1 | S | 2.4.3 | Sebas |
| 2.4.5 | Add fields: alias, avatarUrl, bio | P1 | S | 2.4.3 | Sebas |

### FEATURE 2.5: Email Verification

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 2.5.1 | Implement `ResendEmailService` adapter | P1 | M | — | Yair |
| 2.5.2 | Implement `SendVerificationEmailUseCase` | P1 | M | 2.5.1, 2.1.1 | Yair |
| 2.5.3 | Generate email verification token (JWT with 24h expiry) | P1 | S | 2.2.1 | Yair |
| 2.5.4 | Create `POST /api/v1/auth/verify-email` route | P1 | S | 2.5.2 | Yair |
| 2.5.5 | Send verification email on registration (async, non-blocking) | P1 | S | 2.5.2 | Yair |
| 2.5.6 | Unit tests for verification flow | P1 | S | 2.5.4 | Yair |

### FEATURE 2.6: Password Reset

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 2.6.1 | Create `POST /api/v1/auth/forgot-password` route | P1 | M | 2.5.1 | Yair |
| 2.6.2 | Generate password reset token (JWT 1h expiry) | P1 | S | 2.2.1 | Yair |
| 2.6.3 | Send reset email with reset link | P1 | S | 2.5.1 | Yair |
| 2.6.4 | Create `POST /api/v1/auth/reset-password` route | P1 | M | 2.6.1 | Yair |
| 2.6.5 | Validate reset token + update password hash | P1 | S | 2.6.4 | Yair |

---

## EPIC 3: Catalog Service (Fase 1 — Semanas 5-6)

**Objetivo**: Beats tienen metadata, son buscables, navegables y tienen URLs amigables.

### FEATURE 3.1: Beat CRUD

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 3.1.1 | Implement `BeatRepository` (Prisma adapter) | P0 | M | 1.3.3 | Yair |
| 3.1.2 | Implement `Beat` entity + value objects (Title, Price, BPM, Key) | P0 | M | — | Yair |
| 3.1.3 | Implement `CreateBeatUseCase` | P0 | M | 3.1.1, 3.1.2 | Yair |
| 3.1.4 | Create `POST /api/v1/beats` route (auth: producer only) | P0 | S | 3.1.3 | Yair |
| 3.1.5 | Validate beat ownership on create (sub from JWT) | P0 | S | 3.1.4 | Yair |
| 3.1.6 | Implement `GetBeatUseCase` (by ID or slug) | P0 | M | 3.1.1 | Yair |
| 3.1.7 | Create `GET /api/v1/beats/:id` and `GET /api/v1/beats/:slug` routes | P0 | S | 3.1.6 | Yair |
| 3.1.8 | Implement `UpdateBeatUseCase` (owner-only) | P0 | M | 3.1.1 | Yair |
| 3.1.9 | Create `PATCH /api/v1/beats/:id` route | P0 | S | 3.1.8 | Yair |
| 3.1.10 | Implement `SoftDeleteBeatUseCase` | P0 | S | 3.1.1 | Yair |
| 3.1.11 | Create `DELETE /api/v1/beats/:id` route (soft delete) | P0 | S | 3.1.10 | Yair |
| 3.1.12 | Auto-generate slug from title (unique, URL-safe) | P0 | S | 3.1.4 | Yair |

### FEATURE 3.2: Catalog Browsing & Filtering

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 3.2.1 | Implement `ListBeatsUseCase` (paginado, ordenado por fecha DESC) | P0 | M | 3.1.1 | Sebas |
| 3.2.2 | Create `GET /api/v1/beats` route with query params (page, limit, genre, minPrice, maxPrice, bpm, key) | P0 | M | 3.2.1 | Sebas |
| 3.2.3 | Add genre filter (genre_id FK in beats table) | P0 | S | 3.2.2 | Sebas |
| 3.2.4 | Add price range filter (minPrice, maxPrice) | P0 | S | 3.2.2 | Sebas |
| 3.2.5 | Add BPM and key filters | P1 | S | 3.2.2 | Sebas |
| 3.2.6 | Cache first page of results in Redis (TTL 60s) | P1 | M | 3.2.2, Upstash | Sebas |
| 3.2.7 | Add pagination metadata (total, page, totalPages) in response | P0 | S | 3.2.2 | Sebas |

### FEATURE 3.3: Full-Text Search

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 3.3.1 | Add PostgreSQL `tsvector` column to beats (title, tags, producer_name) | P0 | M | 1.3.3 | Yair |
| 3.3.2 | Add GIN index on `tsvector` column | P0 | S | 3.3.1 | Yair |
| 3.3.3 | Implement `SearchBeatsUseCase` (full-text query + filters) | P0 | M | 3.3.1 | Yair |
| 3.3.4 | Create `GET /api/v1/beats/search?q=...` route | P0 | S | 3.3.3 | Yair |
| 3.3.5 | Sanitize search input (remove special chars, min 2 chars) | P0 | S | 3.3.4 | Yair |

### FEATURE 3.4: Producer Profiles

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 3.4.1 | Implement `ProducerProfileRepository` | P0 | M | 1.3.3 | Sebas |
| 3.4.2 | Implement `GetProducerProfileUseCase` (by user_id or slug) | P0 | M | 3.4.1 | Sebas |
| 3.4.3 | Create `GET /api/v1/producers/:id` route | P0 | S | 3.4.2 | Sebas |
| 3.4.4 | Create `GET /api/v1/producers/:slug` route | P0 | S | 3.4.2 | Sebas |
| 3.4.5 | Include beat count + total plays in profile response | P0 | S | 3.4.2 | Sebas |
| 3.4.6 | Cache producer profiles (TTL 300s) | P1 | S | 3.4.3, Upstash | Sebas |

### FEATURE 3.5: Streaming Client Integration

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 3.5.1 | Implement `StreamingClient` HTTP adapter (calls to Streaming Service) | P0 | M | — | Yair |
| 3.5.2 | Handle `audio-ready` callback from Streaming: update beat with URLs | P0 | M | 3.5.1, 3.1.8 | Yair |
| 3.5.3 | Handle `audio-deleted` callback from Streaming: clear URLs | P0 | S | 3.5.1 | Yair |
| 3.5.4 | Beat status field: `processing` → `ready` → `deleted` | P0 | S | 3.5.2 | Yair |

### FEATURE 3.6: Dashboard

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 3.6.1 | Implement `GetDashboardUseCase` (aggregate stats for producer) | P0 | M | 3.1.1 | Sebas |
| 3.6.2 | Create `GET /api/v1/dashboard` route (auth: producer only) | P0 | S | 3.6.1 | Sebas |
| 3.6.3 | Aggregate: total beats, total plays, total sales, total revenue | P0 | M | 3.6.1 | Sebas |
| 3.6.4 | Recent transactions list (last 10) | P0 | S | 3.6.1 | Sebas |

---

## EPIC 4: Streaming Service (Fase 1 — Semanas 5-6)

**Objetivo**: Audio se sube, procesa, almacena y streamea con baja latencia.

### FEATURE 4.1: Audio Upload

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 4.1.1 | Create `POST /api/v1/audio/upload` route (multipart/form-data) | P0 | M | — | Sebas |
| 4.1.2 | Validate file: MIME type real con magic bytes (file-type package) | P0 | M | 4.1.1 | Sebas |
| 4.1.3 | Validate file size: max 100MB | P0 | XS | 4.1.1 | Sebas |
| 4.1.4 | Validate audio duration: 1–600 seconds (ffprobe) | P0 | M | 4.1.1 | Sebas |
| 4.1.5 | Generate unique filename: `{beatId}_{timestamp}.{ext}` | P0 | XS | 4.1.1 | Sebas |
| 4.1.6 | Reject non-audio files with 415 Unsupported Media Type | P0 | S | 4.1.2 | Sebas |

### FEATURE 4.2: Audio Processing (ffmpeg)

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 4.2.1 | Install ffmpeg in Docker image (Alpine: `apk add ffmpeg`) | P0 | S | 1.5.3 | Sebas |
| 4.2.2 | Implement `FfmpegProcessor` adapter (fluent-ffmpeg wrapper) | P0 | L | 4.2.1 | Sebas |
| 4.2.3 | Generate 30s preview: `ffmpeg -i input.wav -t 30 -af afade=t=out:st=28:d=2 -b:a 192k output.mp3` | P0 | M | 4.2.2 | Sebas |
| 4.2.4 | Generate full MP3 320kbps for streaming | P0 | S | 4.2.2 | Sebas |
| 4.2.5 | Add subtle audio watermark (low volume "MingaRecords" every 10s) — opcional MVP, P2 | P2 | L | 4.2.2 | — |
| 4.2.6 | Handle ffmpeg errors gracefully (corrupt file → 422 Unprocessable) | P0 | S | 4.2.2 | Sebas |
| 4.2.7 | Async processing: upload returns 202 Accepted, processing happens in background | P0 | M | 4.2.2 | Sebas |

### FEATURE 4.3: Cloud Storage (R2 + BunnyCDN)

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 4.3.1 | Implement `R2Storage` adapter (AWS SDK S3 client → R2 endpoint) | P0 | L | 1.6.3 | Sebas |
| 4.3.2 | Upload original WAV to R2: `mingarecords-audio/originals/{id}.wav` | P0 | M | 4.3.1 | Sebas |
| 4.3.3 | Upload preview MP3 to R2: `mingarecords-audio/previews/{id}.mp3` | P0 | S | 4.3.1 | Sebas |
| 4.3.4 | Upload full MP3 to R2: `mingarecords-audio/full/{id}.mp3` | P0 | S | 4.3.1 | Sebas |
| 4.3.5 | Set correct Content-Type headers (audio/wav, audio/mpeg) | P0 | XS | 4.3.2–4.3.4 | Sebas |
| 4.3.6 | Configure BunnyCDN pull zone → R2 bucket public URL | P0 | M | 1.6.7, 4.3.1 | Sebas |
| 4.3.7 | Test streaming latency via BunnyCDN (< 500ms first byte) | P0 | S | 4.3.6 | Sebas |

### FEATURE 4.4: Audio Streaming

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 4.4.1 | Create `GET /api/v1/audio/stream/:beatId` route | P0 | M | 4.3.6 | Sebas |
| 4.4.2 | Support HTTP Range Requests (206 Partial Content) | P0 | L | 4.4.1 | Sebas |
| 4.4.3 | Proxy or redirect to BunnyCDN URL | P0 | S | 4.4.1 | Sebas |
| 4.4.4 | Set proper CORS headers for audio (Access-Control-Allow-Origin) | P0 | S | 4.4.1 | Sebas |
| 4.4.5 | Track play count (increment on stream start, not every range request) | P0 | M | 4.4.1 | Sebas |
| 4.4.6 | Rate limit streaming: 100 requests/min per IP | P1 | S | 4.4.1 | Sebas |

### FEATURE 4.5: Catalog Callbacks

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 4.5.1 | Implement `CatalogClient` HTTP adapter | P0 | M | — | Yair |
| 4.5.2 | Notify Catalog when audio processing is complete (PATCH beats/:id with URLs) | P0 | M | 4.5.1, 4.2.3 | Yair |
| 4.5.3 | Retry failed notifications (3 attempts, exponential backoff) | P0 | S | 4.5.2 | Yair |
| 4.5.4 | Notify Catalog when audio is deleted (cleanup on soft-delete) | P0 | S | 4.5.1 | Yair |

---

## EPIC 5: Payments Service (Fase 2 — Semanas 9-10)

**Objetivo**: Pagos reales procesados, licencias entregadas, revenue tracking.

### FEATURE 5.1: Stripe Integration

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 5.1.1 | Configure Stripe products and prices in Stripe Dashboard | P0 | M | 1.6.6 | Yair + Sebas |
| 5.1.2 | Implement `StripeGateway` adapter (stripe SDK) | P0 | L | 5.1.1 | Sebas |
| 5.1.3 | Implement `CreateCheckoutUseCase` | P0 | M | 5.1.2 | Sebas |
| 5.1.4 | Create `POST /api/v1/payments/checkout` route | P0 | M | 5.1.3 | Sebas |
| 5.1.5 | Include beat metadata in Stripe Checkout Session (line_items) | P0 | S | 5.1.4 | Sebas |
| 5.1.6 | Set success_url and cancel_url for redirect after payment | P0 | S | 5.1.4 | Sebas |
| 5.1.7 | Store pending transaction in DB before redirecting to Stripe | P0 | S | 5.1.4 | Sebas |

### FEATURE 5.2: Webhook Handling

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 5.2.1 | Create `POST /api/v1/payments/webhooks/stripe` route | P0 | M | — | Sebas |
| 5.2.2 | Verify Stripe webhook signature (prevent replay attacks) | P0 | M | 5.2.1 | Sebas |
| 5.2.3 | Handle `payment_intent.succeeded` event | P0 | L | 5.2.2 | Sebas |
| 5.2.4 | Handle `payment_intent.payment_failed` event | P0 | M | 5.2.2 | Sebas |
| 5.2.5 | Handle `charge.refunded` event (for refund flow) | P1 | M | 5.2.2 | Sebas |
| 5.2.6 | Idempotency: check if event was already processed (by event ID) | P0 | M | 5.2.3 | Sebas |
| 5.2.7 | Implement `TransactionRepository` (Prisma adapter) | P0 | M | 1.3.4 | Sebas |

### FEATURE 5.3: License Generation & Delivery

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 5.3.1 | Implement `License` entity + value objects | P0 | M | — | Yair |
| 5.3.2 | Implement `GenerateLicenseUseCase` | P0 | M | 5.3.1 | Yair |
| 5.3.3 | Generate license PDF (simple template: beat name, license type, buyer, date, terms) | P1 | L | 5.3.2 | Yair |
| 5.3.4 | Alternative: generate license as structured JSON + human-readable text | P0 | M | 5.3.2 | Yair |
| 5.3.5 | Store license in DB + generate download URL | P0 | M | 5.3.4 | Yair |
| 5.3.6 | Implement `LicenseRepository` | P0 | M | 1.3.4 | Yair |

### FEATURE 5.4: Post-Payment Actions

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 5.4.1 | Notify Catalog Service: increment sales count (`PATCH /beats/:id/sold`) | P0 | M | Catalog client | Sebas |
| 5.4.2 | Fetch buyer email from Auth Service (`GET /users/:id`) | P0 | M | Auth client | Sebas |
| 5.4.3 | Send license delivery email via Resend (with download link) | P0 | M | 2.5.1, 5.4.2 | Sebas |
| 5.4.4 | Calculate revenue split: price - Stripe fee - 15% MingaRecords commission | P0 | M | — | Sebas |
| 5.4.5 | Store complete transaction record in DB | P0 | S | 5.4.4, 5.2.7 | Sebas |
| 5.4.6 | Handle Catalog/Auth service unavailability (circuit breaker, eventual consistency) | P1 | M | 5.4.1, 5.4.2 | Sebas |

### FEATURE 5.5: Transaction History & Refunds

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 5.5.1 | Create `GET /api/v1/payments/transactions` route (producer: sus ventas) | P0 | M | 5.2.7 | Yair |
| 5.5.2 | Create `GET /api/v1/payments/transactions` route (artist: sus compras) | P0 | M | 5.2.7 | Yair |
| 5.5.3 | Implement `ProcessRefundUseCase` | P1 | L | 5.2.5, 5.1.2 | Yair |
| 5.5.4 | Create `POST /api/v1/payments/refund` route | P1 | M | 5.5.3 | Yair |
| 5.5.5 | Revoke license on refund | P1 | M | 5.5.3 | Yair |

---

## EPIC 6: Frontend Integration (Fase 1-2 — Semanas 7-10)

**Objetivo**: Todas las features del backend son accesibles desde la UI React.

> **Nota**: El frontend existe en `apps/web/` con estructura hexagonal (existente). Solo se documentan las tareas de integración con el nuevo backend.

### FEATURE 6.1: Auth UI

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 6.1.1 | Login page (email + password form → POST /auth/login → store JWT) | P0 | M | 2.2.5 | Yair |
| 6.1.2 | Register page (email + password + role → POST /auth/register) | P0 | M | 2.1.5 | Yair |
| 6.1.3 | JWT storage: access token in memory, refresh in httpOnly cookie | P0 | M | 6.1.1 | Yair |
| 6.1.4 | Auth guard: redirect to login if no valid JWT | P0 | S | 6.1.3 | Yair |
| 6.1.5 | Auto-refresh token on 401 response | P0 | M | 6.1.3, 2.3.2 | Yair |
| 6.1.6 | Profile page (GET /auth/me, edit alias/avatar/bio) | P1 | M | 2.4.2 | Yair |

### FEATURE 6.2: Catalog UI

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 6.2.1 | Beat list page (grid de beats con imagen, título, precio, género) | P0 | L | 3.2.2 | Sebas |
| 6.2.2 | Filters panel (género, rango de precio, BPM, key) | P0 | L | 3.2.2 | Sebas |
| 6.2.3 | Search bar (full-text con debounce 300ms) | P0 | M | 3.3.4 | Sebas |
| 6.2.4 | Pagination (infinite scroll o "Cargar más") | P0 | M | 3.2.2 | Sebas |
| 6.2.5 | Beat detail page (metadata + reproductor + botón comprar) | P0 | L | 3.1.7, 4.4.1 | Sebas |
| 6.2.6 | Audio player component (HTML5 Audio con Range Requests) | P0 | L | 4.4.1 | Sebas |
| 6.2.7 | Producer public profile page (beats del productor) | P0 | M | 3.4.3 | Sebas |

### FEATURE 6.3: Upload UI

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 6.3.1 | Upload beat form (título, género, precio, BPM, key, tags) | P0 | L | 3.1.4 | Yair |
| 6.3.2 | File upload with progress bar (multipart/form-data) | P0 | M | 4.1.1 | Yair |
| 6.3.3 | Upload status polling (processing → ready) | P0 | M | 4.5.2 | Yair |
| 6.3.4 | Audio preview before upload (play WAV locally) | P1 | M | — | Yair |

### FEATURE 6.4: Payments UI

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 6.4.1 | "Comprar" button on beat detail → redirect to Stripe Checkout | P0 | M | 5.1.4 | Yair |
| 6.4.2 | Success page (post-Stripe redirect, muestra confirmación) | P0 | S | 5.1.6 | Yair |
| 6.4.3 | Cancel page (compra cancelada, volver al beat) | P0 | S | 5.1.6 | Yair |
| 6.4.4 | Artist purchase history page | P0 | M | 5.5.2 | Yair |

### FEATURE 6.5: Dashboard UI

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 6.5.1 | Producer dashboard (stats: beats, plays, sales, revenue) | P0 | M | 3.6.2 | Sebas |
| 6.5.2 | My beats list (con estado: processing, ready, sold) | P0 | M | 3.1.7 | Sebas |
| 6.5.3 | Sales history table en dashboard | P0 | M | 5.5.1 | Sebas |

---

## EPIC 7: Polish, Testing & Launch (Fase 3 — Semanas 11-12)

**Objetivo**: MVP sólido, seguro y listo para usuarios reales.

### FEATURE 7.1: Security Hardening

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 7.1.1 | Rate limiting on all public endpoints (Upstash Redis sliding window) | P0 | L | Upstash | Sebas |
| 7.1.2 | Rate limit config: 100 req/min per IP on public; 300 req/min auth'd | P0 | S | 7.1.1 | Sebas |
| 7.1.3 | CORS: restrict to mingarecords.com + *.vercel.app | P0 | S | — | Sebas |
| 7.1.4 | Input sanitization (XSS via validator.js, SQL via Prisma parametrization) | P0 | M | — | Yair |
| 7.1.5 | HTTPS enforcement (HSTS header, Railway + Vercel already handle) | P0 | XS | — | Yair |
| 7.1.6 | CSRF protection (SameSite=Strict on cookies) | P0 | S | — | Yair |
| 7.1.7 | Security headers (Content-Security-Policy, X-Content-Type-Options, etc.) | P1 | S | — | Yair |

### FEATURE 7.2: Error Handling & Validation

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 7.2.1 | RFC 7807 error responses in ALL endpoints (audit) | P0 | M | — | Yair |
| 7.2.2 | Zod validation schemas for ALL request bodies and query params | P0 | M | — | Yair |
| 7.2.3 | Proper HTTP status codes audit (201, 204, 400, 401, 403, 404, 409, 422, 500) | P0 | S | — | Yair |
| 7.2.4 | Structured JSON logging (Pino) in ALL services | P0 | M | — | Sebas |

### FEATURE 7.3: Documentation

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 7.3.1 | OpenAPI 3.0 .yaml for Auth Service | P1 | M | Auth completo | Sebas |
| 7.3.2 | OpenAPI 3.0 .yaml for Catalog Service | P1 | M | Catalog completo | Yair |
| 7.3.3 | OpenAPI 3.0 .yaml for Streaming Service | P1 | M | Streaming completo | Sebas |
| 7.3.4 | OpenAPI 3.0 .yaml for Payments Service | P1 | M | Payments completo | Yair |
| 7.3.5 | README.md actualizado (cómo correr, deployar, contribuir) | P1 | M | — | Yair |
| 7.3.6 | Postman collection con todos los endpoints | P2 | M | 7.3.1–7.3.4 | Sebas |

### FEATURE 7.4: Testing

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 7.4.1 | Unit test coverage > 80% en Auth Service | P0 | M | Auth completo | Sebas |
| 7.4.2 | Unit test coverage > 80% en Catalog Service | P0 | L | Catalog completo | Yair |
| 7.4.3 | Unit test coverage > 80% en Streaming Service | P0 | L | Streaming completo | Sebas |
| 7.4.4 | Unit test coverage > 80% en Payments Service | P0 | L | Payments completo | Yair |
| 7.4.5 | Integration test: register → login → upload beat → stream preview | P0 | L | Todos los servicios | Yair + Sebas |
| 7.4.6 | Integration test: catalog → search → filter → detail | P0 | M | Catalog + Streaming | Yair |
| 7.4.7 | Integration test: checkout → Stripe webhook → license delivery | P0 | L | Payments + Catalog + Auth | Sebas |
| 7.4.8 | E2E test (Playwright): full user journey happy path | P0 | XL | Frontend completo | Yair + Sebas |
| 7.4.9 | E2E test: error states (invalid login, upload too large, payment declined) | P0 | L | 7.4.8 | Yair + Sebas |

### FEATURE 7.5: Launch Preparation

| ID | TASK | Prioridad | Est. | Dependencias | Owner sugerido |
|----|------|-----------|------|--------------|----------------|
| 7.5.1 | Stripe live mode activation (business verification) | P0 | M | Stripe test mode completo | Sebas |
| 7.5.2 | Domain setup: mingarecords.com + DNS (Namecheap → Vercel + Railway) | P0 | M | — | Yair |
| 7.5.3 | SSL certificates verification (auto via Vercel + Railway) | P0 | S | 7.5.2 | Yair |
| 7.5.4 | Final deploy to production (v1.0.0) | P0 | M | TODO lo anterior | Yair + Sebas |
| 7.5.5 | Smoke test in production (register, upload, stream, buy) | P0 | M | 7.5.4 | Yair + Sebas |
| 7.5.6 | Monitoring setup: Railway health checks + alerts (email on failure) | P0 | S | 7.5.4 | Sebas |
| 7.5.7 | Backup verification: Supabase daily backups tested | P0 | S | 7.5.4 | Sebas |

---

## Resumen de Estimaciones por EPIC

| EPIC | Tareas | d/h estimados | Semanas (2 devs) |
|------|--------|---------------|-------------------|
| EPIC 1: Platform Foundation | 41 tareas | ~80 d/h | 2.0 semanas |
| EPIC 2: Auth Service | 32 tareas | ~56 d/h | 2.0 semanas |
| EPIC 3: Catalog Service | 37 tareas | ~60 d/h | 2.0 semanas |
| EPIC 4: Streaming Service | 24 tareas | ~48 d/h | 2.0 semanas (paralelo con EPIC 3) |
| EPIC 5: Payments Service | 37 tareas | ~64 d/h | 2.0 semanas |
| EPIC 6: Frontend Integration | 24 tareas | ~60 d/h | 3.0 semanas (parcialmente paralelo con EPIC 3-5) |
| EPIC 7: Polish & Launch | 33 tareas | ~66 d/h | 2.0 semanas |
| **TOTAL** | **228 tareas** | **~434 d/h** | **12 semanas (2 devs full-time)** |

### Capacidad Real (2 devs)

- Días laborales por semana: 5
- Horas productivas por dev por día: 6h
- d/h por dev por semana: 5 × 1 = 5 d/h
- d/h totales por semana (2 devs): 10 d/h
- d/h totales en 12 semanas: 120 d/h por dev = **240 d/h totales**

**⚠️ ALERTA**: La estimación (434 d/h) excede la capacidad real (240 d/h) en un 81%.

### Ajustes Necesarios

| Ajuste | Ahorro | Impacto |
|--------|--------|---------|
| **Reducir cobertura de tests unitarios a 60%** (en vez de 80%) en MVP | -30 d/h | Riesgo medio: algunos bugs escapan a staging |
| **Simplificar email verification flow** (solo email de bienvenida, sin verificación obligatoria) | -15 d/h | Riesgo bajo: en MVP la verificación es nice-to-have |
| **Eliminar marca de agua de audio en MVP** (ya es P2) | -12 d/h | Sin impacto: no era requerido |
| **PDF license → JSON + texto plano** en vez de PDF | -10 d/h | Sin impacto funcional |
| **Password reset → manual por ahora** (contactar soporte) | -12 d/h | Riesgo bajo: pocos usuarios en MVP |
| **Postman collection + OpenAPI completo → solo README + ejemplos curl** | -10 d/h | Riesgo bajo: documentación mínima viable |
| **Reducir E2E tests a happy path solo** (3 tests core en vez de 9) | -20 d/h | Riesgo medio: pero los unit tests cubren edge cases |
| **TOTAL AHORRADO** | **~109 d/h** | Estimación ajustada: **325 d/h → 240 d/h = factible** |
