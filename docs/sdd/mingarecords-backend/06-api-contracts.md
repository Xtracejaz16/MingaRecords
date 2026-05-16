# 06 — Contratos de API y Estrategia OpenAPI

> **Versión:** 1.0 — **Fecha:** 12 de mayo de 2026

---

## 6.1 Filosofía de Contratos

Siguiendo ADR 003, cada microservicio expone una API REST documentada con OpenAPI 3.0. Los contratos son la **fuente de verdad** de la comunicación — si un endpoint no está en el `.yaml`, no existe.

### Principios de Diseño de API

| Principio | Qué significa |
|-----------|---------------|
| **Contract-first** | El archivo `.yaml` se escribe ANTES del código del handler. |
| **URLs como recursos, no acciones** | `/beats/{id}` no `/getBeatById` |
| **Consistencia en plurales** | Siempre plural: `/beats`, `/users`, `/transactions` |
| **Menos es más** | Solo los campos que el cliente NECESITA. Nada de respuestas de 5KB para mostrar un título. |
| **HATEOAS mínimo** | Solo links de paginación (`next`, `prev`). No hypermedia completo. |
| **Fail fast, fail loud** | Errores con mensajes accionables, nunca "algo salió mal". |

---

## 6.2 Ubicación de Contratos OpenAPI

```
mingarecords/
└── docs/
    └── openapi/
        ├── auth.openapi.yaml        # Endpoints de Auth Service
        ├── catalog.openapi.yaml     # Endpoints de Catalog Service
        ├── streaming.openapi.yaml   # Endpoints de Streaming Service
        └── payments.openapi.yaml    # Endpoints de Payments Service
```

### ¿Por qué en `docs/openapi/` y no en cada servicio?

| Opción | Pros | Cons |
|--------|------|------|
| `docs/openapi/` (elegida) | Vista unificada de todas las APIs; un solo `redocly lint` para todo; fácil de revisar en PR | Hay que mantener sincronía manual con el código |
| `apps/{service}/src/openapi/` | Cerca del código que implementa | Contratos dispersos; difícil ver la API completa |
| Package separado `@mingarecords/api-contracts` | Versionado independiente | Overkill para 2 devs y 4 servicios |

**Decisión**: `docs/openapi/` en la raíz. Para 4 servicios con 2 desarrolladores, poder ver TODA la API de un vistazo en un PR es más valioso que la proximidad al código. Además, los contratos se usan para code review y discusión de producto, no solo para implementar.

### Estrategia de Code Generation

**En MVP, NO generamos código desde OpenAPI.** Razones:

1. 2 developers: el overhead de mantener un pipeline de codegen + tipos generados > escribirlos a mano.
2. TypeScript compartido: los tipos de request/response ya viven en `@mingarecords/shared` y son reutilizados por servicios y frontend.
3. Los schemas Zod (validación server-side) son manuales y deliberados: queremos control fino sobre mensajes de error en español.

**En v2**, cuando tengamos 10+ endpoints por servicio y/o third-party consumers, consideraremos `openapi-typescript` para generar tipos automáticamente desde los `.yaml`.

### Compartición de Tipos entre Servicios

