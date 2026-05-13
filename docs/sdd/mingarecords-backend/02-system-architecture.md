# 02 — Arquitectura del Sistema

> **Versión:** 1.1 — **Fecha:** 12 de mayo de 2026

---

## 2.1 Diagrama de Arquitectura (Texto ASCII)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENTE (Web App)                              │
│                    React 19 + Vite (existente)                           │
│                 https://mingarecords.vercel.app                          │
└──────────────────────────────┬──────────────────────────────────────────┘
                                │ HTTPS
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY (opcional MVP)                        │
│                    Nginx o Cloudflare Workers                            │
│               Rate limiting, CORS, JWT validation inicial                │
│                      https://api.mingarecords.com                        │
└───────┬──────────────┬──────────────┬──────────────┬────────────────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
│   AUTH    │  │  CATALOG  │  │ STREAMING │  │  PAYMENTS │
│  SERVICE  │  │  SERVICE  │  │  SERVICE  │  │  SERVICE  │
│           │  │           │  │           │  │           │
│ Fastify   │  │ Fastify   │  │ Fastify   │  │ Fastify   │
│ :4001     │  │ :4002     │  │ :4003     │  │ :4004     │
└─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
      │              │              │              │
      ▼              ▼              ▼              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      INFRAESTRUCTURA COMPARTIDA                          │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  PostgreSQL   │  │  Cloudflare  │  │   BunnyCDN   │  │    Resend    │ │
│  │  (Supabase)  │  │  R2 Storage  │  │  (Audio CDN) │  │  (Emails)    │ │
│  │              │  │  (WAV/MP3)   │  │  (Streaming) │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐                                     │
│  │  Upstash      │  │    Stripe    │                                     │
│  │  Redis        │  │  Payments    │                                     │
│  │  (Cache/Rate) │  │  Gateway     │                                     │
│  └──────────────┘  └──────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────┘

        ▸ v2 (futuro): user-service (:4005) y notification-service (:4006)
          se añaden como peers en la misma capa de microservicios.
