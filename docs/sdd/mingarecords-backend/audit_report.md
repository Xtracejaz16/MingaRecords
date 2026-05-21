# Audit Report — SDD Backend MingaRecords

> **Fecha:** 19 de mayo de 2026
> **Auditor:** Senior Architect + Technical Documentation Reviewer
> **Alcance:** Todos los documentos en `docs/sdd/mingarecords-backend/` (14 archivos)

---

## Resumen Ejecutivo

El SDD fue diseñado originalmente para una arquitectura de **microservicios distribuidos** con **Fastify**, **Stripe**, **Railway**, **BunnyCDN**, **Upstash Redis**, **Resend**, **Turborepo**, y un roadmap de **12 semanas**.

La arquitectura oficial cambió a:
- **Framework:** Express
- **Arquitectura:** Monolito modular (1 proceso, 1 deploy)
- **Pagos:** MercadoPago
- **Base de datos:** Supabase (PostgreSQL)
- **Storage:** Cloudflare R2
- **Deploy:** AWS Free Tier
- **Equipo:** 2 developers
- **Presupuesto:** $0
- **Deadline:** **1 semana**

**Veredicto:** El 90% de la documentación requiere refactorización significativa. El overengineering es masivo para un deadline de 1 semana.

---

## Inconsistencias Críticas (Bloqueantes)

### 1. Framework: Fastify vs Express

| Documento | Dice | Debería decir |
|-----------|------|---------------|
| 01-overview.md | Menciona Express ✅ (parcialmente correcto) | Consistentemente Express |
| 03-repository-strategy.md | "Fastify sobre NestJS" — comparación completa de 591 líneas | Express |
| 05-microservices.md | "Framework: Express.js" ✅ | ✅ Correcto |
| 06-api-contracts.md | Todo el código usa `FastifyInstance`, `FastifyRequest`, `FastifyReply` | Express equivalents |
| 07-hexagonal-architecture.md | Todo el código usa Fastify | Express |
| 09-devops-cicd.md | Referencias a Fastify en health checks | Express |
| 10-security.md | CORS config para Fastify | Express |
| 11-observability.md | Pino logger con Fastify decorators | Express middleware |

**Impacto:** TODO el código de ejemplo en los docs es inutilizable. Hay que reescribir 06, 07, 10, 11.

---

### 2. Pagos: Stripe vs MercadoPago

| Documento | Dice | Debería decir |
|-----------|------|---------------|
| 01-overview.md | Menciona MercadoPago ✅ | ✅ Correcto |
| 02-system-architecture.md | Flujos con Stripe | MercadoPago |
| 04-infrastructure.md | Sección completa de Stripe ($2.9%+$0.30) | MercadoPago (~5% comisión) |
| 06-api-contracts.md | Webhooks de Stripe, Stripe Checkout, Stripe SDK | MercadoPago preference, webhooks |
| 07-hexagonal-architecture.md | `stripe-gateway.ts` | `mercadopago-gateway.ts` |
| 09-devops-cicd.md | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | MercadoPago credentials |
| 10-security.md | Stripe signature verification, PCI DSS | MercadoPago webhook verification |
| 12-roadmap.md | "Checkout con Stripe" | MercadoPago |
| 13-task-breakdown.md | EPIC 5 completo sobre Stripe | MercadoPago |
| 14-future-scalability.md | "Stripe Connect para payouts" | MercadoPago payouts |

**Impacto:** El EPIC 5 (Payments) está completamente errado. Hay que reescribirlo.

---

### 3. Deploy: Railway vs AWS Free Tier

| Documento | Dice | Debería decir |
|-----------|------|---------------|
| 04-infrastructure.md | Railway como hosting principal ($5 crédito, serverless) | AWS Free Tier (EC2 t2.micro o t3.micro) |
| 09-devops-cicd.md | 8 workflows de GitHub Actions para Railway deploy | Deploy simple a EC2 (SSH, PM2, o Docker en EC2) |
| 12-roadmap.md | Railway en toda la infra | AWS Free Tier |
| 13-task-breakdown.md | Railway project setup, Railway env vars | AWS EC2 setup |
| 14-future-scalability.md | Railway → AWS/GCP como migración futura | Ya estamos en AWS |

**Impacto:** Toda la sección de DevOps/CICD es overengineering para 1 deploy en EC2.

---

### 4. Deadline: 12 semanas vs 1 semana

