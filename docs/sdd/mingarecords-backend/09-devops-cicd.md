# 09 — DevOps, CI/CD y Deployments

> **Versión:** 1.0 — **Fecha:** 12 de mayo de 2026

---

## 9.1 Filosofía DevOps para 2 Developers

Con solo 2 desarrolladores, la automatización NO es opcional — es supervivencia. Cada minuto gastado en deploy manual es un minuto no codeado. Principios:

| Principio | Qué significa |
|-----------|--------------|
| **Push to main = deploy to staging** | No hay pasos manuales entre merge y staging |
| **Una PR = un preview environment** | Cada PR crea un entorno efímero para testear |
| **Rollback en < 2 minutos** | Si algo falla en prod, revertimos con un click |
| **Secrets nunca en código** | GitHub Secrets → CI → Railway env vars |
| **Monorepo-aware** | Solo se build/test/deploy lo que cambió |

---

## 9.2 Entornos

| Entorno | Rama | URL | Infra | Cuándo se actualiza |
|---------|------|-----|-------|---------------------|
| **dev** | Cualquier rama (local) | `localhost` | Docker Compose | `pnpm dev` |
| **preview** | PR branches | `pr-{N}.mingarecords.vercel.app` (frontend) + Railway preview apps | Railway preview | Push a PR |
| **staging** | `main` | `staging.mingarecords.com` | Railway (staging env) | Merge a `main` |
| **production** | `main` (release tag) | `mingarecords.com` | Railway (prod env) | Release tag `v*` o botón manual |

**Decisión**: Staging y production comparten la misma rama (`main`) pero distinto trigger de deploy. Staging se deploya automáticamente en cada merge. Production requiere un release tag (`v1.0.0`) o un workflow_dispatch manual. Esto evita que un merge accidental rompa prod sin querer.

---

## 9.3 GitHub Actions: Pipeline Principal de CI

### `ci.yml` — Lint, Type-Check, Test y Build

Este pipeline corre en CADA push y PR. Solo build/testea los servicios que cambiaron gracias a Turborepo.

```yaml
# .github/workflows/ci.yml
name: CI — Lint, Type-Check, Test, Build

on:
  push:
    branches: [main]
    paths-ignore:
      - '**.md'
      - 'docs/**'
  pull_request:
    branches: [main]
    paths-ignore:
      - '**.md'
      - 'docs/**'

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  PNPM_VERSION: '9'
  NODE_VERSION: '22'

jobs:
  # ─────────────────────────────────────────────────
  # JOB 1: Instalación y caché
  # ─────────────────────────────────────────────────
  install:
    name: Install & Cache
    runs-on: ubuntu-latest
    timeout-minutes: 5
    outputs:
      has-changes: ${{ steps.filter.outputs.has-changes }}
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      # Detectar qué servicios cambiaron
      - name: Detect changed services
        id: filter
        uses: dorny/paths-filter@v3
        with:
          filters: |
            auth:
              - 'apps/auth/**'
              - 'packages/shared/**'
            catalog:
              - 'apps/catalog/**'
              - 'packages/shared/**'
            streaming:
              - 'apps/streaming/**'
              - 'packages/shared/**'
            payments:
              - 'apps/payments/**'
              - 'packages/shared/**'
            shared:
              - 'packages/**'

  # ─────────────────────────────────────────────────
  # JOB 2: Lint (ESLint, Prettier)
  # ─────────────────────────────────────────────────
  lint:
    name: Lint
    needs: install
    runs-on: ubuntu-latest
    timeout-minutes: 3
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: Run ESLint
        run: pnpm lint
      - name: Check formatting (Prettier)
        run: pnpm format:check

  # ─────────────────────────────────────────────────
  # JOB 3: Type-Check (tsc --noEmit)
  # ─────────────────────────────────────────────────
  type-check:
    name: Type-Check
    needs: install
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: TypeScript check
        run: pnpm type-check

  # ─────────────────────────────────────────────────
  # JOB 4: Unit Tests (Vitest)
  # ─────────────────────────────────────────────────
  test:
    name: Unit Tests
    needs: [install, type-check]
    runs-on: ubuntu-latest
    timeout-minutes: 10
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: minga
          POSTGRES_PASSWORD: ci_test
          POSTGRES_DB: mingarecords_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile

      - name: Run DB migrations (test env)
        run: pnpm db:migrate
        env:
          DATABASE_URL: postgresql://minga:ci_test@localhost:5432/mingarecords_test

      - name: Run unit tests
        run: pnpm test -- --coverage
        env:
          DATABASE_URL: postgresql://minga:ci_test@localhost:5432/mingarecords_test
          JWT_SECRET: ci-test-secret-key-min-32-chars!!
          NODE_ENV: test

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage-report
          path: '**/coverage/**'
          retention-days: 7

  # ─────────────────────────────────────────────────
  # JOB 5: Build (solo servicios que cambiaron)
  # ─────────────────────────────────────────────────
  build:
    name: Build (changed only)
    needs: [lint, type-check, test]
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile

      - name: Build all services
        run: pnpm build

      - name: Check build outputs exist
        run: |
          for svc in auth catalog streaming payments; do
            if [ -d "apps/$svc/dist" ]; then
              echo "✅ apps/$svc built successfully"
            else
              echo "❌ apps/$svc failed to build"
              exit 1
            fi
          done
```

