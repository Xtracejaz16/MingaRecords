# 12 — Roadmap Técnico

> **Versión:** 1.0 — **Fecha:** 12 de mayo de 2026
> **Equipo:** 2 developers full-stack, 12 semanas para MVP, presupuesto mensual ~$17

---

## 12.1 Resumen de Fases

```
FASE 0       FASE 1          FASE 2         FASE 3         FASE 4
Foundation   MVP Core        Payments       Polish         Scale
─────────    ─────────       ────────       ──────         ─────
Semana 1-2   Semana 3-8      Semana 9-10    Semana 11-12   Mes 4 en
             ▲                                               adelante
             └─ Primer beat subido y escuchable (Sem 5)
                                      ▲
                                      └─ Primera venta real (Sem 10)
```

---

## 12.2 MVP Definition: What's In / What's Out

### ✅ IN (MVP — 12 semanas)

| Feature | Prioridad | Justificación |
|---------|-----------|---------------|
| Registro/login con email + password + roles | P0 | Sin usuarios no hay plataforma |
| Catálogo público con filtros y búsqueda | P0 | Core product: beats visibles |
| Subida de beat (WAV/MP3) con metadata | P0 | Core product: beats subibles |
| Preview de 30s con streaming HTTP Range | P0 | UX crítica: escuchar antes de comprar |
| Perfil público de productor | P0 | Cada productor necesita su URL |
| Dashboard de productor (ventas, plays, ganancias) | P0 | Productor necesita ver resultados |
| Checkout con Stripe | P1 | Monetización core (depende de Catálogo + Auth) |
| Entrega automática de licencia post-pago | P1 | Sin esto no hay valor para el comprador |
| Emails transaccionales (verificación, licencia) | P1 | Seguridad básica y UX post-compra |
| Rate limiting básico por IP | P1 | Protección contra abuso |

### ❌ OUT (v2+)

| Feature | Cuándo | Razón para postergar |
|---------|--------|----------------------|
| Chat en tiempo real comprador ↔ productor | v2 (fase 4) | Requiere WebSockets, no crítico para primera venta |
| Subastas / ofertas por beats | v2+ | Dominio complejo, no valida MVP |
| Playlists / colecciones de beats | v2 | Nice-to-have, no bloquea ventas |
| Analytics avanzados | v2 | Datos agregados cada 24h es suficiente para MVP |
| App móvil nativa | v3 | PWA first; app nativa cuando haya > 10k usuarios |
| Notificaciones push | v2 | Email es suficiente para MVP |
| Procesamiento de audio avanzado (stem separation) | v3 | Requiere GPU/compute pesado, no viable con costo $0 |
| Programa de afiliados / referidos | v3 | Necesita revenue estable antes de compartir |

---

## 12.3 Fase 0: Foundation (Semanas 1-2)

**Objetivo**: Todo el scaffolding que permite a los 2 devs escribir código de features sin fricción.

### Prioridad: P0 (bloquea todo lo demás)

| Semana | Entregable | Owner | Hitos |
|--------|-----------|-------|-------|
| 1 | Turborepo funcionando con `pnpm dev` levantando 4 servicios vacíos | Yair + Sebas | `pnpm dev` exitoso con 4 puertos respondiendo `200 OK` |
| 1 | `@mingarecords/shared` package con tipos, middlewares (JWT, error handler RFC 7807, logger Pino) | Sebas | Package usable desde los 4 servicios |
| 1 | Docker Compose con PostgreSQL 16 + Redis 7 | Yair | `docker compose up` → DB y Redis listos |
| 1 | Prisma schema base con schemas `auth`, `catalog`, `streaming`, `payments` | Sebas | `prisma migrate dev` crea las 4 schemas vacíos |
| 1 | CI pipeline en GitHub Actions (lint + type-check + test + build) | Yair | PR merge bloqueado si CI falla |
| 2 | Config de ESLint + Prettier + tsconfig compartida | Sebas | Todo el código pasa lint automático |
| 2 | Dockerfiles multi-stage para los 4 servicios | Yair | `docker build` exitoso para cada servicio |
| 2 | Deploy pipelines (auth, catalog, streaming, payments) con paths-filter | Yair | Push a main → deploy automático a staging |
| 2 | `.env` validation con Zod en todos los servicios (crash al iniciar si falta variable) | Sebas | Servicio no arranca sin todas las env vars |
| 2 | Health check endpoint en cada servicio (`/health`) | Sebas | Railway verifica health antes de activar deploy |
| 2 | Setup de Railway (4 proyectos o 1 proyecto con 4 servicios) + Supabase + R2 + Upstash + Resend | Yair + Sebas | Credenciales funcionando en staging |