```
┌─────────────────────────────────────────────────────────────┐
│               FLUJO DE TIPOS COMPARTIDOS                     │
│                                                              │
│  docs/openapi/*.yaml                                         │
│       │                                                      │
│       │ (documentación, no genera código automático)          │
│       ▼                                                      │
│  packages/shared/src/types/                                  │
│       │                                                      │
│       ├── api.ts          ← DTOs de request/response          │
│       ├── errors.ts       ← Tipos RFC 7807                   │
│       └── pagination.ts   ← PaginatedResponse<T>             │
│       │                                                      │
│       │ (importado por todos los servicios y frontend)        │
│       ▼                                                      │
│  apps/auth/         apps/catalog/      apps/streaming/       │
│  apps/payments/     apps/web/                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 6.3 Versionado de API

### Estrategia: URL Path Versioning

```
/api/v1/beats
/api/v1/auth/login
/api/v2/beats   ← cuando exista una v2
```

**Reglas de versionado**:

1. **MAYOR cambio incompatible** → nuevo prefijo (`/api/v2/`). Ej: cambiar `price` de `number` a `{ amount, currency }`.
2. **MENOR cambio compatible** → mismo prefijo, campo nuevo opcional. Ej: agregar `bpm` al response de beat que antes no se devolvía.
3. **PARCHES** → no afectan el contrato. Ej: fix de bug en lógica interna.

**¿Cuánto mantenemos versiones viejas?**
- Regla MVP: **solo la última versión está activa**. Cuando sacamos v2, v1 tiene 30 días de deprecación antes de eliminarse.
- Esto es viable porque solo tenemos 1 cliente (nuestro frontend). Si tuviéramos third-party consumers, necesitaríamos 6+ meses.

---

## 6.4 Endpoints por Microservicio — MVP

### 6.4.1 Auth Service (`/api/v1/auth`)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | Público | Crear cuenta (producer/artist) |
| `POST` | `/auth/login` | Público | Iniciar sesión, devuelve JWT |
| `POST` | `/auth/refresh` | Refresh token (cookie) | Renovar access token |
| `POST` | `/auth/verify-email` | Público (token en query) | Verificar email |
| `POST` | `/auth/forgot-password` | Público | Solicitar reset de password |
| `POST` | `/auth/reset-password` | Público (token en body) | Ejecutar reset de password |
| `GET` | `/auth/me` | JWT | Perfil del usuario autenticado |
| `PATCH` | `/auth/me` | JWT | Actualizar alias, avatar, bio |
| `GET` | `/users/:id` | JWT | Perfil público de un usuario (para otros servicios) |

### 6.4.2 Catalog Service (`/api/v1`)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `GET` | `/beats` | Opcional* | Listado paginado con filtros |
| `GET` | `/beats/:id` | Opcional* | Detalle de un beat |
| `POST` | `/beats` | JWT (producer) | Crear beat |
| `PATCH` | `/beats/:id` | JWT (dueño) | Actualizar metadata del beat |
| `DELETE` | `/beats/:id` | JWT (dueño) | Soft-delete beat |
| `PATCH` | `/beats/:id/audio-ready` | Service-to-service | Streaming notifica URLs listas |
| `PATCH` | `/beats/:id/sold` | Service-to-service | Payments notifica venta |
| `GET` | `/genres` | Público | Lista de géneros disponibles |
| `GET` | `/producers/:id` | Público | Perfil público de productor |
| `GET` | `/producers/:id/beats` | Público | Beats de un productor |
| `GET` | `/dashboard` | JWT (producer) | Stats del productor autenticado |

*\* Opcional: sin JWT devuelve datos públicos; con JWT incluye datos personalizados (favoritos, ownership).*

### 6.4.3 Streaming Service (`/api/v1/audio`)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `POST` | `/audio/upload/:beatId` | JWT (producer) | Subir archivo de audio WAV/MP3 |
| `GET` | `/audio/stream/:beatId` | Público | Streaming con Range Requests |
| `GET` | `/audio/preview/:beatId` | Público | Preview 30s con Range Requests |
| `GET` | `/audio/download/:licenseId` | JWT (comprador) | Descarga WAV original (licencia) |
| `DELETE` | `/audio/:beatId` | JWT (dueño) o service-to-service | Eliminar archivos de audio |

### 6.4.4 Payments Service (`/api/v1`)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `POST` | `/checkout` | JWT (artist) | Crear sesión de pago Stripe |
| `POST` | `/webhooks/stripe` | Stripe signature | Recibir eventos de Stripe |
| `GET` | `/transactions` | JWT | Historial de transacciones del usuario |
| `GET` | `/transactions/:id` | JWT (dueño) | Detalle de transacción |
| `POST` | `/refunds/:transactionId` | JWT (comprador) | Solicitar reembolso |
| `GET` | `/earnings` | JWT (producer) | Dashboard de ganancias |

---

## 6.5 Autenticación por Endpoint

### Cómo funciona

Cada endpoint se clasifica en uno de tres niveles:

| Nivel | Descripción | Header Requerido |
|-------|-------------|------------------|
| **Público** | Sin autenticación | Ninguno |
| **JWT requerido** | Requiere token válido | `Authorization: Bearer <jwt>` |
| **Service-to-service** | Solo llamado por otros servicios internos | `X-Service-Key: <shared-secret>` |

### Reglas de autorización

- **JWT contiene:** `{ sub: userId, role: 'producer' | 'artist', email: string }`
- **Role-based access:** endpoints como `POST /beats` requieren `role: 'producer'`. El middleware de Fastify rechaza con `403 Forbidden` si el rol no coincide.
- **Ownership-based access:** `PATCH /beats/:id` requiere que `beat.producerId === token.sub`. El caso de uso verifica esto, no el middleware.

### Validación JWT sin llamar a Auth Service

```
CADA SERVICIO (Catalog, Streaming, Payments):
┌─────────────────────────────────────────┐
│  1. Extraer token del header             │
│  2. jwt.verify(token, PUBLIC_KEY)        │  ← No llama a Auth
│  3. Extraer { sub, role, email }         │
│  4. Adjuntar a request (Fastify decorator)│
│  5. Pasar al handler                     │
└─────────────────────────────────────────┘

