# 06 — Contratos de API

> **Versión:** 2.0 — **Fecha:** 19 de mayo de 2026

---

## 6.1 Filosofía de Diseño

La API de MingaRecords es un **Monolito Modular** con Express: un solo proceso, un solo deploy, routers por módulo. No hay comunicación HTTP entre servicios porque todo vive en el mismo proceso.

### Principios de Diseño de API

| Principio | Qué significa |
|-----------|---------------|
| **URLs como recursos, no acciones** | `/beats/{id}` no `/getBeatById` |
| **Consistencia en plurales** | Siempre plural: `/beats`, `/users`, `/transactions` |
| **Menos es más** | Solo los campos que el cliente NECESITA. Nada de respuestas de 5KB para mostrar un título. |
| **HATEOAS mínimo** | Solo links de paginación (`next`, `prev`). No hypermedia completo. |
| **Fail fast, fail loud** | Errores con mensajes accionables, nunca "algo salió mal". |

---

## 6.2 Estructura de la Aplicación

```
src/
├── app.ts                 # Express app + middleware global
├── modules/
│   ├── auth/
│   │   └── routes.ts      # router para /api/v1/auth/*
│   ├── beats/
│   │   └── routes.ts      # router para /api/v1/beats/*
│   ├── payments/
│   │   └── routes.ts      # router para /api/v1/payments/*
│   └── storage/
│       └── routes.ts      # router para /api/v1/storage/*
└── shared/
    ├── middleware/
    │   ├── jwt-guard.ts   # Middleware de autenticación
    │   ├── error-handler.ts
    │   └── rate-limiter.ts
    └── types/
        ├── errors.ts      # RFC 7807
        └── pagination.ts
```

### Montaje de Routers

```typescript
// src/app.ts
import express from 'express';
import authRoutes from './modules/auth/routes';
import beatsRoutes from './modules/beats/routes';
import paymentsRoutes from './modules/payments/routes';
import storageRoutes from './modules/storage/routes';

const app = express();

app.use(express.json());
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/beats', beatsRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/storage', storageRoutes);

// Error handler global (último middleware)
app.use(errorHandler);
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
2. **MENOR cambio compatible** → mismo prefijo, campo nuevo opcional. Ej: agregar `bpm` al response de beat.
3. **PARCHES** → no afectan el contrato. Ej: fix de bug en lógica interna.

**Mantenimiento de versiones**: solo la última versión está activa. Cuando saquemos v2, v1 tiene 30 días de deprecación. Viable porque solo tenemos 1 cliente (nuestro frontend).

---

## 6.4 Endpoints — MVP

### 6.4.1 Auth (`/api/v1/auth`)

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

### 6.4.2 Beats (`/api/v1/beats`)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `GET` | `/beats` | Opcional* | Listado paginado con filtros |
| `GET` | `/beats/:id` | Opcional* | Detalle de un beat |
| `POST` | `/beats` | JWT (producer) | Crear beat |
| `PATCH` | `/beats/:id` | JWT (dueño) | Actualizar metadata del beat |
| `DELETE` | `/beats/:id` | JWT (dueño) | Soft-delete beat |
| `GET` | `/genres` | Público | Lista de géneros disponibles |
| `GET` | `/producers/:id` | Público | Perfil público de productor |
| `GET` | `/producers/:id/beats` | Público | Beats de un productor |
| `GET` | `/dashboard` | JWT (producer) | Stats del productor autenticado |

*\* Opcional: sin JWT devuelve datos públicos; con JWT incluye datos personalizados (favoritos, ownership).*

### 6.4.3 Storage (`/api/v1/storage`)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `POST` | `/storage/upload/:beatId` | JWT (producer) | Subir archivo de audio WAV/MP3 |
| `GET` | `/storage/stream/:beatId` | Público | Streaming con Range Requests |
| `GET` | `/storage/preview/:beatId` | Público | Preview 30s con Range Requests |
| `GET` | `/storage/download/:licenseId` | JWT (comprador) | Descarga WAV original (licencia) |
| `DELETE` | `/storage/:beatId` | JWT (dueño) | Eliminar archivos de audio |

### 6.4.4 Pagos (`/api/v1/payments`)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `POST` | `/payments/checkout` | JWT (artist) | Crear preferencia de MercadoPago |
| `POST` | `/payments/webhooks/mercadopago` | MP signature | Recibir eventos de MercadoPago |
| `GET` | `/payments/transactions` | JWT | Historial de transacciones del usuario |
| `GET` | `/payments/transactions/:id` | JWT (dueño) | Detalle de transacción |
| `POST` | `/payments/refunds/:transactionId` | JWT (comprador) | Solicitar reembolso |
| `GET` | `/payments/earnings` | JWT (producer) | Dashboard de ganancias |

---

## 6.5 Autenticación

### Niveles de Acceso

| Nivel | Descripción | Header Requerido |
|-------|-------------|------------------|
| **Público** | Sin autenticación | Ninguno |
| **JWT requerido** | Requiere token válido | `Authorization: Bearer <jwt>` |

### Reglas de Autorización

- **JWT contiene:** `{ sub: userId, role: 'producer' | 'artist', email: string }`
- **Role-based access:** endpoints como `POST /beats` requieren `role: 'producer'`. El middleware de Express rechaza con `403 Forbidden` si el rol no coincide.
- **Ownership-based access:** `PATCH /beats/:id` requiere que `beat.producerId === token.sub`. El caso de uso verifica esto, no el middleware.

### Middleware JWT

```typescript
// src/shared/middleware/jwt-guard.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  role: 'producer' | 'artist';
  email: string;
}

