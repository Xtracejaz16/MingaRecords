# 02 — Arquitectura del Sistema

> **Versión:** 2.0 — **Fecha:** 19 de mayo de 2026

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
│                    BACKEND — MONOLITO MODULAR                            │
│                    Express.js :3000                                      │
│                    AWS Free Tier (EC2 t2.micro)                          │
│                                                                          │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐            │
│  │   AUTH    │  │  CATALOG  │  │ STREAMING │  │  PAYMENTS │            │
│  │  MODULE   │  │  MODULE   │  │  MODULE   │  │  MODULE   │            │
│  │           │  │           │  │           │  │           │            │
│  │ /auth/*   │  │ /beats/*  │  │ /audio/*  │  │ /payments/*│           │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘            │
│        │              │              │              │                    │
│        └──────────────┴──────────────┴──────────────┘                    │
│                    Llamadas directas entre módulos                       │
│                    (sin HTTP, sin serialización)                         │
└──────────────────────────────┬──────────────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      INFRAESTRUCTURA COMPARTIDA                          │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │  PostgreSQL   │  │  Cloudflare  │  │ MercadoPago  │                   │
│  │  (Supabase)  │  │  R2 Storage  │  │  Payments    │                   │
│  │              │  │  (WAV/MP3)   │  │              │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
└─────────────────────────────────────────────────────────────────────────┘

        ▸ v2 (futuro): cada módulo se extrae a su propio microservicio
          con deploy independiente cuando haya revenue.
```

---

## 2.2 Responsabilidades de Cada Módulo

### 2.2.1 Auth Module — MVP
**Responsabilidad única**: Identidad, autenticación y perfil básico de usuario.

| Función | Descripción |
|---------|-------------|
| Registro | Crea usuario con email + password + rol (producer/artist) |
| Login | Valida credenciales, emite JWT (access 1h) + refresh token (7d) |
| Refresh | Renueva access token usando refresh token httpOnly |
| Password reset | Solicitud + token + nueva password |
| Perfil básico | GET/PATCH del usuario autenticado (alias, avatar URL, bio) |

**NO hace**: manejo de beats, licencias, pagos, ni almacenamiento de archivos. Solo identidad y perfil de usuario.

### 2.2.2 Catalog Module — MVP
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

### 2.2.3 Streaming Module — MVP
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

### 2.2.4 Payments Module — MVP
**Responsabilidad única**: Procesamiento de pagos y entrega de licencias.

| Función | Descripción |
|---------|-------------|
| Checkout | Crea preferencia de pago MercadoPago con precio, descripción y callback URL |
| Webhook handler | Recibe eventos de MercadoPago (`payment.updated` con status=approved) |
| Confirmación | Marca venta como completada, genera licencia |
| Historial | GET de transacciones del productor y del comprador |
| Revenue split | Calcula ganancia neta (precio - 15% comisión plataforma - comisión MercadoPago) |
| Refunds | Procesa reembolso via MercadoPago, revoca acceso a licencia |
| Licencia | Genera y entrega archivo de licencia (PDF o texto) con términos |

**NO hace**: catálogo de beats, perfiles, subida de audio. Solo dinero y licencias.

---

## 2.3 Comunicación entre Módulos

En el monolito modular, la comunicación entre módulos es por **llamadas directas a casos de uso**, NO por HTTP. Todos los módulos corren en el mismo proceso Express, así que no hay serialización, timeouts, ni circuit breakers.

```
                     ┌──────────────────────────────────────┐
                     │       COMUNICACIÓN EN MONOLITO        │
                     └──────────────────────────────────────┘

    AUTH ──────────────────────────────────────────────► TODOS (JWT validation)
           Cada request incluye Header: Authorization: Bearer <jwt>
           El middleware de Express valida la firma sin llamar a Auth.
           Los demás módulos importan el caso de uso de validación directamente.

    CATALOG ──► STREAMING (llamada directa a use-case)
               Catalog invoca el caso de uso de Streaming para procesamiento de audio.
               Catalog NUNCA toca archivos de audio.

    PAYMENTS ──► CATALOG (llamada directa a use-case)
               ──► AUTH    (llamada directa a use-case)
               Cuando un pago se completa, Payments invoca casos de uso de Catalog
               (incrementar contador de ventas) y Auth (obtener email del comprador).

    STREAMING ──► CATALOG (llamada directa a use-case)
                 Cuando el preview está generado, invoca el caso de uso de Catalog
                 para actualizar las URLs de streaming/preview.
```

### Sin HTTP, sin circuit breaker, sin timeouts

- **Sin HTTP**: Los módulos se comunican por llamadas directas a funciones/casos de uso. No hay serialización JSON, ni overhead de red.
- **Sin circuit breaker**: En un solo proceso, si un módulo falla, el error se propaga directamente. No hay necesidad de circuit breaker hasta que se extraigan a microservicios en v2.
- **Sin timeouts**: Las llamadas son síncronas dentro del mismo proceso. Si un caso de uso tarda, es un bug de performance, no un problema de red.
- **Sin retries**: No hay reintentos automáticos. Si un caso de uso falla, se maneja con try/catch en el caller.

---

## 2.4 Flujo de Autenticación

```
CLIENTE                    AUTH MODULE                     SUPABASE
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
  │  GET /beats                │                               │
  │  Authorization: Bearer ... │                               │
  │───────────────────────────────────────────────────────────►│
  │  Middleware: jwt.verify() sin llamar a Auth                │
  │◄───────────────────────────────────────────────────────────│
```

**Decisión**: JWT auto-contenido con claims `{sub, role, email}`. No se consulta Auth Module en cada request. El refresh token se usa solo cuando el access token expira. El middleware de Express valida la firma directamente, minimizando latencia.

---

## 2.5 Flujo de Audio (Upload + Preview + Streaming)

```
CLIENTE            CATALOG           STREAMING           R2
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
  │                   │  (llamada directa│                    │
  │                   │   a use-case)    │                    │
  │                   │  {audioUrl,      │                    │
  │                   │   previewUrl}    │                    │
  │                   │◄─────────────────│                    │
  │  200 + URLs       │                  │                    │
  │◄──────────────────│                  │                    │
  │                   │                  │                    │
  │  GET /stream/:id  │                  │                    │
  │──────────────────────────────────────┼───────────────────►│ R2
  │  Range: bytes=0-  │                  │                    │
  │  206 Partial      │                  │                    │
  │◄─────────────────────────────────────┼────────────────────│
```

**Decisión**: El upload es directo al Streaming Module (no pasa por Catalog). Streaming Module es el único que toca archivos. Catalog solo guarda URLs en la DB. En monolito, la notificación de "audio ready" es una llamada directa al caso de uso de Catalog, no un callback HTTP.

---

## 2.6 Flujo de Pago y Entrega de Licencia

```
CLIENTE          PAYMENTS        MERCADOPAGO       CATALOG          AUTH
  │                 │                  │                 │               │
  │ POST /checkout  │                  │                 │               │
  │ {beatId}        │                  │                 │               │
  │────────────────►│                  │                 │               │
  │                 │ (llamada directa) │                 │               │
  │                 │◄────────────────────────────────────│               │
  │                 │ ◄── {title,price,producerId}        │               │
  │                 │                  │                 │               │
  │                 │ Crear preferencia MP                │               │
  │                 │─────────────────►│                 │               │
  │                 │ ◄── {init_point}  │                 │               │
  │ 302 → MP        │                  │                 │               │
  │◄────────────────│                  │                 │               │
  │                 │                  │                 │               │
  │   [usuario paga en MercadoPago]    │                 │               │
   │                 │                  │                 │               │
   │                 │ POST /webhooks/mercadopago          │               │
   │                 │ ◄───────────────│ payment.updated  │               │
   │                 │                  │  status=approved │               │
   │                 │                  │                 │               │
   │                 │ Verificar via GET /collections/{id} │               │
   │                 │                  │                 │               │
   │                 │ (llamada directa: email comprador)  │               │
   │                 │◄────────────────────────────────────│               │
  │                 │ ◄── {email}                                         │
  │                 │                  │                 │               │
  │                 │ (llamada directa: marcar vendido)   │               │
  │                 │────────────────────────────────────►│               │
  │                 │ ◄── OK            │                 │               │
  │                 │                  │                 │               │
  │                 │ INSERT INTO sales (transaction)                     │
  │                 │ Generar licencia (PDF/texto)                        │
  │  200 OK         │                  │                 │               │
  │◄────────────────│                  │                 │               │
```

**Decisión**: MercadoPago maneja el pago; nuestro módulo solo reacciona a webhooks. La verificación se hace consultando la API de MercadoPago (GET /collections/{id}) en vez de confiar en la firma del webhook. La licencia se genera solo después de confirmar el pago (no antes). La entrega del archivo WAV original se incluye en la respuesta o como link descargable desde la licencia.

---

## 2.7 Dependencias entre Módulos

```
                     ┌─────────────────────────────────────┐
                     │      DEPENDENCIAS ENTRE MÓDULOS       │
                     │   (llamadas directas, mismo proceso)  │
                     └─────────────────────────────────────┘

                 │  Auth  │ Catalog│Streaming│Payments│
     ────────────┼────────┼────────┼─────────┼────────┤
     Auth        │   -    │   NO   │   NO    │   NO   │
     Catalog     │  NO†   │   -    │   SÍ    │   NO   │
     Streaming   │  NO    │   SÍ   │   -     │   NO   │
     Payments    │  SÍ    │   SÍ   │   NO    │   -    │
     ────────────┼────────┼────────┼─────────┼────────┤

     † Catalog y otros módulos no llaman a Auth; validan JWT auto-contenido en middleware.

     En monolito NO hay dependencia circular problemática porque todo corre en el
     mismo proceso. Los módulos importan casos de uso de otros módulos directamente.

     ORDEN DE INICIALIZACIÓN:
     1. Auth Module (registra middleware JWT)
     2. Catalog Module (depende de Auth para proteger rutas de producer)
     3. Streaming Module (depende de Catalog para callback de audio-ready)
     4. Payments Module (depende de Catalog y Auth para checkout)

     Esto rompe cualquier ciclo: cada módulo importa solo de módulos ya inicializados.
```

---

## 2.8 Routing en Express

Express maneja el routing directamente con `express.Router()`:

```
┌────────────────────────────────────────────────────────┐
│  Express App (:3000)                                    │
│                                                         │
│  /api/v1/auth/*       → Auth Module Router             │
│  /api/v1/beats/*      → Catalog Module Router          │
│  /api/v1/audio/*      → Streaming Module Router        │
│  /api/v1/payments/*   → Payments Module Router         │
│                                                         │
│  + CORS middleware (allowed origins)                    │
│  + JWT middleware (rutas protegidas)                    │
│  + Error handler (RFC 7807)                            │
│  + Rate limiting simple en memoria (sliding window)    │
└────────────────────────────────────────────────────────┘
```

No hace falta API Gateway ni reverse proxy para MVP. Todo corre en un solo proceso.

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
                     │  └─────────────────────────────┘  │
                     └──────────────────────────────────┘

DECISIÓN: UNA DB compartida con schemas separados en MVP. Razones:
- 1 solo proceso Express: 1 PrismaClient conecta a todos los schemas
- Schemas separados por módulo → migración a DBs separadas en v2 es trivial
- Transacciones ACID pueden abarcar múltiples módulos (ej: pago + actualizar ventas)
- Prisma ORM con múltiples schemas funciona perfectamente
- Sin riesgo de contención real en MVP (< 1000 usuarios)
```

**1 PrismaClient para todos los schemas**:
En el monolito, un solo `PrismaClient` accede a todos los schemas. Cada módulo usa solo las tablas de su schema, pero el cliente es compartido. Esto permite transacciones ACID entre módulos.

**Connection pooling**:
Supabase incluye connection pooler integrado (Supavisor). No hace falta configurar PgBouncer manualmente. Solo usar la URL de conexión con pooler que provee Supabase.

**Migración futura a DBs separadas**:
Cuando un módulo tenga > 10GB de datos o > 100 QPS sostenidos, se extrae su schema a una DB dedicada. Las migraciones de Prisma por schema facilitan esta separación.