El JWT es auto-contenido y firmado con RS256.
La clave pública se comparte como variable de entorno.
```

Middleware compartido en `@mingarecords/shared`:

```typescript
// packages/shared/src/middleware/jwt-guard.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  role: 'producer' | 'artist';
  email: string;
}

export async function jwtGuard(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({
      type: 'https://mingarecords.com/errors/unauthenticated',
      title: 'Autenticación requerida',
      status: 401,
      detail: 'Incluí el header Authorization: Bearer <token>',
    });
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(
      token,
      process.env.JWT_PUBLIC_KEY!,
      { algorithms: ['RS256'] },
    ) as JwtPayload;

    // Adjuntar al request para que los handlers lo lean
    (request as any).user = payload;
  } catch (err) {
    return reply.status(401).send({
      type: 'https://mingarecords.com/errors/unauthenticated',
      title: 'Token inválido o expirado',
      status: 401,
      detail: 'El token no es válido o ya expiró. Renová tu sesión.',
    });
  }
}
```

---

## 6.6 Formato de Errores RFC 7807

### Estructura Base

Todos los errores de la API siguen [RFC 7807 Problem Details](https://datatracker.ietf.org/doc/html/rfc7807):

```typescript
// packages/shared/src/types/errors.ts
export interface ProblemDetail {
  type: string;       // URI que identifica el tipo de error
  title: string;      // Resumen legible del error
  status: number;     // Código HTTP
  detail: string;     // Explicación específica para esta instancia
  instance?: string;  // URI del endpoint que falló (opcional)
  errors?: ValidationError[];  // Errores de validación (opcional, 422)
}

