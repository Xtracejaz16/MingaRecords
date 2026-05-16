# 05 — Microservicios

> **Versión:** 1.0 — **Fecha:** 12 de mayo de 2026

---

## 5.1 Principios de Diseño de Microservicios

| Principio | Qué significa |
|-----------|---------------|
| **Single Responsibility** | Un servicio, una responsabilidad. Si un servicio hace dos cosas distintas, es dos servicios. |
| **Autonomía de Deploy** | Cada servicio se deploya independientemente. Si cambio Auth, no necesito redeployar Catalog. |
| **Aislamiento de Datos** | Cada servicio es dueño de su schema. Ningún otro servicio lee/escribe directamente en sus tablas. |
| **API como Contrato** | La comunicación es solo por HTTP con contratos OpenAPI. No hay imports directos entre servicios. |
| **Graceful Degradation** | Si un servicio cae, los demás siguen funcionando con datos cacheados o estados fallback. |
| **MVP ≤ 4 servicios** | No creamos más de 4 servicios en MVP. La complejidad operacional de 4 servicios ya es el límite para 2 devs. |

---

## 5.2 Lista Completa de Microservicios

### 5.2.1 Auth Service (MVP)

| Atributo | Detalle |
|----------|---------|
| **Puerto** | `:4001` |
| **Framework** | Fastify |
| **Responsabilidad** | Identidad, autenticación, gestión de sesión, perfil básico de usuario |
| **Endpoints** | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/verify-email`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/me`, `PATCH /auth/me`, `GET /users/:id` |
| **Persistencia** | PostgreSQL schema `auth` (users, refresh_tokens) |
| **Dependencias externas** | Supabase (DB), Upstash Redis (rate limiting), Resend (emails) |
| **Consumido por** | Todos los servicios (JWT validation local, no HTTP call), Payments (GET /users/:id para email del comprador) |
| **Criticidad** | 🔴 CRÍTICA — Si Auth cae, nadie se registra ni loguea |
| **Escalabilidad esperada** | Baja: ~100 req/min en MVP. No necesita auto-scaling hasta > 10,000 usuarios |
| **Escalado horizontal** | Stateless — se pueden correr múltiples instancias detrás de un load balancer |
| **Estado** | Stateless (JWT auto-contenido, refresh tokens en DB) |
| **Recovery** | Si cae, los servicios que ya validaron JWT siguen funcionando hasta que expire el token (1h) |

### 5.2.2 Catalog Service (MVP)

| Atributo | Detalle |
|----------|---------|
| **Puerto** | `:4002` |
| **Framework** | Fastify |
| **Responsabilidad** | Gestión del catálogo de beats, búsqueda, filtrado, perfiles públicos, dashboard |
| **Endpoints** | `GET /beats`, `GET /beats/:id`, `POST /beats`, `PATCH /beats/:id`, `DELETE /beats/:id`, `PATCH /beats/:id/audio-ready`, `PATCH /beats/:id/sold`, `GET /genres`, `GET /producers/:id`, `GET /producers/:id/beats`, `GET /dashboard` |
| **Persistencia** | PostgreSQL schema `catalog` (beats, genres, producer_profiles) |
| **Dependencias externas** | Supabase (DB), Upstash Redis (cache), Streaming Service (HTTP) |
| **Consumido por** | Payments (GET /beats/:id para metadata de checkout), Streaming (PATCH /beats/:id/audio-ready), Frontend (todos los endpoints públicos) |
| **Criticidad** | 🔴 CRÍTICA — Si Catalog cae, no hay catálogo visible |
| **Escalabilidad esperada** | Media-Alta: endpoint más consultado. Necesita cache agresivo (Redis) y posiblemente read replicas en v2 |
| **Escalado horizontal** | Stateless — múltiples instancias con cache compartido (Redis) |
| **Estado** | Stateless (datos en DB, cache en Redis) |
| **Recovery** | Si cae, el frontend muestra "servicio no disponible" con cache local del último request exitoso |

### 5.2.3 Streaming Service (MVP)

| Atributo | Detalle |
|----------|---------|
| **Puerto** | `:4003` |
| **Framework** | Fastify |
| **Responsabilidad** | Subida, procesamiento, almacenamiento y streaming de audio |
| **Endpoints** | `POST /audio/upload/:beatId`, `GET /audio/stream/:beatId`, `GET /audio/preview/:beatId`, `GET /audio/download/:licenseId`, `DELETE /audio/:beatId` |
| **Persistencia** | PostgreSQL schema `streaming` (audio_files), Cloudflare R2 (archivos de audio) |
| **Dependencias externas** | Cloudflare R2 (storage), BunnyCDN (CDN), ffmpeg (procesamiento), Catalog Service (HTTP callback) |
| **Consumido por** | Catalog (callback audio-ready), Frontend (streaming + preview), Payments (download de licencia) |
| **Criticidad** | 🔴 CRÍTICA — Si Streaming cae, no se pueden subir ni escuchar beats |
| **Escalabilidad esperada** | Alta: streaming de audio es el endpoint más pesado. ffmpeg consume CPU. BunnyCDN descarga la mayor parte del tráfico |
| **Escalado horizontal** | Parcialmente stateless — el upload requiere acceso al filesystem local para ffmpeg. Se necesita shared volume o procesamiento en un solo nodo |
| **Estado** | Semi-stateless (archivos temporales durante procesamiento, luego se suben a R2) |
| **Recovery** | Si cae durante upload, el archivo queda en estado `processing`. El usuario puede reintentar. Si cae durante streaming, BunnyCDN cachea el preview, mitigando el impacto |

