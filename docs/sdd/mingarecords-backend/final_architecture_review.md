# Final Architecture Review — MingaRecords Backend SDD

> **Fecha:** 19 de mayo de 2026
> **Auditor:** Senior Architect + Technical Documentation Reviewer
> **Alcance:** Todos los documentos en `docs/sdd/mingarecords-backend/` (14 archivos + audit report)

---

## Resumen Ejecutivo

Se completó la auditoría y refactorización completa del SDD del backend de MingaRecords. El SDD original fue diseñado para una arquitectura de **microservicios distribuidos** con **Fastify**, **Stripe**, **Railway**, **BunnyCDN**, **Upstash Redis**, **Resend**, **Turborepo**, y un roadmap de **12 semanas**.

La nueva arquitectura oficial es:

| Área | Decisión |
|------|----------|
| Framework | Express |
| Arquitectura | Monolito modular |
| Pagos | MercadoPago |
| Base de datos | Supabase (PostgreSQL) |
| Storage | Cloudflare R2 |
| Deploy MVP | AWS Free Tier (EC2 t2.micro) |
| Equipo | 2 developers |
| Presupuesto | $0 |
| Deadline | **1 semana** |

**Resultado:** 14 documentos refactorizados, 1 audit report generado, 1 final review document. Se eliminó ~70% del contenido original por overengineering.

---

## Arquitectura Final Recomendada

