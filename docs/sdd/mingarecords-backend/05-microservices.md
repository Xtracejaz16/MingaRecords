# 05 — Módulos del Monolito

> **Versión:** 1.1 — **Fecha:** 19 de mayo de 2026

---

## 5.1 Principios de Diseño de Módulos

| Principio | Qué significa |
|-----------|---------------|
| **Single Responsibility** | Un módulo, una responsabilidad. Si un módulo hace dos cosas distintas, es dos módulos. |
| **Aislamiento de Datos** | Cada módulo es dueño de su schema. Ningún otro módulo lee/escribe directamente en sus tablas. |
| **Puertos como Contrato** | La comunicación es por llamadas directas a casos de uso. No hay imports directos entre capas de distintos módulos. |
| **Graceful Degradation** | Si un módulo falla, los demás siguen funcionando con datos cacheados o estados fallback. |
| **MVP ≤ 4 módulos** | No creamos más de 4 módulos en MVP. La complejidad ya es el límite para 2 devs. |
| **1 proceso Express** | Todos los módulos corren en el mismo proceso. Sin HTTP entre módulos, sin serialización. |

---

## 5.2 Lista Completa de Módulos

### 5.2.1 Auth Module (MVP)

| Atributo | Detalle |
|----------|---------|
| **Framework** | Express.js |
| **Responsabilidad** | Identidad, autenticación, gestión de sesión, perfil básico de usuario |
| **Endpoints** | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/verify-email`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/me`, `PATCH /auth/me`, `GET /users/:id` |
| **Persistencia** | PostgreSQL schema `auth` (users, refresh_tokens) |
| **Dependencias externas** | Supabase (DB), Resend (emails) |
| **Criticidad** | 🔴 CRÍTICA — Si Auth cae, nadie se registra ni loguea |
| **Estado** | Stateless (JWT auto-contenido, refresh tokens en DB) |

### 5.2.2 Catalog Module (MVP)

| Atributo | Detalle |
|----------|---------|
| **Framework** | Express.js |
| **Responsabilidad** | Gestión del catálogo de beats, búsqueda, filtrado, perfiles públicos, dashboard |
| **Endpoints** | `GET /beats`, `GET /beats/:id`, `POST /beats`, `PATCH /beats/:id`, `DELETE /beats/:id`, `PATCH /beats/:id/audio-ready`, `PATCH /beats/:id/sold`, `GET /genres`, `GET /producers/:id`, `GET /producers/:id/beats`, `GET /dashboard` |
| **Persistencia** | PostgreSQL schema `catalog` (beats, genres, producer_profiles) |
| **Dependencias externas** | Supabase (DB) |
| **Criticidad** | 🔴 CRÍTICA — Si Catalog cae, no hay catálogo visible |
| **Estado** | Stateless (datos en DB) |

### 5.2.3 Streaming Module (MVP)

| Atributo | Detalle |
|----------|---------|
| **Framework** | Express.js |
| **Responsabilidad** | Subida, procesamiento, almacenamiento y streaming de audio |
| **Endpoints** | `POST /audio/upload/:beatId`, `GET /audio/stream/:beatId`, `GET /audio/preview/:beatId`, `GET /audio/download/:licenseId`, `DELETE /audio/:beatId` |
| **Persistencia** | PostgreSQL schema `streaming` (audio_files), Cloudflare R2 (archivos de audio) |
| **Dependencias externas** | Cloudflare R2 (storage), ffmpeg (procesamiento), Catalog Module (llamada directa callback) |
| **Criticidad** | 🔴 CRÍTICA — Si Streaming cae, no se pueden subir ni escuchar beats |
| **Estado** | Semi-stateless (archivos temporales durante procesamiento, luego se suben a R2) |

### 5.2.4 Payments Module (MVP)

| Atributo | Detalle |
|----------|---------|
| **Framework** | Express.js |
| **Responsabilidad** | Checkout, procesamiento de pagos, entrega de licencias, historial de transacciones |
| **Endpoints** | `POST /checkout`, `POST /webhooks/mercadopago`, `GET /transactions`, `GET /transactions/:id`, `POST /refunds/:transactionId`, `GET /earnings` |
| **Persistencia** | PostgreSQL schema `payments` (transactions, licenses) |
| **Dependencias externas** | MercadoPago (pagos), Catalog Module (llamada directa: GET beat metadata, PATCH sold), Auth Module (llamada directa: GET user email), Resend (email de licencia) |
| **Criticidad** | 🔴 CRÍTICA — Si Payments cae, no hay revenue. Pero el resto de la plataforma sigue funcionando |
| **Estado** | Stateless (datos en DB) |

### 5.2.5 User Module (v2 — NO MVP)

| Atributo | Detalle |
|----------|---------|
| **Framework** | Express.js |
| **Responsabilidad** | Perfiles extendidos, settings, follow system, actividad |
| **Endpoints** | `GET /users/:id`, `PATCH /users/:id`, `POST /users/:id/avatar`, `POST /users/:id/follow`, `DELETE /users/:id/follow`, `GET /users/:id/followers`, `GET /users/:id/following`, `GET /users/:id/activity` |
| **Persistencia** | PostgreSQL schema `users` (user_profiles, follows, activity_log) |
| **Dependencias externas** | Supabase (DB), Cloudflare R2 (avatars), Catalog Module (beats del usuario) |
| **Criticidad** | 🟡 MEDIA — Si cae, los perfiles no se muestran, pero el catálogo y pagos siguen funcionando |
| **Trigger de creación** | Cuando Auth Module tenga > 15 endpoints o el perfil crezca a features sociales (follow, likes, feed) |