### Dependencias entre Fase 0

```
Docker Compose ─────────────────────────────────────► Todos los servicios
Turborepo + pnpm ───────────────────────────────────► Todos los servicios
@mingarecords/shared ───────────────────────────────► Todos los servicios
CI pipeline ────────────────────────────────────────► Bloquea merge a main
Deploy pipelines ───────────────────────────────────► Bloquea staging
Prisma base ────────────────────────────────────────► Auth, Catalog, Payments
Health checks ──────────────────────────────────────► Railway deploy
```

### Riesgos Fase 0

- **Railway + Turborepo + Docker**: la integración monorepo → Docker build en CI puede tomar más tiempo del esperado. **Mitigación**: template de Dockerfile validado en local antes de CI.
- **Supabase free tier con 4 schemas**: confirmar que Prisma funciona con múltiples schemas en Supabase. **Mitigación**: test en día 1 de setup.

---

## 12.4 Fase 1: MVP Core (Semanas 3-8)

**Objetivo**: Un productor puede subir un beat, el mundo puede escucharlo. Un artista puede navegar el catálogo.

### Semana 3-4: Auth Service

| Día | Entregable | Prioridad |
|-----|-----------|-----------|
| 1-2 | Endpoint `POST /api/v1/auth/register` (email, password, role) | P0 |
| 2-3 | Endpoint `POST /api/v1/auth/login` → JWT access + refresh (httpOnly cookie) | P0 |
| 3 | Middleware JWT guard (compartido desde `@mingarecords/shared`) | P0 |
| 4 | Endpoint `GET /api/v1/auth/me` (perfil del usuario autenticado) | P0 |
| 4-5 | Endpoint `PATCH /api/v1/auth/me` (actualizar perfil) | P1 |
| 5 | Email verification flow (Resend: envía email, verifica token) | P1 |
| 6 | Password reset flow (solicitud + email + nueva password) | P1 |
| 7 | Tests unitarios + integración (coverage > 80%) | P1 |
| 8 | Buffer para ajustes y edge cases | — |

### Semana 5-6: Catalog Service + Streaming Service (en paralelo)

> **CRÍTICO**: Catalog y Streaming deben desarrollarse en paralelo porque Catalog necesita que Streaming exista para las URLs de audio. Yair toma Catalog, Sebas toma Streaming.

| Día | Catalog (Yair) | Streaming (Sebas) | Prioridad |
|-----|---------------|-------------------|-----------|
| 1-2 | `POST /api/v1/beats` (solo producer) | `POST /api/v1/audio/upload` (recibe WAV/MP3, valida MIME real con magic bytes) | P0 |
| 2-3 | `GET /api/v1/beats` (paginado + filtros) | Integración con ffmpeg: genera preview 30s MP3 192kbps con fade out | P0 |
| 3-4 | `GET /api/v1/beats/:id` (detalle) | Subida a Cloudflare R2 (original + preview) | P0 |
| 4 | `GET /api/v1/beats/:slug` (URL amigable) | `GET /api/v1/audio/stream/:beatId` (HTTP Range) | P0 |
| 4-5 | Búsqueda full-text (PostgreSQL `tsvector`) | Callback a Catalog: `PATCH /api/v1/beats/:id` con URLs de audio | P0 |
| 5 | `GET /api/v1/producers/:id` (perfil público) | Marca de agua sutil en preview (opcional, si ffmpeg lo permite) | P1 |
| 5-6 | `GET /api/v1/producers/:slug` (URL amigable) | Cleanup de archivos al soft-delete del beat | P1 |
| 6-7 | Dashboard del productor (stats agregadas) | BunnyCDN pull zone configurada apuntando a R2 | P1 |
| 7-8 | Tests + documentación OpenAPI .yaml | Tests + ajustes + OpenAPI .yaml | P1 |

### Semana 7-8: Frontend Integration + E2E Tests