export function jwtGuard(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
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
      process.env.JWT_SECRET!,
      { algorithms: ['HS256'] },
    ) as JwtPayload;

    (req as unknown as { user: JwtPayload }).user = payload;
    next();
  } catch {
    return res.status(401).json({
      type: 'https://mingarecords.com/errors/unauthenticated',
      title: 'Token inválido o expirado',
      status: 401,
      detail: 'El token no es válido o ya expiró. Renová tu sesión.',
    });
  }
}
```

> **Nota**: Usamos HS256 (simétrico) para el MVP. Un solo `JWT_SECRET` compartido es suficiente para 1 proceso. En v2, si separamos módulos a microservicios, migrar a RS256 (asimétrico) para evitar compartir secretos entre servicios.

---

## 6.6 Formato de Errores RFC 7807

### Estructura Base

Todos los errores siguen [RFC 7807 Problem Details](https://datatracker.ietf.org/doc/html/rfc7807):

```typescript
// src/shared/types/errors.ts
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
| 502 | `.../errors/bad-gateway` | Error de servicio externo | MercadoPago, R2 caído |

### Error Handler Global (Express)

```typescript
// src/shared/middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import type { ProblemDetail } from '../types/errors';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Zod validation errors → 422
  if (err instanceof ZodError) {
    const problem: ProblemDetail = {
      type: 'https://mingarecords.com/errors/validation-failed',
      title: 'Validación fallida',
      status: 422,
      detail: 'La petición contiene campos inválidos.',
      instance: req.originalUrl,
      errors: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      })),
    };
    return res.status(422).json(problem);
  }

  // Error con status code explícito
  if ('status' in err && typeof (err as any).status === 'number') {
    const status = (err as any).status;
    return res.status(status).json({
      type: `https://mingarecords.com/errors/${getErrorType(status)}`,
      title: err.message,
      status,
      detail: err.message,
      instance: req.originalUrl,
    });
  }

  // Error inesperado → 500
  console.error(err);
  return res.status(500).json({
    type: 'https://mingarecords.com/errors/internal-error',
    title: 'Error interno',
    status: 500,
    detail: 'Ocurrió un error inesperado. El equipo ya fue notificado.',
    instance: req.originalUrl,
  });
}

function getErrorType(status: number): string {
  const map: Record<number, string> = {
    400: 'bad-request',
    401: 'unauthenticated',
    403: 'forbidden',
    404: 'not-found',
    409: 'conflict',
    429: 'rate-limited',
  };
  return map[status] || 'internal-error';
}
```

### Ejemplos de Errores

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

---

## 6.7 Convenciones de Status Codes

| Código | Método | Significado en MingaRecords |
|--------|--------|-----------------------------|
| `200` | `GET`, `PATCH` | Operación exitosa, body con datos |
| `201` | `POST` | Recurso creado, body con el recurso + header `Location` |
| `202` | `POST /storage/upload` | Audio recibido, procesando |
| `204` | `DELETE` | Recurso eliminado, sin body |
| `206` | `GET /storage/stream` | Partial Content (Range Request) |
| `302` | `POST /payments/checkout` | Redirección a MercadoPago Checkout |
| `400` | Todos | Body malformado o parámetros inválidos |
| `401` | Todos | Falta token o token inválido/expirado |
| `403` | Todos | Token válido pero sin permisos |
| `404` | Todos | Recurso no existe |
| `409` | `POST` | Conflicto (email duplicado, beat ya existente) |
| `413` | `POST /storage/upload` | Archivo excede 100MB |
| `415` | `POST /storage/upload` | MIME type no es audio/wav ni audio/mpeg |
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
  "createdAt": "2026-05-19T15:30:00Z",
  "updatedAt": "2026-05-19T15:30:00Z"
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
      "createdAt": "2026-05-19T15:30:00Z"
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

### 6.8.3 Crear Checkout — `POST /api/v1/payments/checkout`

**Request** (JWT artist requerido):

```json
{
  "beatId": "beat_3f2a9b1c"
}
```

**Response `200 OK`** — URL de MercadoPago Preference:

```json
{
  "checkoutUrl": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=123456789-abcdef",
  "preferenceId": "123456789-abcdef",
  "transactionId": "txn_8f4e2d1a",
  "expiresAt": "2026-05-19T16:00:00Z"
}
```

El frontend redirige al usuario a `checkoutUrl`. La confirmación de pago llega vía webhook.

### 6.8.4 Webhook de MercadoPago — `POST /api/v1/payments/webhooks/mercadopago`

**Request** (verificado con `x-signature` header):

```json
{
  "action": "payment.created",
  "data": {
    "id": "123456789"
  },
  "application_id": "APP_ID",
  "type": "payment"
}
```

**Response `200 OK`**:

```json
{
  "received": true
}
```

### 6.8.5 Subir Audio — `POST /api/v1/storage/upload/:beatId`

**Request** (`multipart/form-data`):

```
POST /api/v1/storage/upload/beat_3f2a9b1c
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
  "message": "Audio recibido. Se está generando el preview de 30 segundos.",
  "estimatedSeconds": 25
}
```

---

## 6.9 Validación con Zod

Express no valida automáticamente, así que usamos Zod en cada handler:

```typescript
// modules/beats/routes.ts
import { Router } from 'express';
import { z } from 'zod';