export interface ValidationError {
  field: string;      // Campo que falló la validación
  message: string;    // Qué estaba mal
  code: string;       // Código de error legible por máquina
}
```

### Catálogo de Tipos de Error

| HTTP | `type` URI | `title` | Cuándo se usa |
|------|-----------|---------|---------------|
| 400 | `.../errors/bad-request` | Petición inválida | Body malformado, JSON inválido |
| 401 | `.../errors/unauthenticated` | Autenticación requerida | Sin token o token expirado |
| 403 | `.../errors/forbidden` | Acceso denegado | Rol insuficiente, no es dueño |
| 404 | `.../errors/not-found` | Recurso no encontrado | Beat, usuario, o entidad inexistente |
| 409 | `.../errors/conflict` | Conflicto | Email ya registrado, beat duplicado |
| 413 | `.../errors/payload-too-large` | Archivo demasiado grande | Audio > 100MB |
| 415 | `.../errors/unsupported-media-type` | Formato no soportado | Audio que no es WAV/MP3 |
| 422 | `.../errors/validation-failed` | Validación fallida | Campos inválidos (con `errors[]`) |
| 429 | `.../errors/rate-limited` | Demasiadas peticiones | Rate limit excedido |
| 500 | `.../errors/internal-error` | Error interno | Excepciones no manejadas |
| 502 | `.../errors/bad-gateway` | Error de servicio externo | Stripe, R2, u otro servicio caído |
| 503 | `.../errors/service-unavailable` | Servicio no disponible | Mantenimiento o overload |

### Ejemplos de Errores Reales

**Error 422 — Validación de creación de beat**:

```json
{
  "type": "https://mingarecords.com/errors/validation-failed",
  "title": "Validación fallida",
  "status": 422,
  "detail": "El beat no se pudo crear porque hay campos inválidos.",
  "instance": "/api/v1/beats",
  "errors": [
    {
      "field": "title",
      "message": "El título debe tener entre 3 y 100 caracteres.",
      "code": "title_too_short"
    },
    {
      "field": "price",
      "message": "El precio mínimo es $1.00 USD.",
      "code": "price_below_minimum"
    },
    {
      "field": "genreId",
      "message": "El género 'reggaetoon' no existe. Géneros válidos: trap, boom-bap, drill, lo-fi, rnb, afrobeat, dancehall, reggae.",
      "code": "invalid_genre"
    }
  ]
}
```

**Error 401 — Token expirado**:

```json
{
  "type": "https://mingarecords.com/errors/unauthenticated",
  "title": "Token inválido o expirado",
  "status": 401,
  "detail": "El token expiró hace 3 minutos. Usá el refresh token para renovar tu sesión."
}
```

**Error 409 — Conflicto al registrar**:

```json
{
  "type": "https://mingarecords.com/errors/conflict",
  "title": "Conflicto",
  "status": 409,
  "detail": "Ya existe una cuenta con el email producer@beats.com. ¿Querés iniciar sesión en vez de registrarte?"
}
```

**Error 413 — Audio muy pesado**:

```json
{
  "type": "https://mingarecords.com/errors/payload-too-large",
  "title": "Archivo demasiado grande",
  "status": 413,
  "detail": "El archivo pesa 142MB. El máximo permitido es 100MB. Comprimí el WAV a FLAC o MP3 320kbps."
}
```

### Manejo de Errores en Fastify

```typescript
// packages/shared/src/middleware/error-handler.ts
import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import type { ProblemDetail } from '../types/errors';

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  // Errores de validación Zod → 422
  if (error instanceof ZodError) {
    const problem: ProblemDetail = {
      type: 'https://mingarecords.com/errors/validation-failed',
      title: 'Validación fallida',
      status: 422,
      detail: 'La petición contiene campos inválidos.',
      instance: request.url,
      errors: error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      })),
    };
    return reply.status(422).send(problem);
  }

  // Errores de Fastify (validación de schema, etc.)
  if ('statusCode' in error && typeof error.statusCode === 'number') {
    const fastifyErr = error as FastifyError;
    return reply.status(fastifyErr.statusCode).send({
      type: `https://mingarecords.com/errors/${getErrorType(fastifyErr.statusCode)}`,
      title: fastifyErr.message,
      status: fastifyErr.statusCode,
      detail: fastifyErr.message,
      instance: request.url,
    });
  }

  // Error inesperado → 500
  request.log.error(error);
  return reply.status(500).send({
    type: 'https://mingarecords.com/errors/internal-error',
    title: 'Error interno',
    status: 500,
    detail: 'Ocurrió un error inesperado. El equipo ya fue notificado.',
    instance: request.url,
  });
}
```

---

## 6.7 Convenciones de Status Codes

| Código | Método | Significado en MingaRecords |
|--------|--------|-----------------------------|
| `200` | `GET`, `PATCH` | Operación exitosa, body con datos |
| `201` | `POST` | Recurso creado, body con el recurso + header `Location` |
| `202` | `POST /audio/upload` | Audio recibido, procesando (el beat está en estado `processing`) |
| `204` | `DELETE` | Recurso eliminado, sin body |
| `206` | `GET /audio/stream` | Partial Content (Range Request) |
| `301` | `GET` | Redirección permanente (slugs canónicos) |
| `302` | `POST /checkout` | Redirección a Stripe Checkout |
| `400` | Todos | Body malformado o parámetros inválidos |
| `401` | Todos | Falta token o token inválido/expirado |
| `403` | Todos | Token válido pero sin permisos (rol o ownership) |
| `404` | Todos | Recurso no existe (beat, usuario, transacción) |
| `409` | `POST` | Conflicto (email duplicado, beat ya existente) |
| `413` | `POST /audio/upload` | Archivo excede 100MB |
| `415` | `POST /audio/upload` | MIME type no es audio/wav ni audio/mpeg |
| `422` | `POST`, `PATCH` | Validación de campos fallida |
| `429` | Todos | Rate limit excedido |
| `500` | Todos | Error interno inesperado |

---

## 6.8 Payloads de Endpoints Clave

### 6.8.1 Crear Beat — `POST /api/v1/beats`

**Request** (JWT producer requerido):

```json
{
  "title": "Trap Banger 128",
  "genreId": "trap",
  "bpm": 140,
  "key": "Cm",
  "price": 29.99,
  "tags": ["dark", "808", "aggressive"],
  "description": "Beat oscuro con 808s pesados, ideal para barras agresivas."
}
```

**Response `201 Created`**:

```json
{
  "id": "beat_3f2a9b1c",
  "title": "Trap Banger 128",
  "slug": "trap-banger-128",
  "producerId": "user_k8x2m4p1",
  "producerAlias": "Kogui Beats",
  "genreId": "trap",
  "genreName": "Trap",
  "bpm": 140,
  "key": "Cm",
  "price": 29.99,
  "tags": ["dark", "808", "aggressive"],
  "description": "Beat oscuro con 808s pesados, ideal para barras agresivas.",
  "status": "pending_audio",
  "audioUrl": null,
  "previewUrl": null,
  "coverUrl": null,
  "plays": 0,
  "sales": 0,
  "createdAt": "2026-05-12T15:30:00Z",
  "updatedAt": "2026-05-12T15:30:00Z"
}
```

### 6.8.2 Obtener Catálogo — `GET /api/v1/beats`

**Query Parameters**:

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `page` | `integer` | `1` | Número de página |
| `limit` | `integer` | `20` (max `50`) | Resultados por página |
| `genre` | `string` | — | Filtrar por género (slug) |
| `minPrice` | `number` | — | Precio mínimo (inclusive) |
| `maxPrice` | `number` | — | Precio máximo (inclusive) |
| `bpmMin` | `integer` | — | BPM mínimo |
| `bpmMax` | `integer` | — | BPM máximo |
| `key` | `string` | — | Tonalidad (Cm, Fm, etc.) |
| `q` | `string` | — | Búsqueda full-text (título, tags) |
| `sort` | `string` | `recent` | `recent`, `popular`, `price_asc`, `price_desc` |

**Ejemplo Request:**

```
GET /api/v1/beats?genre=trap&minPrice=15&maxPrice=50&sort=popular&page=1&limit=10
```

**Response `200 OK`**:

```json
{
  "data": [
    {
      "id": "beat_3f2a9b1c",
      "title": "Trap Banger 128",
      "slug": "trap-banger-128",
      "producerAlias": "Kogui Beats",
      "producerId": "user_k8x2m4p1",
      "genreName": "Trap",
      "bpm": 140,
      "key": "Cm",
      "price": 29.99,
      "coverUrl": "https://cdn.mingarecords.com/covers/beat_3f2a9b1c.jpg",
      "previewUrl": "https://cdn.mingarecords.com/previews/beat_3f2a9b1c.mp3",
      "plays": 1240,
      "sales": 32,
      "createdAt": "2026-05-12T15:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalItems": 47,
    "totalPages": 5,
    "next": "/api/v1/beats?genre=trap&minPrice=15&maxPrice=50&sort=popular&page=2&limit=10",
    "prev": null
  }
}
```

### 6.8.3 Crear Checkout — `POST /api/v1/checkout`

**Request** (JWT artist requerido):

```json
{
  "beatId": "beat_3f2a9b1c"
}
```

**Response `302 Found`** — redirección a Stripe Checkout:

```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_a1b2c3..."
}
```

Alternativa si el cliente prefiere manejar la URL manualmente: `200 OK` con `checkoutUrl` en el body y sin redirect.

### 6.8.4 Subir Audio — `POST /api/v1/audio/upload/:beatId`

**Request** (`multipart/form-data`):

```
POST /api/v1/audio/upload/beat_3f2a9b1c
Content-Type: multipart/form-data