---

## 9.4 GitHub Actions: Deploy por Servicio

Cada servicio tiene su propio workflow de deploy. Solo se ejecuta si el servicio cambió (detectado por `paths-filter`).

### `deploy-auth.yml`

```yaml
# .github/workflows/deploy-auth.yml
name: Deploy — Auth Service

on:
  push:
    branches: [main]
    paths:
      - 'apps/auth/**'
      - 'packages/shared/**'
      - '.github/workflows/deploy-auth.yml'
  workflow_dispatch:  # Permitir deploy manual

env:
  SERVICE: auth
  SERVICE_PATH: apps/auth

jobs:
  deploy:
    name: Deploy Auth → Railway
    runs-on: ubuntu-latest
    timeout-minutes: 15
    environment: ${{ github.ref == 'refs/heads/main' && 'staging' || 'development' }}
    steps:
      - uses: actions/checkout@v4

      - name: Determine environment
        id: env
        run: |
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            echo "railway_env=staging" >> $GITHUB_OUTPUT
          else
            echo "railway_env=preview" >> $GITHUB_OUTPUT
          fi

      - name: Build Docker image
        run: |
          docker build \
            -f ${{ env.SERVICE_PATH }}/Dockerfile \
            -t ghcr.io/mingarecords/${{ env.SERVICE }}:${{ github.sha }} \
            --build-arg SERVICE=${{ env.SERVICE }} \
            .

      - name: Push to GitHub Container Registry
        run: |
          echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u ${{ github.actor }} --password-stdin
          docker push ghcr.io/mingarecords/${{ env.SERVICE }}:${{ github.sha }}

      - name: Deploy to Railway
        uses: railwayapp/railway-deploy-action@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: ${{ env.SERVICE }}
          environment: ${{ steps.env.outputs.railway_env }}
```

> **Nota**: Los workflows `deploy-catalog.yml`, `deploy-streaming.yml` y `deploy-payments.yml` son IDÉNTICOS salvo el valor de `SERVICE`. Se usa una plantilla parametrizada o se copian (copiar = 4 archivos, pero 0 overhead de template engine para 2 devs).

---

## 9.5 Docker Strategy

### Dockerfile Multi-Stage (por servicio)

Cada microservicio tiene un Dockerfile idéntico que usa el contexto del monorepo para resolver dependencias del workspace pnpm.