| Documento | Dice | Debería decir |
|-----------|------|---------------|
| 01-overview.md | "Time-to-market < 3 meses", "12 semanas" | **1 semana** |
| 12-roadmap.md | Roadmap completo de 12 semanas con 4 fases | Sprint de 1 semana |
| 13-task-breakdown.md | 228 tareas, 434 d/h estimados | Máximo ~30-40 tareas críticas |

**Impacto:** El roadmap y task breakdown son completamente inviables. Hay que reducir a lo esencial.

---

### 5. Infraestructura Innecesaria para MVP de 1 Semana

| Componente | Documentos que lo mencionan | Debería estar en MVP? | Razón |
|------------|----------------------------|----------------------|-------|
| **Turborepo** | 03, 09, 12, 13 | ❌ NO | Overkill para 1 monolito, 2 devs, 1 semana |
| **BunnyCDN** | 04, 12, 13, 14 | ❌ NO | R2 tiene egress gratuito, CDN innecesario para MVP |
| **Upstash Redis** | 04, 09, 10, 11, 13, 14 | ❌ NO | Rate limiting en memoria es suficiente |
| **Resend** | 04, 09, 10, 11, 13 | ❓ Clarificar | No está en la arquitectura oficial |
| **Docker multi-stage** | 03, 09, 13 | ❌ NO | Deploy directo a EC2 con Node.js |
| **Preview deployments** | 09 | ❌ NO | No hay tiempo ni necesidad para PR previews |
| **8 GitHub Actions workflows** | 09, 13 | ❌ NO | 1 workflow de CI básico es suficiente |
| **OpenAPI contract-first** | 06, 08, 12, 13 | ❌ NO | Documentar endpoints inline es suficiente |
| **Sentry** | 04, 10, 11, 12, 14 | ❓ Opcional | Console.log + logs simples para 1 semana |
| **Pino structured logging** | 03, 09, 11, 13 | ❌ NO | `console.log` es suficiente |
| **Correlation IDs** | 10, 11 | ❌ NO | 1 proceso, no hay tracing cross-service |
| **Circuit breaker** | 03, 10, 13, 14 | ❌ NO | No hay comunicación HTTP entre módulos |
| **Service discovery** | 02, 03, 09 | ❌ NO | 1 proceso Express |
| **PgBouncer** | 04, 13, 14 | ❓ Opcional | Supabase ya tiene pooler incluido |
| **Docker Compose (PostgreSQL + Redis)** | 03, 09, 13 | ❌ NO | Usar Supabase directamente |

---

## Inconsistencias Menores

| # | Descripción | Documentos |
|---|-------------|------------|
| 1 | RS256 vs HS256 para JWT (06 dice RS256, 10 dice HS256) | 06 vs 10 |
| 2 | Costos estimados inconsistentes ($18/mes vs $17/mes vs $0.83/mes) | 04 vs 12 |
| 3 | "Microservicios" vs "Monolito modular" — la estructura de carpetas es de microservicios | 03 |
| 4 | Fastify vs Express en código de ejemplo | 06, 07, 10, 11 |
| 5 | Stripe vs MercadoPago en flujos de pago | 02, 04, 06, 07, 09, 10, 12, 13, 14 |
| 6 | Referencias a "servicios" cuando debería ser "módulos" | 02, 03, 05, 06, 09, 11, 13 |
| 7 | Arquitectura hexagonal completa para 1 semana de desarrollo | 07 |
| 8 | 228 tareas estimadas para un equipo de 2 devs en 1 semana | 13 |

---

## Documentos Afectados por Prioridad de Refactor

### P0 — Requieren Reescritura Completa

| Documento | Razón |
|-----------|-------|
| **03-repository-strategy.md** | Todo el monorepo con Turborepo, 6 apps separadas, Dockerfiles individuales, CI/CD por servicio |
| **06-api-contracts.md** | Todo el código es Fastify, Stripe, service-to-service HTTP |
| **09-devops-cicd.md** | 8 workflows, Railway, Docker multi-stage, preview deployments |
| **12-roadmap.md** | 12 semanas, 4 fases, completamente inviable para 1 semana |
| **13-task-breakdown.md** | 228 tareas, 434 d/h, EPICs diseñados para 12 semanas |

### P1 — Requieren Refactorización Significativa