------WebKitFormBoundary
Content-Disposition: form-data; name="audio"; filename="trap_banger.wav"
Content-Type: audio/wav

<binary data>
------WebKitFormBoundary--
```

**Response `202 Accepted`**:

```json
{
  "beatId": "beat_3f2a9b1c",
  "status": "processing",
  "message": "Audio recibido. Se está generando el preview de 30 segundos. Esto toma menos de 30 segundos.",
  "estimatedSeconds": 25
}
```

---

## 6.9 OpenAPI YAML — Endpoints Clave

### 6.9.1 Crear Beat — `POST /beats`

```yaml
# docs/openapi/catalog.openapi.yaml (extracto)

openapi: "3.0.3"
info:
  title: MingaRecords Catalog API
  version: "1.0.0"
  description: |
    API de catálogo de beats. Gestiona la creación, búsqueda, 
    filtrado y visualización de beats y perfiles de productores.

servers:
  - url: http://localhost:4002/api/v1
    description: Desarrollo local
  - url: https://api.mingarecords.com/api/v1
    description: Producción

paths:
  /beats:
    post:
      summary: Crear un nuevo beat
      description: |
        Solo productores autenticados pueden crear beats.
        El beat se crea sin URLs de audio. El audio se sube después
        a través del Streaming Service.
      operationId: createBeat
      tags: [Beats]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateBeatRequest'
      responses:
        '201':
          description: Beat creado exitosamente
          headers:
            Location:
              schema:
                type: string
              description: URL del beat creado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BeatResponse'
        '401':
          $ref: '#/components/responses/Unauthenticated'
        '403':
          $ref: '#/components/responses/Forbidden'
        '422':
          $ref: '#/components/responses/ValidationFailed'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: |
        JWT obtenido via POST /auth/login. 
        Debe incluir claim `role: producer` para crear beats.

  schemas:
    CreateBeatRequest:
      type: object
      required: [title, genreId, price]
      properties:
        title:
          type: string
          minLength: 3
          maxLength: 100
          example: "Trap Banger 128"
          description: Título del beat. Debe ser único por productor.
        genreId:
          type: string
          example: "trap"
          description: Slug del género. Ver GET /genres para la lista válida.
        bpm:
          type: integer
          minimum: 40
          maximum: 300
          example: 140
          description: Beats por minuto.
        key:
          type: string
          pattern: '^[A-G][#b]?m?(maj|min)?$'
          example: "Cm"
          description: Tonalidad musical en notación estándar.
        price:
          type: number
          minimum: 1.00
          maximum: 9999.99
          example: 29.99
          description: Precio en USD. Mínimo $1.00.
        tags:
          type: array
          maxItems: 10
          items:
            type: string
            maxLength: 30
          example: ["dark", "808", "aggressive"]
          description: Tags para búsqueda. Máximo 10.
        description:
          type: string
          maxLength: 500
          example: "Beat oscuro con 808s pesados, ideal para barras agresivas."

    BeatResponse:
      type: object
      properties:
        id:
          type: string
          example: "beat_3f2a9b1c"
        title:
          type: string
          example: "Trap Banger 128"
        slug:
          type: string
          example: "trap-banger-128"
        producerId:
          type: string
          example: "user_k8x2m4p1"
        producerAlias:
          type: string
          example: "Kogui Beats"
        genreId:
          type: string
          example: "trap"
        genreName:
          type: string
          example: "Trap"
        bpm:
          type: integer
          example: 140
        key:
          type: string
          example: "Cm"
        price:
          type: number
          example: 29.99
        tags:
          type: array
          items:
            type: string
        description:
          type: string
        status:
          type: string
          enum: [pending_audio, processing, ready, sold]
          description: |
            pending_audio: sin audio subido
            processing: audio subido, preview en generación
            ready: audio y preview disponibles
            sold: al menos una licencia vendida
        audioUrl:
          type: string
          nullable: true
        previewUrl:
          type: string
          nullable: true
        coverUrl:
          type: string
          nullable: true
        plays:
          type: integer
        sales:
          type: integer
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    ProblemDetail:
      type: object
      required: [type, title, status, detail]
      properties:
        type:
          type: string
          format: uri
          example: "https://mingarecords.com/errors/validation-failed"
        title:
          type: string
          example: "Validación fallida"
        status:
          type: integer
          example: 422
        detail:
          type: string
          example: "El beat no se pudo crear porque hay campos inválidos."
        instance:
          type: string
          format: uri
          example: "/api/v1/beats"
        errors:
          type: array
          items:
            $ref: '#/components/schemas/ValidationError'

    ValidationError:
      type: object
      properties:
        field:
          type: string
          example: "price"
        message:
          type: string
          example: "El precio mínimo es $1.00 USD."
        code:
          type: string
          example: "price_below_minimum"

  responses:
    Unauthenticated:
      description: Token faltante, inválido o expirado
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ProblemDetail'
          example:
            type: "https://mingarecords.com/errors/unauthenticated"
            title: "Token inválido o expirado"
            status: 401
            detail: "El token no es válido o ya expiró."

    Forbidden:
      description: Sin permisos para esta acción
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ProblemDetail'
          example:
            type: "https://mingarecords.com/errors/forbidden"
            title: "Acceso denegado"
            status: 403
            detail: "Solo los productores pueden crear beats."

    ValidationFailed:
      description: Error de validación de campos
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ProblemDetail'
```

### 6.9.2 Crear Checkout — `POST /checkout`

```yaml
# docs/openapi/payments.openapi.yaml (extracto)