| Día | Entregable | Owner |
|-----|-----------|-------|
| 1-3 | Integrar frontend React con Auth (login, registro, JWT storage) | Yair |
| 2-4 | Página de catálogo con filtros y búsqueda | Sebas |
| 3-5 | Página de subida de beat (formulario + upload de audio) | Yair |
| 4-6 | Página de detalle de beat con reproductor de preview | Sebas |
| 5-7 | Perfil público de productor | Sebas |
| 6-8 | Tests E2E con Playwright (flujo principal: registro → login → subir beat → escuchar preview) | Yair + Sebas |

### Hito Fase 1: "Primer Beat Subido y Escuchable" (fin Semana 5)

Un productor beta (Sebas o Yair) puede:
1. Registrarse en la plataforma
2. Subir un beat WAV con metadata
3. Ver su beat en el catálogo público
4. Escuchar el preview de 30s en el navegador

---

## 12.5 Fase 2: Payments (Semanas 9-10)

**Objetivo**: Un artista puede comprar un beat y recibir su licencia. MingaRecords genera su primer dólar.

### Semana 9: Stripe Integration

| Día | Entregable | Owner |
|-----|-----------|-------|
| 1-2 | Stripe account configurada (productos, webhooks, API keys) | Yair + Sebas |
| 1-3 | Endpoint `POST /api/v1/payments/checkout` (crea sesión Stripe) | Sebas |
| 2-4 | Endpoint `POST /api/v1/payments/webhooks/stripe` (recibe eventos) | Sebas |
| 3-4 | Verificación de firma webhook (Stripe signature) | Sebas |
| 4-5 | `payment_intent.succeeded` → genera licencia, notifica Catalog, envía email (Resend) | Sebas |
| 5-6 | `payment_intent.failed` → log de error, sin entrega de licencia | Sebas |
| 6-7 | Tabla `transactions` y `licenses` en schema `payments` | Yair |
| 7-8 | Tests unitarios (mock Stripe SDK, mock webhook signatures) | Yair |

### Semana 10: Frontend + End-to-End Purchase Flow

| Día | Entregable | Owner |
|-----|-----------|-------|
| 1-2 | Botón "Comprar" en página de detalle de beat → redirige a Stripe Checkout | Yair |
| 1-2 | Página de "Compra Exitosa" post-Stripe (success_url) | Yair |
| 2-3 | Página de "Compra Cancelada" (cancel_url) | Yair |
| 3-4 | Dashboard de productor muestra ingresos reales | Yair |
| 3-5 | Historial de compras en perfil de artista | Sebas |
| 4-6 | Test E2E completo: browse → preview → buy → receive license email | Yair + Sebas |
| 6-7 | Stripe test mode → live mode migration checklist | Sebas |
| 7-8 | Buffer: ajustes de UX, edge cases de pago, email templates | Yair + Sebas |

### Hito Fase 2: "Primera Venta Real" (fin Semana 10)

Un artista real (o beta tester) puede:
1. Navegar el catálogo
2. Escuchar un preview
3. Pagar con tarjeta de crédito real via Stripe
4. Recibir email con licencia y link de descarga
5. Productor ve la venta en su dashboard con la ganancia neta

---

## 12.6 Fase 3: Polish (Semanas 11-12)

**Objetivo**: MVP listo para producción. Pulido, seguridad reforzada, documentación lista.

| Semana | Entregable | Prioridad | Owner |
|--------|-----------|-----------|-------|
| 11 | Rate limiting en todos los endpoints públicos (Upstash Redis sliding window) | P0 | Sebas |
| 11 | Validación de audio server-side: magic bytes, tamaño máx 100MB, duración 1-600s | P0 | Yair |
| 11 | CORS headers correctos (solo `mingarecords.com` y `*.vercel.app`) | P0 | Yair |
| 11 | Sanitización de inputs (XSS, SQL injection via Prisma parametrizado) | P1 | Sebas |
| 11 | Manejo de errores consistente RFC 7807 en TODOS los endpoints | P1 | Yair |
| 11 | OpenAPI .yaml final para los 4 servicios (generar desde código o manual) | P1 | Sebas |
| 12 | Tests E2E completos (happy path + edge cases + error states) | P0 | Yair + Sebas |
| 12 | Monitoreo básico: Railway logs + health check alerts | P1 | Sebas |
| 12 | `README.md` con "cómo correr en local" y "cómo deployar" | P1 | Yair |
| 12 | Lanzamiento MVP: `v1.0.0` tag, deploy a producción, dominio `mingarecords.com` live | P0 | Yair + Sebas |