```

---

## 2.2 Responsabilidades de Cada Microservicio

### 2.2.1 Auth Service (`:4001`) — MVP
**Responsabilidad única**: Identidad, autenticación y perfil básico de usuario.

| Función | Descripción |
|---------|-------------|
| Registro | Crea usuario con email + password + rol (producer/artist) |
| Login | Valida credenciales, emite JWT (access 1h) + refresh token (7d) |
| Refresh | Renueva access token usando refresh token httpOnly |
| Email verification | Envía email de verificación via Resend, activa cuenta |
| Password reset | Solicitud + token + nueva password via email |
| Perfil básico | GET/PATCH del usuario autenticado (alias, avatar URL, bio) |

**NO hace**: manejo de beats, licencias, pagos, ni almacenamiento de archivos. Solo identidad y perfil de usuario (en MVP).

> **Nota v2**: En el futuro, los endpoints de perfil (`GET/PATCH /users/:id`) se extraerán a `user-service`. Auth Service se quedará exclusivamente con autenticación.

### 2.2.2 Catalog Service (`:4002`) — MVP
**Responsabilidad única**: Gestión del catálogo de beats y perfiles públicos.

| Función | Descripción |
|---------|-------------|
| CRUD Beats | Crear, leer, actualizar, soft-delete beats (solo el dueño) |
| Listado público | Beats paginados con filtros: género, precio (min-max), BPM, key |
| Búsqueda | Full-text search sobre título, tags, nombre de productor |
| Perfil público | GET de productor con bio, avatar, lista de beats |
| Metadatos | Géneros disponibles, rango de precios, conteo total de beats |
| Dashboard | Stats del productor: beats totales, plays, ventas, ganancias (agregadas) |

**NO hace**: procesamiento de audio, pagos, entrega de archivos. Solo metadata.

### 2.2.3 Streaming Service (`:4003`) — MVP
**Responsabilidad única**: Procesamiento y entrega de audio.

| Función | Descripción |
|---------|-------------|
| Upload audio | Recibe archivo WAV/MP3 (máx 100MB), valida tipo MIME real |
| Generación preview | Crea fragmento de 30s (primeros 30s con fade out) en MP3 192kbps |
| Almacenamiento | Sube original a R2, preview a R2, actualiza Catalog con URLs |
| Streaming | Sirve audio via HTTP Range Requests (seek en cliente) |
| Marca de agua | Aplica audio watermark sutil en el preview (opcional MVP) |
| Cleanup | Elimina archivos cuando el beat es soft-deleted |

**NO hace**: metadata del beat, precios, licencias. Solo bytes de audio.

### 2.2.4 Payments Service (`:4004`) — MVP
**Responsabilidad única**: Procesamiento de pagos y entrega de licencias.

| Función | Descripción |
|---------|-------------|
| Checkout | Crea sesión de pago Stripe con precio, descripción y webhook URL |
| Webhook handler | Recibe eventos de Stripe (`payment_intent.succeeded`, `payment_intent.payment_failed`) |
| Confirmación | Marca venta como completada, genera licencia, envía email de entrega vía Resend |
| Historial | GET de transacciones del productor y del comprador |
| Revenue split | Calcula ganancia neta (precio - 15% comisión plataforma - comisión Stripe) |
| Refunds | Procesa reembolso via Stripe, revoca acceso a licencia |
| Licencia | Genera y entrega archivo de licencia (PDF o texto) con términos |

**NO hace**: catálogo de beats, perfiles, subida de audio. Solo dinero y licencias.

### 2.2.5 User Service (`:4005`) — v2 (NO MVP)
**Responsabilidad única**: Perfiles extendidos, settings, y características sociales.

| Función | Descripción |
|---------|-------------|
| Perfil extendido | CRUD de perfil con redes sociales, ubicación, géneros preferidos |
| Avatar upload | Subida y crop de avatar (a R2) |
| Follow/Unfollow | Productores pueden seguir a otros productores |
| Activity feed | Historial de actividad del usuario (beats subidos, compras, likes) |
| Settings | Preferencias de notificación, privacidad, moneda, idioma |

**NO hace**: autenticación (eso es Auth Service). Simplemente consume JWT validado.

### 2.2.6 Notification Service (`:4006`) — v2 (NO MVP)
**Responsabilidad única**: Orquestación de notificaciones multicanal.

| Función | Descripción |
|---------|-------------|
| Email digests | Resúmenes diarios/semanales de actividad |
| Push notifications | Web push API para notificaciones en navegador |
| In-app notifications | Campanita de notificaciones en la UI |
| Plantillas | Templates de notificación versionadas (venta nueva, nuevo follower, etc.) |
| Preferencias | Por usuario: qué notificaciones recibe y por qué canal |

---

## 2.3 Comunicación entre Servicios

Siguiendo ADR 003:

```
                    ┌──────────────────────────────────────┐
                    │         FLUJO DE COMUNICACIÓN         │
                    └──────────────────────────────────────┘

    AUTH ──────────────────────────────────────────────► TODOS (JWT validation)
           Cada request incluye Header: Authorization: Bearer <jwt>
           Auth NO es llamado en cada request; el JWT es auto-contenido.
           Gateway o middleware valida firma y expiración sin llamar Auth.

    CATALOG ──► STREAMING (HTTP POST /api/v1/audio/upload-url)
              ──► STREAMING (HTTP GET  /api/v1/audio/stream/{beatId})
              Catalog redirige al cliente a URLs de Streaming. 
              Catalog NUNCA toca archivos de audio.

    PAYMENTS ──► CATALOG (HTTP PATCH /api/v1/beats/{id}/sold)
              ──► CATALOG (HTTP GET  /api/v1/beats/{id}  — metadata para licencia)
              ──► AUTH    (HTTP GET  /api/v1/users/{id} — email del comprador)
              Cuando un pago se completa, Payments notifica a Catalog 
              (incrementa contador de ventas) y consulta Auth (email para entrega).

    STREAMING ──► CATALOG (HTTP POST /api/v1/beats/{id}/audio-ready)
                ──► CATALOG (HTTP DELETE /api/v1/beats/{id}/audio — cleanup)
                Cuando el preview está generado, notifica a Catalog 
                para actualizar las URLs de streaming/preview.

    ▸ v2: USER ──► integra con Auth (JWT), Catalog (beats del usuario)
    ▸ v2: NOTIFICATION ──► escucha eventos de Payments ("venta completada"),
                            Catalog ("nuevo beat de productor seguido"),
                            User ("nuevo follower")