openapi: "3.0.3"
info:
  title: MingaRecords Payments API
  version: "1.0.0"
  description: |
    API de pagos y licencias. Maneja checkout con Stripe,
    procesamiento de webhooks, y entrega de licencias.

servers:
  - url: http://localhost:4004/api/v1
    description: Desarrollo local
  - url: https://api.mingarecords.com/api/v1
    description: Producción

paths:
  /checkout:
    post:
      summary: Crear sesión de pago
      description: |
        Inicia el flujo de compra de un beat. Solo artistas autenticados.
        Devuelve URL de Stripe Checkout para redirigir al comprador.
        El pago se confirma vía webhook, no en esta respuesta.
      operationId: createCheckout
      tags: [Checkout]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [beatId]
              properties:
                beatId:
                  type: string
                  pattern: '^beat_[a-z0-9]{8}$'
                  example: "beat_3f2a9b1c"
                  description: ID del beat a comprar
                successUrl:
                  type: string
                  format: uri
                  default: "https://mingarecords.com/dashboard/purchases?status=success"
                  description: URL de retorno tras pago exitoso
                cancelUrl:
                  type: string
                  format: uri
                  default: "https://mingarecords.com/catalog"
                  description: URL de retorno si cancela el pago
      responses:
        '200':
          description: URL de checkout generada (para manejo programático)
          content:
            application/json:
              schema:
                type: object
                properties:
                  checkoutUrl:
                    type: string
                    format: uri
                    example: "https://checkout.stripe.com/c/pay/cs_test_a1b2c3..."
                  transactionId:
                    type: string
                    example: "txn_8f4e2d1a"
                  expiresAt:
                    type: string
                    format: date-time
                    description: La sesión de Stripe expira en 30 minutos
        '302':
          description: Redirección directa a Stripe Checkout
          headers:
            Location:
              schema:
                type: string
                format: uri
        '401':
          $ref: '#/components/responses/Unauthenticated'
        '403':
          description: Solo artistas pueden comprar
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProblemDetail'
              example:
                type: "https://mingarecords.com/errors/forbidden"
                title: "Acceso denegado"
                status: 403
                detail: "Los productores no pueden comprar sus propios beats. Iniciá sesión como artista."
        '404':
          description: Beat no encontrado
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProblemDetail'
              example:
                type: "https://mingarecords.com/errors/not-found"
                title: "Beat no encontrado"
                status: 404
                detail: "El beat beat_xyz1234 no existe o fue eliminado."
        '409':
          description: Ya compraste este beat
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProblemDetail'
              example:
                type: "https://mingarecords.com/errors/conflict"
                title: "Conflicto"
                status: 409
                detail: "Ya compraste este beat el 10/05/2026. Descargalo desde tu dashboard."

  /webhooks/stripe:
    post:
      summary: Webhook de Stripe
      description: |
        Endpoint que recibe eventos de Stripe. NO es llamado por el frontend.
        Validado con firma webhook de Stripe (stripe-signature header).
      operationId: handleStripeWebhook
      tags: [Webhooks]
      security:
        - stripeSignature: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
      responses:
        '200':
          description: Evento procesado
          content:
            application/json:
              schema:
                type: object
                properties:
                  received:
                    type: boolean
                    example: true
        '400':
          description: Firma webhook inválida
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ProblemDetail'

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    stripeSignature:
      type: apiKey
      in: header
      name: stripe-signature
      description: Firma criptográfica de Stripe para validar webhooks