### 5.2.6 Notification Module (v2 — NO MVP)

| Atributo | Detalle |
|----------|---------|
| **Framework** | Express.js |
| **Responsabilidad** | Notificaciones multicanal (email, push, in-app), templates, preferencias |
| **Endpoints** | `POST /events`, `POST /templates`, `GET /templates/:id`, `PATCH /templates/:id`, `GET /users/:id/preferences`, `PATCH /users/:id/preferences`, `GET /users/:id/notifications` |
| **Persistencia** | PostgreSQL schema `notifications` (notification_templates, notification_log, user_preferences) |
| **Dependencias externas** | Resend (emails), Web Push API (push notifications) |
| **Criticidad** | 🟢 BAJA — Si cae, las notificaciones se pierden pero no hay pérdida de datos (se reintentan) |
| **Trigger de creación** | Cuando necesitemos más de 3 tipos de notificación o notificaciones push |

---

## 5.3 Matriz de Módulos — Resumen

| Módulo | MVP? | DB Schema | Estado | Criticidad |
|--------|------|-----------|------|------------|
| Auth | ✅ | `auth` | Stateless | 🔴 Crítica |
| Catalog | ✅ | `catalog` | Stateless | 🔴 Crítica |
| Streaming | ✅ | `streaming` | Semi-stateless | 🔴 Crítica |
| Payments | ✅ | `payments` | Stateless | 🔴 Crítica |
| User | ❌ v2 | `users` | Stateless | 🟡 Media |
| Notification | ❌ v2 | `notifications` | Stateless | 🟢 Baja |

---

## 5.4 Justificación de Módulos MVP

### ¿Por qué monolito modular y no microservicios?

| Razón | Detalle |
|-------|---------|
| **2 developers, deadline corto** | No hay margen para gestionar 4 deploys independientes, CI/CD separados, monitoreo por servicio. |
| **Costo $0** | No hay infraestructura gratuita que soporte 4 servicios 24/7. 1 proceso en AWS free tier = $0. |
| **Transacciones ACID** | Un pago puede actualizar ventas y generar licencia en 1 transacción. Imposible con microservicios. |
| **Sin overhead de red** | Llamadas directas a casos de uso: sin serialización JSON, sin timeouts, sin circuit breakers. |
| **Extracción trivial en v2** | Cada módulo ya tiene su `domain/`, `application/`, `infrastructure/`. Extraer = copiar módulo + agregar HTTP + deploy separado. |

### ¿Por qué NO 6 módulos en MVP?

| Módulo | Razón para postergar |
|--------|---------------------|
| User Module | En MVP, el perfil de usuario es CRUD simple (alias, avatar, bio). 3 endpoints en Auth Module. Extraerlo ahora es overengineering. |
| Notification Module | En MVP, los emails transaccionales se envían directamente desde cada módulo via Resend. 3 tipos de email (verificación, licencia, reset). No justifica un módulo completo. |

---

## 5.5 Comunicación entre Módulos

En el monolito, la comunicación entre módulos es por **llamadas directas a casos de uso**, NO por HTTP. Todos los módulos corren en el mismo proceso Express.

### Llamadas directas entre módulos

| De | A | Caso de uso | Propósito |
|----|---|-------------|-----------|
| Streaming | Catalog | `updateBeatAudioUrls(beatId, urls)` | Notificar que el audio está procesado |
| Streaming | Catalog | `deleteBeatAudio(beatId)` | Notificar que el audio fue eliminado |
| Payments | Catalog | `getBeatById(beatId)` | Obtener metadata del beat para checkout |
| Payments | Catalog | `markBeatAsSold(beatId)` | Notificar venta completada |
| Payments | Auth | `getUserById(userId)` | Obtener email del comprador |

### Sin Service Key, sin HTTP interno

En microservicios se necesita un shared secret (`X-Service-Key`) para comunicación interna. En el monolito esto no existe — los módulos se importan directamente. La seguridad se maneja a nivel de Express middleware (JWT para rutas externas).

En v2, cuando los módulos se extraigan a microservicios, se introduce mTLS o JWT de servicio para comunicación interna.

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

| Módulo | Tablas | Schema | FK Lógicas |
|--------|--------|--------|------------|
| Auth | `users`, `refresh_tokens` | `auth` | — |
| Catalog | `beats`, `genres`, `producer_profiles` | `catalog` | `beats.producer_id` → `auth.users.id` (lógica) |
| Streaming | `audio_files` | `streaming` | `audio_files.beat_id` → `catalog.beats.id` (lógica) |
| Payments | `transactions`, `licenses` | `payments` | `transactions.beat_id` → `catalog.beats.id` (lógica), `transactions.buyer_id` → `auth.users.id` (lógica), `transactions.producer_id` → `auth.users.id` (lógica) |

**Nota**: Las FK son lógicas (no enforceadas por la DB) porque los schemas están separados. La integridad se mantiene a nivel de aplicación. En el monolito, un solo `PrismaClient` accede a todos los schemas, lo que permite transacciones ACID entre módulos. Esto facilita la migración a DBs separadas en v2 sin cambiar el código.