```dockerfile
# apps/auth/Dockerfile
# ─── STAGE 1: Build ───
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copiar archivos de workspace necesarios
COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY turbo.json ./
COPY package.json ./
COPY tsconfig.base.json ./

# Copiar todos los packages compartidos y el servicio
COPY packages/ packages/
COPY apps/auth/ apps/auth/

# Instalar solo dependencias de producción del servicio
RUN pnpm install --frozen-lockfile --filter=@mingarecords/auth... --prod=false
RUN pnpm build --filter=@mingarecords/auth

# ─── STAGE 2: Production ───
FROM node:22-alpine AS runner
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Instalar ffmpeg en el runner (necesario para Streaming Service; inocuo en otros)
RUN apk add --no-cache ffmpeg curl

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copiar solo lo necesario para producción
COPY --from=builder /app/apps/auth/dist ./dist
COPY --from=builder /app/apps/auth/package.json ./
COPY --from=builder /app/packages/shared/dist ../packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ../packages/shared/package.json

# Instalar solo dependencias de producción
RUN pnpm install --frozen-lockfile --filter=@mingarecords/auth --prod

USER nodejs

ENV NODE_ENV=production
ENV PORT=4001

EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4001/health || exit 1

CMD ["node", "dist/index.js"]
```

### Optimizaciones de Imagen

| Técnica | Ahorro |
|---------|--------|
| Multi-stage build | Imagen final NO incluye devDependencies ni archivos fuente |
| Alpine base (~50MB) | vs Debian (~180MB) |
| `.dockerignore` agresivo | Excluye `node_modules`, `.turbo`, `coverage`, `test/` |
| Single layer para node_modules | pnpm prune elimina dependencias no usadas |
| Imagen final por servicio | ~150MB (incluyendo ffmpeg en Streaming: ~180MB) |

### `.dockerignore` (raíz del monorepo)

```
**/node_modules
**/.turbo
**/dist
**/coverage
**/.env
**/.env.*
**/test
**/__tests__
**/*.test.ts
**/*.spec.ts
.git
.github
docs
tooling
*.md
```

---

## 9.6 Preview Deployments (Per-PR Environments)

### Estrategia

Cada PR crea un entorno efímero para que los reviewers puedan probar el cambio sin deployar a staging. Esto es CRÍTICO con solo 2 devs: no queremos que un PR no revisado rompa staging y bloquee al otro dev.

```yaml
# .github/workflows/preview-deploy.yml
name: Preview Deploy (PR)

on:
  pull_request:
    types: [opened, synchronize, reopened]
    branches: [main]

concurrency:
  group: preview-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  preview:
    name: Deploy Preview PR #${{ github.event.pull_request.number }}
    runs-on: ubuntu-latest
    timeout-minutes: 15
    environment: preview
    steps:
      - uses: actions/checkout@v4

      - name: Build all services
        run: |
          # En preview, build all para asegurar consistencia
          docker compose -f tooling/docker-compose.ci.yml build

      - name: Deploy preview to Railway
        uses: railwayapp/railway-deploy-action@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          environment: preview
          service: pr-${{ github.event.pull_request.number }}

      - name: Post preview URL on PR
        uses: thollander/actions-comment-pull-request@v3
        with:
          message: |
            ## 🚀 Preview Deployed

            | Service | URL |
            |---------|-----|
            | Auth | `pr-${{ github.event.pull_request.number }}-auth.railway.app` |
            | Catalog | `pr-${{ github.event.pull_request.number }}-catalog.railway.app` |
            | Streaming | `pr-${{ github.event.pull_request.number }}-streaming.railway.app` |
            | Payments | `pr-${{ github.event.pull_request.number }}-payments.railway.app` |

            ⏱️ Deployed at $(date -u +"%Y-%m-%dT%H:%M:%SZ")
          comment_tag: preview-url

  # Cleanup cuando la PR se cierra
  cleanup:
    name: Cleanup Preview PR #${{ github.event.pull_request.number }}
    if: github.event.action == 'closed'
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Remove Railway preview services
        run: |
          curl -X DELETE \
            -H "Authorization: Bearer ${{ secrets.RAILWAY_TOKEN }}" \
            "https://backboard.railway.app/graphql/v2" \
            -d '{"query":"mutation { serviceDelete(id: \"pr-${{ github.event.pull_request.number }}\") }"}'
```

**Límite de previews**: Railway permite múltiples entornos. Como somos 2 devs, máximo 2-3 previews simultáneas = $0 extra (Railway cobra por uso, y los previews duran horas/días, no 24/7).

---

## 9.7 Branch Protection Rules

Configuradas en GitHub Settings → Branches → Add Rule:

```yaml
# branch-protection.yml (documentación; la regla real se configura en GitHub UI)
branch: main
rules:
  - require_pull_request:
      required_approving_review_count: 1   # Con 2 devs, uno aprueba el PR del otro
      dismiss_stale_reviews: true
      require_code_owner_reviews: false     # No CODEOWNERS en equipo de 2
  - require_status_checks:
      strict: true                          # Branch debe estar up-to-date con main
      contexts:
        - Lint
        - Type-Check
        - Unit Tests
        - Build (changed only)
  - require_conversation_resolution: true   # Todos los comentarios resueltos
  - require_signed_commits: false           # Opcional, agregar en v2
  - require_linear_history: false           # Permitimos squash merge
  - allow_force_pushes: false               # NUNCA force push en main
  - allow_deletions: false                  # NUNCA borrar main
  - restrictions: null                      # Sin restricciones de quién puede push
```

---

## 9.8 Secrets Management

### Flujo de Secrets

```
┌──────────────────────────────────────────────────────────────┐
│                  CADENA DE SECRETOS                          │
│                                                              │
│  GitHub Secrets            Railway Env Vars                  │
│  ─────────────             ────────────────                  │
│  RAILWAY_TOKEN      ───►  (auth token para deploy)           │
│  STRIPE_SECRET_KEY  ───►  STRIPE_SECRET_KEY (prod/staging)   │
│  JWT_SECRET         ───►  JWT_SECRET                         │
│  DATABASE_URL       ───►  DATABASE_URL (por entorno)         │
│  R2_ACCESS_KEY_ID   ───►  R2_ACCESS_KEY_ID                   │
│  R2_SECRET_ACCESS_KEY ─►  R2_SECRET_ACCESS_KEY               │
│  RESEND_API_KEY     ───►  RESEND_API_KEY                     │
│  UPSTASH_REDIS_URL  ───►  UPSTASH_REDIS_URL                  │
│                                                              │
│  El CI inyecta las variables desde GitHub Secrets            │
│  en los comandos de deploy de Railway.                       │
│  Railway las almacena cifradas y las expone al runtime.      │
└──────────────────────────────────────────────────────────────┘
```

### Secrets por Entorno

| Secret | dev (local) | staging | production |
|--------|-------------|---------|------------|
| `DATABASE_URL` | Docker local | Supabase staging DB | Supabase prod DB |
| `JWT_SECRET` | `dev-secret-...` | GitHub Secret → Railway staging | GitHub Secret → Railway prod |
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_test_...` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | N/A | `whsec_test_...` | `whsec_live_...` |
| `R2_ACCESS_KEY_ID` | Dev credentials | Staging bucket | Prod bucket |
| `RESEND_API_KEY` | `re_test_...` | `re_...` (staging) | `re_...` (prod) |

### Rotación de Secrets

| Secret | Rotación | Procedimiento |
|--------|----------|---------------|
| `JWT_SECRET` | Cada 90 días o ante sospecha de leak | Generar nuevo secret, actualizar GitHub Secret + Railway, redeploy. Los tokens existentes expiran en 1h (access) — no se invalidan masivamente. |
| `STRIPE_SECRET_KEY` | Stripe maneja rotación | Generar nueva key en Stripe Dashboard, actualizar variable, revocar key vieja 24h después. |
| `R2_ACCESS_KEY_ID` | Cada 180 días | Rotar en Cloudflare dashboard, actualizar GitHub + Railway. |

---

## 9.9 Rollback Strategy

### Producción

```yaml
# .github/workflows/rollback.yml
name: Rollback Production

on:
  workflow_dispatch:
    inputs:
      service:
        description: 'Service to rollback'
        required: true
        type: choice
        options:
          - auth
          - catalog
          - streaming
          - payments
      version:
        description: 'Version to rollback to (git tag, e.g. v1.2.0)'
        required: true
        type: string