const router = Router();

const createBeatSchema = z.object({
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres.').max(100),
  genreId: z.string().min(1, 'El género es obligatorio.'),
  bpm: z.number().int().min(40).max(300).optional(),
  key: z.string().regex(/^[A-G][#b]?m?$/, 'Tonalidad inválida. Ej: Cm, F#m').optional(),
  price: z.number().min(1, 'El precio mínimo es $1.00 USD.').max(9999.99),
  tags: z.array(z.string().max(30)).max(10).optional(),
  description: z.string().max(500).optional(),
});

router.post('/beats', jwtGuard, (req, res, next) => {
  const parsed = createBeatSchema.safeParse(req.body);
  if (!parsed.success) {
    return next(parsed.error); // El error handler global lo convierte en 422
  }
  // ... caso de uso
});

export default router;
```

---

## 6.10 Rate Limiting

Rate limiting en memoria con sliding window básico (sin Redis, presupuesto $0):

| Endpoint | Límite | Ventana | Razón |
|----------|--------|---------|-------|
| `POST /auth/login` | 10 req | 1 min por IP | Prevenir brute force |
| `POST /auth/register` | 5 req | 1 hora por IP | Prevenir spam de cuentas |
| `GET /beats` | 120 req | 1 min por IP | Proteger DB de scraping |
| `POST /beats` | 30 req | 1 hora por usuario | Prevenir spam de beats |
| `POST /storage/upload` | 10 req | 1 hora por usuario | Evitar saturación de storage |
| `GET /storage/stream` | 300 req | 1 min por IP | Streaming legítimo es alto |
| `POST /payments/checkout` | 10 req | 1 min por usuario | Prevenir abuso |

**Nota MVP**: al ser in-memory, los límites se resetean al reiniciar el proceso. Para un MVP de 1 semana con presupuesto $0, esto es aceptable. Si escalamos, migraremos a Redis.

---

## 6.11 Integración con MercadoPago

### Flujo de Pago

```
1. Frontend → POST /api/v1/payments/checkout { beatId }
2. Backend crea Preference en MercadoPago SDK
3. Backend devuelve { checkoutUrl, preferenceId }
4. Frontend redirige usuario a checkoutUrl
5. Usuario paga en MercadoPago
6. MercadoPago → POST /api/v1/payments/webhooks/mercadopago
7. Backend verifica firma, procesa payment, genera licencia
8. Frontend recibe notificación vía polling o WebSocket
```

### Verificación de Webhook

```typescript
import crypto from 'crypto';

function verifyMercadoPagoSignature(
  headers: Record<string, string | undefined>,
  body: unknown,
): boolean {
  const signature = headers['x-signature'];
  const requestId = headers['x-request-id'];
  const dataId = (body as any)?.data?.id;

  if (!signature || !requestId || !dataId) return false;

  // Verificar firma con la clave pública de MercadoPago
  // Implementación según docs oficiales de MP
  return true; // placeholder
}
```

### Eventos de MercadoPago a Manejar

| Evento `action` | Acción en MingaRecords |
|-----------------|------------------------|
| `payment.created` | Confirmar pago, generar licencia, notificar al comprador |
| `payment.updated` | Actualizar estado de transacción (refunds, chargebacks) |