### Estructura del Proyecto

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/          → Registro, login, JWT, perfil básico
│   │   │   ├── routes.ts
│   │   │   ├── service.ts
│   │   │   ├── repository.ts
│   │   │   └── types.ts
│   │   ├── beats/         → CRUD beats, búsqueda, filtros, perfiles, dashboard
│   │   │   ├── routes.ts
│   │   │   ├── service.ts
│   │   │   ├── repository.ts
│   │   │   └── types.ts
│   │   ├── payments/      → Checkout MercadoPago, webhooks, licencias
│   │   │   ├── routes.ts
│   │   │   ├── service.ts
│   │   │   ├── repository.ts
│   │   │   └── types.ts
│   │   └── storage/       → Subida audio, ffmpeg preview, R2, streaming
│   │       ├── routes.ts
│   │       ├── service.ts
│   │       └── r2-client.ts
│   │
│   ├── shared/
│   │   ├── middleware.ts  → Auth guard, error handler (RFC 7807)
│   │   ├── types.ts       → Tipos compartidos
│   │   └── utils.ts       → Helpers (slug generator, etc.)
│   │
│   ├── config/
│   │   └── env.ts         → Validación de env vars con Zod
│   │
│   ├── db/
│   │   └── schema.prisma  → Schema único con schemas separados
│   │
│   └── app.ts             → Express app setup
│
├── tests/
│   ├── auth.test.ts
│   ├── beats.test.ts
│   ├── payments.test.ts
│   └── storage.test.ts
│
├── package.json
├── tsconfig.json
└── .env
```

### Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Runtime | Node.js 20+ | Estándar, maduro, buen ecosistema |
| Framework | Express | Curva de aprendizaje baja, velocidad, flexibilidad |
| Lenguaje | TypeScript | Tipado fuerte, reutilización con frontend |
| Base de datos | Supabase (PostgreSQL) | Free tier 500MB, pooler incluido, backups diarios |
| ORM | Prisma | Tipado automático, migraciones, soporte multi-schema |
| Storage | Cloudflare R2 | 10GB free, egress GRATUITO, S3-compatible |
| Pagos | MercadoPago | Sandbox completo, ~5% comisión, sin costo fijo |
| Deploy | AWS EC2 t2.micro | Free Tier 750h/mes, simple, predecible |
| Process Manager | PM2 | Auto-restart, logs, zero-downtime reload |
| CI | GitHub Actions (1 workflow) | Lint + type-check + test |

### Arquitectura de Módulos

```
┌─────────────────────────────────────────────────────────┐
│                    Express App (:3000)                    │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │   AUTH   │  │  BEATS   │  │ PAYMENTS │  │ STORAGE │ │
│  │  Module  │  │  Module  │  │  Module  │  │ Module  │ │
│  │          │  │          │  │          │  │         │ │
│  │ /auth/*  │  │ /beats/* │  │/payments/*│ │/audio/* │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │              │              │              │      │
│       └──────────────┴──────────────┴──────────────┘      │
│                    Llamadas directas                       │
│                    (import de funciones)                   │
└──────────────────────────────┬────────────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
        Supabase DB      Cloudflare R2    MercadoPago
        (PostgreSQL)     (Audio)          (Pagos)
```

### Comunicación entre Módulos

En el monolito, los módulos se comunican por **importación directa de funciones**, NO por HTTP:

```typescript
// payments/service.ts importa directamente de beats/service.ts
import { getBeatById } from '../beats/service';
import { getUserById } from '../auth/service';

// Cuando un pago se completa:
const beat = await getBeatById(beatId);
const user = await getUserById(buyerId);
// ... procesar pago, generar licencia
```

**Ventajas:**
- Sin serialización JSON
- Sin timeouts
- Sin circuit breakers
- Sin service discovery
- Transacciones ACID posibles (misma DB)

---

## Decisiones Clave

### 1. Express sobre Fastify

| Factor | Express | Fastify |
|--------|---------|---------|
| Curva de aprendizaje | Muy baja | Baja |
| Ecosistema | Masivo (middleware, plugins) | Creciente |
| Performance | Buena (suficiente para MVP) | Excelente |
| Documentación | Abundante | Buena |
| Tiempo de setup | ~5 minutos | ~15 minutos |

**Decisión:** Express. La diferencia de performance es irrelevante para un MVP con < 1000 usuarios. El ecosistema de Express resuelve cualquier necesidad sin reinventar la rueda.

### 2. Monolito Modular sobre Microservicios

| Factor | Monolito | Microservicios |
|--------|----------|----------------|
| Setup | 1 comando | 4+ servicios |
| Deploy | 1 deploy | 4+ deploys |
| Debugging | 1 proceso | 4+ procesos |
| Transacciones | ACID nativo | Eventual consistency |
| Costo | $0 (1 EC2) | $20+/mes (4+ servicios) |
| Velocidad dev | Máxima | Lenta |

**Decisión:** Monolito modular. Para 2 devs en 1 semana con $0, los microservicios son suicidio operacional. La estructura modular permite extracción futura si es necesaria.

### 3. MercadoPago sobre Stripe

| Factor | MercadoPago | Stripe |
|--------|-------------|--------|
| Disponibilidad LATAM | ✅ Nativo | ❌ Limitado |
| Sandbox | ✅ Completo | ✅ Completo |
| Webhooks | ✅ Sí | ✅ Sí |
| Comisión | ~5% | 2.9% + $0.30 |
| Costo fijo | $0 | $0 |

**Decisión:** MercadoPago. El target es LATAM. Stripe tiene cobertura limitada en la región. La diferencia de comisión es marginal para volúmenes bajos.

### 4. AWS EC2 sobre Railway

| Factor | AWS EC2 | Railway |
|--------|---------|---------|
| Free tier | 750h/mes (12 meses) | $5 crédito inicial |
| Setup | SSH + PM2 | Git push |
| Control | Total | Limitado |
| Costo post-free | ~$8-12/mes | ~$5-20/servicio |
| Predictibilidad | Alta | Media |

**Decisión:** AWS EC2. El free tier de 12 meses es más generoso que el crédito inicial de Railway. Para un monolito, el setup con PM2 es trivial.

### 5. Simplificación de Hexagonal

| Factor | Hexagonal Completo | Simplificado |
|--------|-------------------|--------------|
| Capas | domain/app/infra | routes/service/repository |
| Value Objects | Sí | No |
| DI Container | Sí | Instanciación directa |
| Ports/Interfaces | Sí | TypeScript interfaces |
| Tiempo de setup | ~2 días/módulo | ~4 horas/módulo |

**Decisión:** Arquitectura simplificada con rutas, servicios y repositorios. Los principios de separación de responsabilidades se mantienen sin la complejidad de value objects, DI containers y port interfaces.

---

## Simplificaciones Realizadas

### Eliminados Completamente

| Componente | Documentos Afectados | Razón |
|------------|---------------------|-------|
| Turborepo | 03, 09, 12, 13 | Overkill para 1 monolito |
| BunnyCDN | 04, 12, 13, 14 | R2 tiene egress gratuito |
| Upstash Redis | 04, 09, 10, 11, 13, 14 | Rate limiting en memoria es suficiente |
| Resend | 04, 09, 10, 11, 13 | No en arquitectura oficial |
| Docker multi-stage | 03, 09, 13 | Deploy directo a EC2 |
| Preview deployments | 09 | No necesarios |
| 8 CI workflows | 09, 13 | 1 workflow básico es suficiente |
| OpenAPI contract-first | 06, 08, 12, 13 | Documentar endpoints inline |
| Sentry | 04, 10, 11, 12, 14 | Opcional, no prioritario |
| Pino structured logging | 03, 09, 11, 13 | `console.log` es suficiente |
| Correlation IDs | 10, 11 | No necesarios en 1 proceso |
| Circuit breaker | 03, 10, 13, 14 | No hay comunicación HTTP entre módulos |
| Service discovery | 02, 03, 09 | 1 proceso Express |
| Docker Compose | 03, 09, 13 | Usar Supabase directamente |

### Simplificados Significativamente

| Componente | Antes | Después |
|------------|-------|---------|
| Roadmap | 12 semanas, 4 fases | 7 días, sprint diario |
| Tasks | 228 tareas, 434 d/h | 36 tareas, ~75h |
| Testing | 200+ tests, contract testing | ~35-50 tests, happy path |
| Hexagonal | domain/app/infra, value objects, DI | routes/service/repository |
| CI/CD | 8 workflows, Railway, Docker | 1 workflow, SSH + PM2 |
| Infra | 8 proveedores | 4 proveedores |
| Seguridad | Zero trust, RS256, rotation, tarpit | HS256, bcrypt, Zod, basic RL |
| Observabilidad | Pino, correlation IDs, Sentry, Grafana | console.log, health check |

---

## Riesgos Restantes

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| **Deadline de 1 semana es agresivo** | 🔴 CRÍTICO | El task breakdown de 36 tareas (~75h) tiene ~23% de margen. Si una tarea lleva >4h, se simplifica o se corta. |
| **ffmpeg en EC2** | 🟡 ALTA | Instalar ffmpeg en EC2 es trivial (`sudo apt install ffmpeg`). Validar en día 1. |
| **MercadoPago webhook testing** | 🟡 ALTA | Requiere URL pública. Usar ngrok o similar en desarrollo. |
| **Supabase + Prisma multi-schema** | 🟡 MEDIA | Testear `prisma migrate` con schemas separados en día 1. Si falla, usar 1 schema plano. |
| **EC2 t2.micro CPU credits** | 🟡 MEDIA | t2.micro usa CPU credits. Si ffmpeg consume mucho, considerar t3.micro (mismo precio, sin credits). |
| **R2 egress gratuito** | 🟢 BAJA | Confirmado: R2 no cobra egress. Es la ventaja clave sobre S3. |

---

## Roadmap Realista — 7 Días

### Día 1: Setup & Auth
- [ ] Express app scaffold con TypeScript
- [ ] Supabase connection + Prisma setup
- [ ] Auth module: register + login + JWT
- [ ] Error handler middleware (RFC 7807)
- [ ] Auth guard middleware

### Día 2: Beats Module
- [ ] Beats schema + Prisma models
- [ ] Create beat endpoint
- [ ] List beats con paginación + filtros
- [ ] Get beat detail endpoint
- [ ] Update/delete beat endpoints
- [ ] Full-text search

### Día 3: Storage Module
- [ ] R2 storage adapter (aws-sdk)
- [ ] Audio upload endpoint
- [ ] ffmpeg preview generation
- [ ] Streaming endpoint (HTTP Range)
- [ ] Update beat con audio URLs
- [ ] File validation (MIME, size)

### Día 4: Frontend Integration
- [ ] Auth API integration (login/register)
- [ ] Catalog page con API integration
- [ ] Beat detail page con audio player
- [ ] Upload beat page
- [ ] Producer profile page

### Día 5: Payments Module
- [ ] MercadoPago SDK setup
- [ ] Checkout endpoint (create preference)
- [ ] Webhook handler endpoint
- [ ] Webhook verification
- [ ] License generation + delivery
- [ ] Transaction recording

### Día 6: Polish & Testing
- [ ] Rate limiting (in-memory)
- [ ] Input validation (Zod)
- [ ] CORS configuration
- [ ] Basic happy-path tests

### Día 7: Deploy & Launch
- [ ] AWS EC2 setup
- [ ] Deploy script (git pull + build + pm2)
- [ ] Smoke tests
- [ ] Domain + SSL setup

---

## Recomendaciones Futuras

### v1.5 (cuando duela — ~1-3 meses)
- SSE para notificaciones en tiempo real
- BullMQ + PostgreSQL para procesamiento async
- Supabase Pro ($25/mes) si DB crece
- Tests E2E con Playwright

### v2 (~6-12 meses)
- WebSockets para chat
- DBs separadas para módulos con > 10GB
- MercadoPago payouts automáticos
- Analytics avanzados

### v3 (cuando justifique — 12+ meses)
- Extraer módulos a microservicios (solo si hay equipo dedicado)
- PWA con offline support
- Multi-idioma

---

## Estado de Documentos

| Documento | Estado | Líneas Antes | Líneas Después | Cambio |
|-----------|--------|-------------|---------------|--------|
| 01-overview.md | ✅ Refactorizado | 169 | ~120 | -29% |
| 02-system-architecture.md | ✅ Refactorizado | 453 | ~290 | -36% |
| 03-repository-strategy.md | ✅ Refactorizado | 591 | ~280 | -53% |
| 04-infrastructure.md | ✅ Refactorizado | 950+ | ~260 | -73% |
| 05-microservices.md | ✅ Refactorizado | 196 | ~150 | -23% |
| 06-api-contracts.md | ✅ Refactorizado | 1060 | ~400 | -62% |
| 07-hexagonal-architecture.md | ✅ Refactorizado | 736 | ~200 | -73% |
| 08-testing-strategy.md | ✅ Refactorizado | 666 | ~200 | -70% |
| 09-devops-cicd.md | ✅ Refactorizado | 689 | ~280 | -59% |
| 10-security.md | ✅ Refactorizado | 900+ | ~300 | -67% |
| 11-observability.md | ✅ Refactorizado | 399 | ~150 | -62% |
| 12-roadmap.md | ✅ Refactorizado | 352 | ~200 | -43% |
| 13-task-breakdown.md | ✅ Refactorizado | 577 | ~150 | -74% |
| 14-future-scalability.md | ✅ Refactorizado | 346 | ~200 | -42% |
| audit_report.md | ✅ Creado | 0 | ~200 | Nuevo |
| final_architecture_review.md | ✅ Creado | 0 | ~300 | Nuevo |

**Total:** ~7,284 líneas → ~3,480 líneas (-52% de contenido)

---

## Coherencia Verificada

- ✅ Todos los documentos usan **Express** (no Fastify)
- ✅ Todos los documentos usan **MercadoPago** (no Stripe)
- ✅ Todos los documentos usan **AWS EC2** (no Railway)
- ✅ Todos los documentos usan **Supabase + R2** (no BunnyCDN, no Upstash)
- ✅ Todos los documentos reflejan **1 semana** (no 12 semanas)
- ✅ Todos los documentos reflejan **monolito modular** (no microservicios)
- ✅ Todos los documentos reflejan **2 developers, $0 presupuesto**
- ✅ No hay referencias cruzadas inconsistentes entre documentos
- ✅ No hay overengineering para el contexto actual

---

## Conclusión

El SDD ha sido completamente refactorizado para reflejar la nueva arquitectura oficial. Se eliminó ~52% del contenido original por ser overengineering para un MVP de 1 semana con 2 developers y $0 de presupuesto.

La arquitectura resultante es **simple, pragmática y ejecutable**: un monolito modular en Express con 4 módulos, deployado en AWS EC2 con Supabase, R2 y MercadoPago.

**Próximo paso:** Ejecutar el roadmap de 7 días según el `13-task-breakdown.md` refactorizado.