### 5.2.4 Payments Service (MVP)

| Atributo | Detalle |
|----------|---------|
| **Puerto** | `:4004` |
| **Framework** | Fastify |
| **Responsabilidad** | Checkout, procesamiento de pagos, entrega de licencias, historial de transacciones |
| **Endpoints** | `POST /checkout`, `POST /webhooks/stripe`, `GET /transactions`, `GET /transactions/:id`, `POST /refunds/:transactionId`, `GET /earnings` |
| **Persistencia** | PostgreSQL schema `payments` (transactions, licenses) |
| **Dependencias externas** | Stripe (pagos), Catalog Service (HTTP: GET beat metadata, PATCH sold), Auth Service (HTTP: GET user email), Resend (email de licencia) |
| **Consumido por** | Frontend (checkout, transactions, earnings), Stripe (webhook), Catalog (PATCH /beats/:id/sold) |
| **Criticidad** | 🔴 CRÍTICA — Si Payments cae, no hay revenue. Pero el resto de la plataforma sigue funcionando |
| **Escalabilidad esperada** | Baja: ~10 req/min en MVP. Webhooks de Stripe son el tráfico principal |
| **Escalado horizontal** | Stateless — múltiples instancias, pero Stripe webhooks deben llegar a una sola URL (Railway maneja el routing) |
| **Estado** | Stateless (datos en DB) |
| **Recovery** | Si cae durante webhook, Stripe reenvía el evento (hasta 72h con retries). Idempotencia por event_id garantiza que no se procesa dos veces |

### 5.2.5 User Service (v2 — NO MVP)

| Atributo | Detalle |
|----------|---------|
| **Puerto** | `:4005` |
| **Framework** | Fastify |
| **Responsabilidad** | Perfiles extendidos, settings, follow system, actividad |
| **Endpoints** | `GET /users/:id`, `PATCH /users/:id`, `POST /users/:id/avatar`, `POST /users/:id/follow`, `DELETE /users/:id/follow`, `GET /users/:id/followers`, `GET /users/:id/following`, `GET /users/:id/activity` |
| **Persistencia** | PostgreSQL schema `users` (user_profiles, follows, activity_log) |
| **Dependencias externas** | Supabase (DB), Cloudflare R2 (avatars), Catalog Service (beats del usuario) |
| **Criticidad** | 🟡 MEDIA — Si cae, los perfiles no se muestran, pero el catálogo y pagos siguen funcionando |
| **Escalabilidad esperada** | Media: profiles se leen mucho, se escriben poco |
| **Trigger de creación** | Cuando Auth Service tenga > 15 endpoints o el perfil crezca a features sociales (follow, likes, feed) |

### 5.2.6 Notification Service (v2 — NO MVP)

| Atributo | Detalle |
|----------|---------|
| **Puerto** | `:4006` |
| **Framework** | Fastify |
| **Responsabilidad** | Notificaciones multicanal (email, push, in-app), templates, preferencias |
| **Endpoints** | `POST /events`, `POST /templates`, `GET /templates/:id`, `PATCH /templates/:id`, `GET /users/:id/preferences`, `PATCH /users/:id/preferences`, `GET /users/:id/notifications` |
| **Persistencia** | PostgreSQL schema `notifications` (notification_templates, notification_log, user_preferences) |
| **Dependencias externas** | Resend (emails), Web Push API (push notifications), Upstash Redis (cola de eventos, rate limiting) |
| **Criticidad** | 🟢 BAJA — Si cae, las notificaciones se pierden pero no hay pérdida de datos (se reintentan) |
| **Escalabilidad esperada** | Baja-Media: eventos esporádicos, no tráfico constante |
| **Trigger de creación** | Cuando necesitemos más de 3 tipos de notificación o notificaciones push |

---

## 5.3 Matriz de Servicios — Resumen

| Servicio | MVP? | Puertos | DB Schema | Estado | Escalabilidad | Criticidad |
|----------|------|---------|-----------|------|---------------|------------|
| Auth | ✅ | :4001 | `auth` | Stateless | Baja | 🔴 Crítica |
| Catalog | ✅ | :4002 | `catalog` | Stateless | Alta | 🔴 Crítica |
| Streaming | ✅ | :4003 | `streaming` | Semi-stateless | Alta | 🔴 Crítica |
| Payments | ✅ | :4004 | `payments` | Stateless | Baja | 🔴 Crítica |
| User | ❌ v2 | :4005 | `users` | Stateless | Media | 🟡 Media |
| Notification | ❌ v2 | :4006 | `notifications` | Stateless | Baja | 🟢 Baja |