```

### Timeouts y Circuit Breaker

- **Timeout default**: 5 segundos (ADR 003).
- **Timeout streaming upload**: 30 segundos (archivos grandes).
- **Circuit breaker**: Implementación manual simple:
  ```typescript
  // 3 fallos consecutivos → circuito abierto 30s → half-open → test request
  // Sin librería externa en MVP. Menos de 50 líneas.
  ```
- **Retry**: Máximo 2 reintentos con exponential backoff (1s, 2s) solo para requests idempotentes (GET, PUT).

---

## 2.4 Flujo de Autenticación

```
CLIENTE                    AUTH SERVICE                    SUPABASE
  │                            │                               │
  │  POST /auth/register       │                               │
  │  {email, password, role}   │                               │
  │──────────────────────────►│                               │
  │                            │  INSERT INTO users            │
  │                            │──────────────────────────────►│
  │                            │  ◄── user created             │
  │                            │                               │
  │  201 + {user}              │                               │
  │◄──────────────────────────│                               │
  │                            │                               │
  │  POST /auth/login          │                               │
  │  {email, password}         │                               │
  │──────────────────────────►│                               │
  │                            │  SELECT FROM users            │
  │                            │──────────────────────────────►│
  │                            │  ◄── user + hashed password   │
  │                            │  bcrypt.compare()             │
  │                            │  jwt.sign({sub, role})        │
  │  200 + {accessToken}       │                               │
  │  Set-Cookie: refreshToken  │                               │
  │◄──────────────────────────│                               │
  │                            │                               │
  │  GET /catalog/beats        │                               │
  │  Authorization: Bearer ... │                               │
  │───────────────────────────────────────────────────────────►│
  │  Middleware: jwt.verify() sin llamar a Auth                │
  │◄───────────────────────────────────────────────────────────│
```

**Decisión**: JWT auto-contenido con claims `{sub, role, email}`. No se consulta Auth Service en cada request. El refresh token se usa solo cuando el access token expira. Esto minimiza latencia y dependencia entre servicios.

---

## 2.5 Flujo de Audio (Upload + Preview + Streaming)

```
CLIENTE            CATALOG           STREAMING           R2/BUNNYCDN
  │                   │                  │                    │
  │  POST /beats      │                  │                    │
  │  {metadata JSON}  │                  │                    │
  │──────────────────►│                  │                    │
  │                   │  INSERT beat     │                    │
  │                   │  (sin URLs aún)  │                    │
  │  201 + {beat}     │                  │                    │
  │◄──────────────────│                  │                    │
  │                   │                  │                    │
  │  POST /beats/:id/audio              │                    │
  │  Content-Type:    │                  │                    │
  │  multipart/form-data                │                    │
  │  (WAV file)       │                  │                    │
  │─────────────────────────────────────►│                    │
  │                   │                  │  Validar MIME real │
  │                   │                  │  (magic bytes)     │
  │                   │                  │  Generar preview   │
  │                   │                  │  (ffmpeg: 30s)     │
  │                   │                  │                    │
  │                   │                  │  PUT original.wav  │
  │                   │                  │───────────────────►│ R2
  │                   │                  │  PUT preview.mp3   │
  │                   │                  │───────────────────►│ R2
  │                   │                  │                    │
  │                   │  PATCH /beats/:id│                    │
  │                   │  {audioUrl,      │                    │
  │                   │   previewUrl}    │                    │
  │                   │◄─────────────────│                    │
  │  200 + URLs       │                  │                    │
  │◄──────────────────│                  │                    │
  │                   │                  │                    │
  │  GET /stream/:id  │                  │                    │
  │──────────────────────────────────────┼───────────────────►│ BunnyCDN
  │  Range: bytes=0-  │                  │                    │
  │  200 Content-Range│                  │  206 Partial       │
  │◄─────────────────────────────────────┼────────────────────│