jobs:
  rollback:
    name: Rollback ${{ inputs.service }} → ${{ inputs.version }}
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ inputs.version }}

      - name: Build Docker image from tag
        run: |
          docker build \
            -f apps/${{ inputs.service }}/Dockerfile \
            -t ghcr.io/mingarecords/${{ inputs.service }}:rollback-${{ inputs.version }} \
            .

      - name: Deploy rollback
        uses: railwayapp/railway-deploy-action@v1
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: ${{ inputs.service }}
          environment: production

      - name: Notify on Slack/Discord
        run: |
          echo "⚠️ ROLLBACK: ${{ inputs.service }} rolled back to ${{ inputs.version }} by ${{ github.actor }}"
```

### Estrategia de Rollback por Nivel

| Nivel | Método | Tiempo |
|-------|--------|--------|
| **Railway** | Railway UI → Deployments → Click "Rollback" en deploy anterior | < 30 seg |
| **GitHub Release** | Revertir PR o correr workflow `rollback.yml` con tag anterior | < 2 min |
| **Base de Datos** | Supabase → Point-in-time recovery (Pro tier) o backups manuales | < 15 min |
| **Archivos R2** | R2 versioning (habilitado) → restaurar versión anterior del objeto | < 1 min |

### Política de Rollback

1. **Si el error es en producción** y afecta usuarios: rollback INMEDIATO, preguntar después.
2. **Si el error es en staging**: fix forward (no rollback), staging no tiene usuarios reales.
3. **Rollback de DB**: solo si la migración es destructiva. Preferimos migraciones forward-only con `--create-only` y revisión manual.
4. **Post-rollback**: crear issue documentando qué falló, por qué y cómo prevenirlo.

---

## 9.10 Monitoring y Health Checks

Cada servicio expone un endpoint de health check que Railway usa para saber si el deploy fue exitoso:

```
GET /health → 200 OK
{
  "status": "ok",
  "service": "auth",
  "version": "1.0.0",
  "uptime": 12345,
  "checks": {
    "database": "connected",
    "cache": "connected"
  }
}
```

Si `/health` devuelve un código ≠ 200 después de 3 intentos (cada 10s), Railway marca el deploy como fallido y NO reemplaza la versión anterior (protegiendo prod de deploys rotos).

---

## 9.11 Triggers de Deploy (Resumen)

```
┌──────────────────────────────────────────────────────┐
│                  DEPLOYMENT TRIGGERS                  │
│                                                      │
│  EVENT               → ENTORNO     → SERVICIO        │
│  ─────               ─────────     ────────          │
│  PR opened/updated   → Preview     → Servicios       │
│                          (Railway)    cambiados       │
│                                                      │
│  PR merged to main   → Staging     → Solo el         │
│                          (Railway)    servicio        │
│                                       cambiado        │
│                                                      │
│  Release tag v*      → Production  → Todos los       │
│  (manual o via GH)                     servicios      │
│                                                      │
│  workflow_dispatch   → Cualquiera  → El que el       │
│  (manual)                            dev elija        │
│                                                      │
│  Schedule (cron)     → Preview     → Cleanup de      │
│  0 2 * * * (diario)                  previews > 7d   │
└──────────────────────────────────────────────────────┘
```

---

## 9.12 Resumen de Workflows de GitHub Actions

| Workflow | Archivo | Trigger | Tiempo estimado |
|----------|---------|---------|-----------------|
| CI | `ci.yml` | Push + PR | ~8 min |
| Deploy Auth | `deploy-auth.yml` | Push a `main` (paths: auth) | ~6 min |
| Deploy Catalog | `deploy-catalog.yml` | Push a `main` (paths: catalog) | ~6 min |
| Deploy Streaming | `deploy-streaming.yml` | Push a `main` (paths: streaming) | ~6 min |
| Deploy Payments | `deploy-payments.yml` | Push a `main` (paths: payments) | ~6 min |
| Preview Deploy | `preview-deploy.yml` | PR opened/updated | ~10 min |
| Rollback | `rollback.yml` | workflow_dispatch | ~3 min |
| Cleanup Previews | `cleanup-previews.yml` | schedule (diario) | ~2 min |

**Tiempo total de CI/CD para un PR típico**: 8 minutos (CI) + si se mergea, 6 minutos más (deploy). Total: ~14 minutos desde push a producción. Con 2 deploys diarios (ADR 001: 2 lanzamientos/día), esto es perfectamente manejable.