---

## 5.4 Justificación de Servicios MVP

### ¿Por qué 4 servicios y no 1 monolito?

| Razón | Detalle |
|-------|---------|
| **Aislamiento de pagos** | Payments maneja datos financieros. Si hay un bug en Catalog, no debe afectar la capacidad de procesar pagos. Separación de responsabilidades = menor superficie de riesgo. |
| **Streaming pesado** | ffmpeg consume CPU intensivamente. Si el procesamiento de audio corre en el mismo proceso que el catálogo, un upload grande puede bloquear las búsquedas. Separación = no degradar UX. |
| **Auth como puerta** | Auth es el servicio que todos validan (JWT). Tenerlo separado permite rotar secrets, cambiar algoritmos de hash, o migrar a OAuth sin tocar el resto. |
| **Escalado independiente** | Catalog es el más leído, Streaming el más pesado, Payments el más sensible. Escalarlos por separado ahorra recursos vs escalar un monolito entero. |
| **ADR 001** | Ya aceptamos microservicios como estilo arquitectónico. 4 servicios es el mínimo viable para cumplir con los objetivos de aislamiento del ADR. |

### ¿Por qué NO 6 servicios en MVP?

| Servicio | Razón para postergar |
|----------|---------------------|
| User Service | En MVP, el perfil de usuario es CRUD simple (alias, avatar, bio). 3 endpoints en Auth Service. Extraerlo ahora es overengineering. |
| Notification Service | En MVP, los emails transaccionales se envían directamente desde cada servicio via Resend. 3 tipos de email (verificación, licencia, reset). No justifica un servicio completo. |

---

## 5.5 Comunicación Service-to-Service

### Endpoints internos (no expuestos al cliente)

| De | A | Endpoint | Método | Auth | Propósito |
|----|---|----------|--------|------|-----------|
| Streaming | Catalog | `/beats/:id/audio-ready` | PATCH | Service key | Notificar que el audio está procesado |
| Streaming | Catalog | `/beats/:id/audio` | DELETE | Service key | Notificar que el audio fue eliminado |
| Payments | Catalog | `/beats/:id` | GET | Service key | Obtener metadata del beat para checkout |
| Payments | Catalog | `/beats/:id/sold` | PATCH | Service key | Notificar venta completada |
| Payments | Auth | `/users/:id` | GET | Service key | Obtener email del comprador |

### Service Key

Para comunicación interna entre servicios, usamos un shared secret configurado en environment variables:

```
X-Service-Key: <SHARED_SERVICE_SECRET>
```

Este secret es diferente del JWT y se rota independientemente. En v2, se reemplaza por mTLS o JWT de servicio.

---

## 5.6 Estados de un Beat (Máquina de Estados)

```
                    ┌─────────────────────────────────────────┐
                    │          BEAT LIFECYCLE                   │
                    │                                           │
                    │  draft ──► pending_audio ──► processing   │
                    │    │            │               │         │
                    │    │            │               ▼         │
                    │    │            │            ready        │
                    │    │            │               │         │
                    │    │            │               ▼         │
                    │    │            │            published    │
                    │    │            │               │         │
                    │    ▼            ▼               ▼         │
                    │  archived ◄─── archived ◄─── sold         │
                    │    │                                     │
                    │    ▼                                     │
                    │  deleted (soft)                          │
                    │                                           │
                    └─────────────────────────────────────────┘

ESTADOS:
- draft: Beat creado pero sin audio. El productor aún lo está editando.
- pending_audio: Beat creado, esperando que el productor suba el archivo de audio.
- processing: Audio subido, ffmpeg generando preview. No visible públicamente.
- ready: Audio y preview disponibles. Visible en catálogo si el productor lo publica.
- published: Beat visible públicamente en el catálogo.
- sold: Al menos una licencia vendida. El beat sigue visible.
- archived: Beat oculto del catálogo pero no eliminado. El productor puede restaurarlo.
- deleted: Soft-delete. Los archivos se eliminan tras 30 días.
```

---

## 5.7 Dependencias de Persistencia

| Servicio | Tablas | Schema | FK Lógicas |
|----------|--------|--------|------------|
| Auth | `users`, `refresh_tokens` | `auth` | — |
| Catalog | `beats`, `genres`, `producer_profiles` | `catalog` | `beats.producer_id` → `auth.users.id` (lógica) |
| Streaming | `audio_files` | `streaming` | `audio_files.beat_id` → `catalog.beats.id` (lógica) |
| Payments | `transactions`, `licenses` | `payments` | `transactions.beat_id` → `catalog.beats.id` (lógica), `transactions.buyer_id` → `auth.users.id` (lógica), `transactions.producer_id` → `auth.users.id` (lógica) |

**Nota**: Las FK son lógicas (no enforceadas por la DB) porque los schemas están separados. La integridad se mantiene a nivel de aplicación. Esto permite migrar cada schema a su propia DB en v2 sin cambiar el código.