```

---

## 6.10 Rate Limiting

| Endpoint | Límite | Ventana | Razón |
|----------|--------|---------|-------|
| `POST /auth/login` | 10 req | 1 min por IP | Prevenir brute force |
| `POST /auth/register` | 5 req | 1 hora por IP | Prevenir spam de cuentas |
| `GET /beats` | 120 req | 1 min por IP | Proteger DB de scraping |
| `POST /beats` | 30 req | 1 hora por usuario | Prevenir spam de beats |
| `POST /audio/upload` | 10 req | 1 hora por usuario | Evitar saturación de storage |
| `GET /audio/stream` | 300 req | 1 min por IP | Streaming legítimo es alto |
| `POST /checkout` | 10 req | 1 min por usuario | Prevenir abuso |

Implementación: middleware compartido en `@mingarecords/shared` usando Upstash Redis con algoritmo sliding window.

---

## 6.11 Timeouts y Resiliencia

Siguiendo ADR 003:

| Escenario | Timeout | Comportamiento |
|-----------|---------|----------------|
| Request cliente → servicio | 5s | Error 504 si excede |
| Servicio → otro servicio | 5s | Circuit breaker tras 3 fallos |
| Upload de audio | 30s | Timeout extendido para archivos grandes |
| Stripe API | 10s | Timeout generoso, Stripe puede ser lento |
| Streaming Range Request | 30s | Para seeks largos en audio |

---

## 6.12 Validación de Schemas en Runtime

Fastify valida automáticamente requests contra schemas JSON Schema. Pero nosotros validamos con Zod en los handlers porque:

1. Mensajes de error en español (JSON Schema produce mensajes en inglés).
2. Validaciones complejas (ej: `genreId` debe existir en la DB, no solo ser un string).
3. Consistencia con el resto del código que ya usa Zod.

```typescript
// Ejemplo en un handler de Catalog
import { z } from 'zod';

const createBeatSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres.').max(100),
  genreId: z.string().min(1, 'El género es obligatorio.'),
  bpm: z.number().int().min(40).max(300).optional(),
  key: z.string().regex(/^[A-G][#b]?m?$/, 'Tonalidad inválida. Ej: Cm, F#m').optional(),
  price: z.number().min(1, 'El precio mínimo es $1.00 USD.').max(9999.99),
  tags: z.array(z.string().max(30)).max(10).optional(),
  description: z.string().max(500).optional(),
});

// En el handler:
export async function createBeatHandler(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const parsed = createBeatSchema.safeParse(request.body);
  if (!parsed.success) {
    // El error handler global atrapa ZodError y devuelve 422 RFC 7807
    throw parsed.error;
  }
  // ... caso de uso
}
```