---

## 12.7 Fase 4: Scale (Mes 4 en adelante)

**Objetivo**: Crecer de 100 a 10,000 usuarios sin que la plataforma explote. Iterar sobre feedback real.

### Mes 4: Post-Launch Stabilization

| Tarea | Disparador | Prioridad |
|-------|-----------|-----------|
| Monitoreo de errores en producción (Sentry free tier) | Día 1 post-launch | P0 |
| Hotfixes de bugs reportados por usuarios | Según aparezcan | P0 |
| Optimización de queries lentas (EXPLAIN ANALYZE) | Queries > 500ms | P1 |
| CDN cache headers tuning (Cache-Control en BunnyCDN) | Latencia de audio > 2s | P1 |
| Ajuste de rate limits según tráfico real | Según datos | P2 |

### Mes 5-6: Features v1.1

| Feature | Justificación |
|---------|---------------|
| PayPal como alternativa de pago | Algunos compradores solo usan PayPal |
| Recuperación de beats eliminados (soft-delete → restore) | Productores piden "desarchivar" |
| Estadísticas avanzadas (plays por día, ventas por mes, gráficos) | Feedback #1 de productores |
| Optimización de imágenes: avatares productor (Cloudflare Images o R2) | Mejora visual de perfiles |
| Email de "nuevo beat de productor que seguís" (si implementamos follows) | Engagement |

### Mes 7-12: Evaluar Separación y Escalado

Decisiones a evaluar según métricas reales (ver File 14 para thresholds detallados):

- ¿Separar schemas de DB a DBs independientes?
- ¿Introducir cola de mensajes para comunicación async?
- ¿WebSockets para notificaciones en tiempo real?
- ¿Migrar de freemium a paid en algún proveedor?

---

## 12.8 Critical Path Analysis

```
CAMINO CRÍTICO (lo que determina la fecha de lanzamiento)

Fase 0 ──────────────────────────────────────────────────────────► 2 semanas
  └─ Turborepo + CI/CD + Docker ──► Bloquea todo desarrollo
      Si falla: +1 semana de retraso
  
Fase 1 ──────────────────────────────────────────────────────────► 6 semanas
  └─ Auth Service (Semanas 3-4) ──► Bloquea Catalog y Frontend
      └─ Catalog + Streaming (Semanas 5-6) ──► Bloquea Payments
          └─ Frontend Integration (Semanas 7-8) ──► Bloquea E2E tests
  
Fase 2 ──────────────────────────────────────────────────────────► 2 semanas
  └─ Stripe Integration (Semana 9) ──► Bloquea frontend de pagos
      └─ Frontend Purchase Flow (Semana 10) ──► Primer venta
          Dependencia externa: Stripe aprobación de cuenta live

Fase 3 ──────────────────────────────────────────────────────────► 2 semanas
  └─ Security + Rate Limiting (Semana 11) ──► Bloquea lanzamiento
      └─ E2E Tests + Launch (Semana 12) ──► MVP LIVE 🚀

CRITICAL PATH TOTAL: 12 semanas
```

### Dependencias Externas (fuera de nuestro control)

| Dependencia | Impacto si falla | Plan B |
|-------------|-----------------|--------|
| **Stripe approval** (cuenta live) | Bloquea Fase 2 completa | PayPal en paralelo; empezar integración PayPal semana 8 si Stripe no responde |
| **Supabase outage** | Toda la plataforma caída | Migrar a Railway PostgreSQL (~$10/mes) en < 4 horas |
| **Railway downtime** | Servicios inaccesibles | Deploy estático en Vercel (frontend sigue funcionando con estados de error) |
| **Cloudflare R2 outage** | Streaming caído, uploads fallan | Backblaze B2 (compatible con S3 API, $0 de egress) como fallback |
| **Resend outage** | Emails no se envían | Cola de emails fallidos en Redis; reintentar cada 5 min por 24h |

---

## 12.9 Milestones con Fechas