```

**Decisión**: El upload es directo a Streaming Service (no pasa por Catalog). Streaming Service es el único que toca archivos. Catalog solo guarda URLs en la DB. Para el streaming, BunnyCDN actúa como CDN frente a R2, entregando audio con baja latencia global.

---

## 2.6 Flujo de Pago y Entrega de Licencia

```
CLIENTE          PAYMENTS           STRIPE           CATALOG          AUTH        RESEND
  │                 │                  │                 │               │            │
  │ POST /checkout  │                  │                 │               │            │
  │ {beatId}        │                  │                 │               │            │
  │────────────────►│                  │                 │               │            │
  │                 │ GET /beats/:id   │                 │               │            │
  │                 │────────────────────────────────────►│               │            │
  │                 │ ◄── {title,price,producerId}        │               │            │
  │                 │                  │                 │               │            │
  │                 │ POST /checkout/sessions             │               │            │
  │                 │─────────────────►│                 │               │            │
  │                 │ ◄── {url}        │                 │               │            │
  │ 302 → Stripe    │                  │                 │               │            │
  │◄────────────────│                  │                 │               │            │
  │                 │                  │                 │               │            │
  │   [usuario paga en Stripe]         │                 │               │            │
  │                 │                  │                 │               │            │
  │                 │ POST /webhooks/stripe               │               │            │
  │                 │ ◄───────────────│ payment_intent.  │               │            │
  │                 │                  │  succeeded       │               │            │
  │                 │                  │                 │               │            │
  │                 │ Verificar firma webhook (whsec_)    │               │            │
  │                 │                  │                 │               │            │
  │                 │ GET /users/:id (email comprador)                    │            │
  │                 │────────────────────────────────────────────────────►│            │
  │                 │ ◄── {email}                                         │            │
  │                 │                  │                 │               │            │
  │                 │ PATCH /beats/:id/sold              │               │            │
  │                 │────────────────────────────────────►│               │            │
  │                 │ ◄── OK            │                 │               │            │
  │                 │                  │                 │               │            │
  │                 │ INSERT INTO sales (transaction)                     │            │
  │                 │ Generar licencia (PDF/texto)                        │            │
  │                 │                  │                 │               │            │
  │                 │ POST /emails     │                 │               │───────────►│
  │                 │ {to, licenseUrl} │                 │               │  Send email│
  │  200 OK         │                  │                 │               │            │
  │◄────────────────│                  │                 │               │            │
```

**Decisión**: Stripe maneja el pago; nuestro servicio solo reacciona a webhooks con verificación de firma. La licencia se genera solo después de confirmar el pago (no antes). El email de entrega incluye link de descarga del archivo WAV original.

---

## 2.7 Dependencias entre Servicios

```
                    ┌─────────────────────────────────────┐
                    │      MATRIZ DE DEPENDENCIAS          │
                    │   (quién llama a quién en runtime)   │
                    └─────────────────────────────────────┘

                │  Auth  │ Catalog│Streaming│Payments│ User* │Notif* │
    ────────────┼────────┼────────┼─────────┼────────┼───────┼───────┤
    Auth        │   -    │   NO   │   NO    │   NO   │  NO   │  NO   │
    Catalog     │  NO†   │   -    │   SÍ    │   NO   │  NO   │  NO   │
    Streaming   │  NO    │   SÍ   │   -     │   NO   │  NO   │  NO   │
    Payments    │  SÍ    │   SÍ   │   NO    │   -    │  NO   │  NO   │
    ────────────┼────────┼────────┼─────────┼────────┼───────┼───────┤
    User*       │  NO†   │   SÍ   │   NO    │   NO   │   -   │  NO   │
    Notif*      │  SÍ    │   NO   │   NO    │   SÍ   │  SÍ   │   -   │

    † Catalog y User no llaman a Auth; validan JWT auto-contenido en middleware.
    * User Service y Notification Service son v2 (NO MVP).

    CICLO DE DEPENDENCIA MVP (ya resuelto):
    Catalog ←→ Streaming  (¡CUIDADO! dependencia circular)
    
    SOLUCIÓN: Catalog nunca espera respuesta síncrona de Streaming para 
    devolver datos al cliente. Cuando el cliente sube audio, el flow es:
    1. Catalog crea beat (sin URLs de audio) → responde 201 inmediatamente
    2. Cliente sube audio a Streaming → Streaming procesa async
    3. Streaming notifica a Catalog con URLs → Catalog actualiza beat
    4. Cliente refresca para ver URLs (o usa polling corto)

    Esto rompe el ciclo: Catalog puede funcionar sin Streaming disponible.
    Catalog responde beats con o sin URLs de audio (estado: 'processing' o 'ready').