| Documento | Razón |
|-----------|-------|
| **04-infrastructure.md** | Railway, BunnyCDN, Upstash, Resend, Stripe — casi todo el mapa de infra está errado |
| **07-hexagonal-architecture.md** | Todo el código usa Fastify, DI container complejo |
| **10-security.md** | Fastify CORS, Stripe webhook verification, service-to-service auth |
| **11-observability.md** | Correlation IDs cross-service, Pino, Sentry — overengineering |

### P2 — Requieren Ajustes

| Documento | Razón |
|-----------|-------|
| **01-overview.md** | Mayormente correcto pero con inconsistencias de deadline y algunos detalles |
| **02-system-architecture.md** | Conceptualmente correcto (monolito modular) pero con infra errada |
| **05-microservices.md** | Ya habla de módulos del monolito, pero con referencias a Fastify/Stripe |
| **08-testing-strategy.md** | Estrategia de testing demasiado ambiciosa para 1 semana |
| **14-future-scalability.md** | Mayormente correcto pero con referencias a infra errada |

---

## Riesgos Actuales

| Riesgo | Severidad | Descripción |
|--------|-----------|-------------|
| **Deadline imposible** | 🔴 CRÍTICO | 1 semana para un MVP que fue estimado en 12 semanas. Hay que reducir scope drásticamente. |
| **Overengineering** | 🔴 CRÍTICO | Turborepo, Docker multi-stage, 8 CI workflows, OpenAPI contracts, Sentry, Pino, Redis, BunnyCDN — todo innecesario |
| **Confusión de stack** | 🟡 ALTA | Los docs mezclan Fastify/Express, Stripe/MercadoPago, Railway/AWS |
| **Arquitectura hexagonal completa** | 🟡 ALTA | Domain/application/infrastructure con value objects, DI containers, ports/adapters para 1 semana |
| **Testing excesivo** | 🟡 ALTA | 100-200 unit tests, integration tests, E2E tests, contract tests — imposible en 1 semana |

---

## Recomendaciones de Simplificación Inmediata

### Lo que DEBE eliminarse del SDD:

1. **Turborepo** → npm scripts simples
2. **BunnyCDN** → R2 directo (egress gratuito)
3. **Upstash Redis** → Rate limiting en memoria
4. **Resend** → Definir si se usa o no (no está en la arquitectura oficial)
5. **Docker multi-stage** → Deploy directo a EC2
6. **Preview deployments** → No necesarios
7. **8 CI workflows** → 1 workflow básico (lint + type-check)
8. **OpenAPI contract-first** → Documentar endpoints inline
9. **Sentry** → Opcional, no prioritario
10. **Pino structured logging** → `console.log`
11. **Correlation IDs** → No necesarios en 1 proceso
12. **Circuit breaker** → No hay comunicación HTTP entre módulos
13. **Service discovery** → No aplica
14. **Docker Compose** → Usar Supabase directamente

### Lo que DEBE simplificarse:

1. **Arquitectura hexagonal** → Simplificar a modules/controllers/services sin value objects complejos
2. **Testing** → Solo tests de happy path para los flujos críticos
3. **Roadmap** → De 12 semanas a 1 semana (7 días)
4. **Task breakdown** → De 228 tareas a ~30 tareas críticas
5. **CI/CD** → De 8 workflows a 1-2 básicos

### Lo que DEBE mantenerse:

1. **Monolito modular** → Correcto, mantener la estructura de módulos
2. **Supabase PostgreSQL** → Correcto
3. **Cloudflare R2** → Correcto
4. **MercadoPago** → Correcto (reemplazar Stripe)
5. **Express** → Correcto (reemplazar Fastify)
6. **JWT auth** → Correcto
7. **Separación de schemas en DB** → Correcto para futura extracción

---

## Plan de Refactorización

1. ✅ Generar este audit report
2. Refactorizar 01-overview.md
3. Refactorizar 02-system-architecture.md
4. Refactorizar 03-repository-strategy.md
5. Refactorizar 04-infrastructure.md
6. Refactorizar 05-microservices.md
7. Refactorizar 06-api-contracts.md
8. Refactorizar 07-hexagonal-architecture.md
9. Refactorizar 08-testing-strategy.md
10. Refactorizar 09-devops-cicd.md
11. Refactorizar 10-security.md
12. Refactorizar 11-observability.md
13. Refactorizar 12-roadmap.md
14. Refactorizar 13-task-breakdown.md
15. Refactorizar 14-future-scalability.md
16. Generar final_architecture_review.md