| Milestone | Fecha estimada | Entregable verificable |
|-----------|---------------|------------------------|
| **M0: Foundation Ready** | Semana 2 (Día 14) | `pnpm dev` levanta 4 servicios. CI verde. Deploy a staging funciona. |
| **M1: First Beat Uploaded** | Semana 5 (Día 35) | Un WAV se sube, se procesa, y su preview se streamea en < 2s. |
| **M2: Catalog Browsable** | Semana 6 (Día 42) | 10+ beats en catálogo, búsqueda con filtros < 500ms. |
| **M3: First Payment** | Semana 10 (Día 70) | Pago real (Stripe test mode), licencia entregada por email. |
| **M4: MVP Launch** | Semana 12 (Día 84) | `mingarecords.com` live. Flujo E2E completo funcional. |
| **M5: 100 Users** | Mes 4 (Día 120) | 100 usuarios registrados, 50 beats subidos, 10 ventas. |
| **M6: 1000 Users** | Mes 8 (Día 240) | 1000 usuarios, revenue mensual > $500. Evaluar escalado. |

### Probabilidad de Cumplir Fechas

| Milestone | Probabilidad | Riesgo principal |
|-----------|-------------|-----------------|
| M0 | 85% | Turborepo + Docker setup puede tomar 1 semana extra |
| M1 | 80% | ffmpeg en Docker puede tener issues de dependencias |
| M2 | 90% | Búsqueda full-text es PostgreSQL nativo, bajo riesgo |
| M3 | 75% | Stripe webhook testing requiere URL pública (ngrok o similar) |
| M4 | 75% | Pulido final siempre toma más de lo estimado |

**Conclusión**: 12 semanas es agresivo pero alcanzable para 2 devs full-stack dedicados. El mayor riesgo es el setup inicial (Fase 0) y Stripe (dependencia externa). Con 15 semanas hay margen de holgura del 25%.

---

## 12.10 Future Improvements (Backlog Priorizado)

### v1.1 (Mes 4-5, post-lanzamiento)

| # | Feature | Valor | Esfuerzo |
|---|---------|-------|----------|
| 1 | PayPal integration | Alto — algunos compradores solo PayPal | Medio (1 semana) |
| 2 | Beat stats avanzadas (plays/día, gráficos) | Alto — lo más pedido por productores | Medio (1 semana) |
| 3 | Soft-delete + restore de beats | Medio — evita pérdida de datos | Bajo (3 días) |
| 4 | Avatar de productor (upload + crop) | Medio — completa el perfil | Bajo (3 días) |

### v2.0 (Mes 6-9)

| # | Feature | Valor | Esfuerzo |
|---|---------|-------|----------|
| 1 | Chat comprador ↔ productor (WebSockets) | Alto — cierra ventas | Alto (3 semanas) |
| 2 | Playlists / colecciones | Medio — engagement | Medio (2 semanas) |
| 3 | Analytics avanzados (fuentes de tráfico, conversión) | Medio — optimizar revenue | Alto (2 semanas) |
| 4 | Notificaciones push (web push API) | Medio — retención | Medio (1 semana) |
| 5 | Licencias personalizables por productor | Alto — diferenciación | Medio (1 semana) |

### v3.0 (Mes 12+)

| # | Feature | Valor | Esfuerzo |
|---|---------|-------|----------|
| 1 | PWA con soporte offline (caché de beats comprados) | Alto — movilidad | Alto (3 semanas) |
| 2 | Programa de afiliados (10% comisión por referral) | Alto — crecimiento | Alto (4 semanas) |
| 3 | Subastas / ofertas por beats | Medio — revenue adicional | Muy alto (6 semanas) |
| 4 | Multi-idioma (español + inglés minimum) | Medio — audiencia global | Medio (2 semanas) |

---

## 12.11 Principio de Priorización

Dado que somos solo 2 devs, cada feature debe pasar este filtro:

```
¿Esta feature nos acerca a la PRIMERA VENTA?
  ├── SÍ → ¿Bloquea algo más? → SÍ → P0 (hacer AHORA)
  │                           → NO → P1 (esta semana)
  └── NO → ¿Es necesaria para que un usuario no se vaya? → SÍ → P2 (este mes)
                                                          → NO → P3 (backlog)
```

Si una tarea P0 o P1 lleva más de 3 días sin terminar, se revalúa si se puede simplificar o partir en subtareas más chicas.