```

---

## 2.8 Gateway (MVP Simplificado)

Para MVP, **no necesitamos un API Gateway dedicado**. Un simple proxy inverso con Nginx o Cloudflare Workers es suficiente:

```
RAZONES PARA NO USAR KONG/APIGEE/TYK EN MVP:
- 2 developers: mantener un gateway es overhead operativo
- 4 servicios solamente: el routing es trivial
- Sin rate limiting complejo: usamos middlewares por servicio
- Sin service discovery: URLs estáticas en variables de entorno

SOLUCIÓN MVP:
┌────────────────────────────────────────────────────┐
│         Cloudflare Workers (proxy simple)           │
│  api.mingarecords.com/*                             │
│                                                     │
│  /auth/*     → auth-service.onrender.com:4001      │
│  /catalog/*  → catalog-service.onrender.com:4002   │
│  /stream/*   → streaming-service.onrender.com:4003 │
│  /payments/* → payments-service.onrender.com:4004  │
│                                                     │
│  + CORS headers (allowed origins)                   │
│  + Rate limit global (100 req/min por IP)           │
│  + HTTPS enforcement                                │
└────────────────────────────────────────────────────┘

En v2, si necesitamos API key management, analytics de tráfico, 
o autenticación a nivel gateway → considerar Kong o Traefik.
```

---

## 2.9 Estrategia de Base de Datos

```
                    ┌──────────────────────────────────┐
                    │   UNA BASE DE DATOS COMPARTIDA    │
                    │   PostgreSQL (Supabase managed)   │
                    │                                   │
                    │  ┌─────────────────────────────┐  │
                    │  │ Schema: auth                │  │
                    │  │  - users                    │  │
                    │  │  - refresh_tokens           │  │
                    │  │  - user_profiles            │  │
                    │  ├─────────────────────────────┤  │
                    │  │ Schema: catalog             │  │
                    │  │  - beats                    │  │
                    │  │  - genres                   │  │
                    │  │  - producer_profiles        │  │
                    │  ├─────────────────────────────┤  │
                    │  │ Schema: streaming           │  │
                    │  │  - audio_files              │  │
                    │  │  - uploads                  │  │
                    │  ├─────────────────────────────┤  │
                    │  │ Schema: payments            │  │
                    │  │  - transactions             │  │
                    │  │  - licenses                 │  │
                    │  ├─────────────────────────────┤  │
                    │  │ Schema: notification (v2)   │  │
                    │  │  - notification_templates   │  │
                    │  │  - notification_log         │  │
                    │  └─────────────────────────────┘  │
                    └──────────────────────────────────┘

DECISIÓN: UNA DB compartida en MVP. Razones:
- 2 developers: gestionar 4 DBs separadas es suicidio operativo
- Supabase free tier: 500MB, suficiente para MVP
- Schemas separados por servicio → migración a DBs separadas en v2 es trivial
- No hay riesgo de contención real en MVP (< 1000 usuarios)
- Prisma ORM con múltiples schemas funciona perfectamente
```

**Migración futura a DBs separadas**:
Cuando un servicio tenga > 10GB de datos o > 100 QPS sostenidos, se extrae su schema a una DB dedicada. Las migraciones de Prisma por schema facilitan esta separación.

---

## 2.10 Patrón de Eventos para v2 (Notification Service)

Aunque en MVP usamos llamadas HTTP síncronas, para v2 con Notification Service, se introduce un patrón de eventos simple:

```
MVP (HTTP directo):
  Payments ──HTTP──► Resend (email de licencia entregada)

v2 (Eventos + Notification Service):
  Payments ──HTTP──► Notification Service (POST /events {type: "sale.completed"})
  Notification Service ──► Evalúa preferencias del usuario
                        ──► Envía por canal(es) correspondiente(s):
                             • Email via Resend
                             • Push via Web Push API
                             • In-app via WebSocket/SSE

  Catalog ──HTTP──► Notification Service (POST /events {type: "beat.published"})
  User    ──HTTP──► Notification Service (POST /events {type: "user.followed"})
```

Para v2, este patrón puede escalar a un message broker (Redis Pub/Sub o RabbitMQ) si el volumen de eventos lo justifica. En MVP, ni siquiera implementamos el servicio de notificaciones — cada servicio envía emails directamente.
