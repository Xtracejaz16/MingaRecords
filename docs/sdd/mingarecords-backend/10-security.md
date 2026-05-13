# 10 — Seguridad

> **Versión:** 1.0 — **Fecha:** 12 de mayo de 2026 — **Autores:** Sebastián Estrada, Yair Santiago Cetre

---

## 10.1 Principios de Seguridad

| # | Principio | Qué significa |
|---|-----------|---------------|
| **S1** | Defense in depth | Múltiples capas: red → aplicación → datos. Si una falla, la siguiente protege. |
| **S2** | Zero trust entre servicios | Un servicio no confía en otro solo porque está en la misma red. Cada request se autentica. |
| **S3** | Least privilege | Un servicio solo accede a los datos que necesita. Catalog nunca ve contraseñas. |
| **S4** | Fail secure | Un error de seguridad revoca acceso, no lo otorga. Token expirado = 401, no intentar refresh automático cross-service. |
| **S5** | Security by design, not by addon | La seguridad NO es una capa que se agrega al final. Se construye desde el día 1. |

---

## 10.2 Estrategia de Autenticación (JWT)

### 10.2.1 Arquitectura de Tokens

```
┌─────────────────────────────────────────────────────────────────┐
│                  JWT — TOKEN ARCHITECTURE                         │
│                                                                  │
│  ACCESS TOKEN (JWT — HS256)                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Header:  { "alg": "HS256", "typ": "JWT" }                  │ │
│  │ Payload: {                                                 │ │
│  │   "sub": "user-uuid",        // Subject (user ID)          │ │
│  │   "role": "producer",       // producer | artist           │ │
│  │   "email": "user@email.com",                               │ │
│  │   "iat": 1715472000,        // Issued at                   │ │
│  │   "exp": 1715475600,        // Expires (+1h)               │ │
│  │   "jti": "token-uuid"       // Unique token ID             │ │
│  │ }                                                          │ │
│  │ Signature: HMAC-SHA256(payload, JWT_ACCESS_SECRET)         │ │
│  └────────────────────────────────────────────────────────────┘ │
│  • Se envía en header: Authorization: Bearer <access_token>    │
│  • Expira en: 1 hora                                           │
│  • Auto-contenido: no requiere consultar Auth Service           │
│  • Se valida en middleware de cada servicio                     │
│                                                                  │
│  REFRESH TOKEN (opaco, almacenado en DB)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Generado como crypto.randomBytes(64).toString('hex')     │ │
│  │ • Se almacena HASH en auth.refresh_tokens                  │ │
│  │ • Se envía en cookie httpOnly: refreshToken                │ │
│  │ • Expira en: 7 días                                        │ │
│  │ • Rotación en cada uso                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│  • Cookie segura: httpOnly, Secure, SameSite=Strict, Path=/auth │
└─────────────────────────────────────────────────────────────────┘
```

### 10.2.2 ¿Por qué HS256 y no RS256?

| Factor | HS256 (simétrico) | RS256 (asimétrico) |
|--------|------------------|-------------------|
| Setup | 1 secret compartido | Par de claves pública/privada |
| Validación cross-service | Todos comparten el secret | Solo necesitan clave pública |
| Rotación de clave | Cambiar secret en todos los servicios | Solo cambia el que firma |
| Seguridad | Menos seguro si un servicio se compromete | Más seguro (la privada en 1 solo lugar) |
| Complejidad MVP | BAJA | MEDIA |

**Veredicto: HS256 en MVP.** Para 4 servicios con 2 developers, la simplicidad de HS256 gana. En v2, si el número de servicios crece o hay preocupación de compromiso de secret, migrar a RS256 + JWKS endpoint en Auth Service.

### 10.2.3 Rotación de Refresh Tokens

```
┌─────────────────────────────────────────────────────────────────┐
│            REFRESH TOKEN ROTATION (cada uso)                      │
│                                                                  │
│  1. Cliente → POST /auth/refresh                                 │
│     Cookie: refreshToken={old_token}                             │
│                                                                  │
│  2. Auth Service:                                                │
│     a. Hash(old_token) y buscar en auth.refresh_tokens           │
│     b. Verificar que no esté revoked, no expirado                │
│     c. Verificar que el user_id del token coincide con el JWT    │
│                                                                  │
│  3. Auth Service:                                                │
│     a. DELETE old_token de auth.refresh_tokens (invalida)        │
│     b. Generar new_token = crypto.randomBytes(64).toString('hex')│
│     c. INSERT hash(new_token) en auth.refresh_tokens             │
│     d. Emitir nuevo access_token JWT                             │
│                                                                  │
│  4. Response:                                                    │
│     200 { accessToken }                                          │
│     Set-Cookie: refreshToken={new_token};                        │
│       HttpOnly; Secure; SameSite=Strict; Path=/auth;             │
│       Max-Age=604800                                             │
│                                                                  │
│  VENTAJA: Si un refresh token es robado y usado, el token        │
│  original se invalida. El dueño legítimo nota que su sesión       │
│  expiró (porque su refresh token ya no es válido) y alerta.       │
│                                                                  │
│  DETECCIÓN DE REUSE (ataque de refresh token robado):            │
│  Si un refresh token YA FUE USADO (está revoked), pero se recibe │
│  de nuevo → REVOCAR TODOS los refresh tokens del usuario.         │
│  Esto indica que alguien tiene un token viejo que ya fue rotado. │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10.3 Diagrama Completo de Auth Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                               AUTH FLOW — MINGARECORDS                                │
│                                                                                      │
│  REGISTRO:                                                                           │
│  ─────────                                                                           │
│  CLIENTE                    AUTH SERVICE                 SUPABASE DB       RESEND     │
│    │                            │                            │                │       │
│    │ POST /auth/register       │                            │                │       │
│    │ {email, password, role}   │                            │                │       │
│    │──────────────────────────►│                            │                │       │
│    │                            │ 1. Validar email (Zod)    │                │       │
│    │                            │ 2. Validar password       │                │       │
│    │                            │    • Mín 8 chars          │                │       │
│    │                            │    • 1 mayúscula          │                │       │
│    │                            │    • 1 número             │                │       │
│    │                            │ 3. bcrypt.hash(password)  │                │       │
│    │                            │ 4. INSERT INTO auth.users │                │       │
│    │                            │───────────────────────────►                │       │
│    │                            │    ◄── user created        │                │       │
│    │                            │ 5. Generar verify_token    │                │       │
│    │                            │ 6. POST /emails ──────────────────────────────────►│
│    │  201 {userId}              │    {to, verifyLink}        │                │       │
│    │◄──────────────────────────│                            │                │       │
│    │                            │                            │                │       │
│  VERIFICACIÓN DE EMAIL:                                                              │
│  ──────────────────────                                                              │
│  CLIENTE (click link)       AUTH SERVICE                 SUPABASE DB                 │
│    │                            │                            │                       │
│    │ GET /auth/verify?token=X  │                            │                       │
│    │──────────────────────────►│                            │                       │
│    │                            │ 1. Buscar user con token  │                       │
│    │                            │───────────────────────────►                       │
│    │                            │ 2. UPDATE email_verified=true                     │
│    │                            │ 3. DELETE verify_token      │                       │
│    │  302 → /login?verified=1  │                            │                       │
│    │◄──────────────────────────│                            │                       │
│                                                                                      │
│  LOGIN:                                                                              │
│  ──────                                                                              │
│  CLIENTE                    AUTH SERVICE                 SUPABASE DB       REDIS      │
│    │                            │                            │                │       │
│    │ POST /auth/login          │                            │                │       │
│    │ {email, password}         │                            │                │       │
│    │──────────────────────────►│                            │                │       │
│    │                            │ 1. Buscar user por email  │                │       │
│    │                            │───────────────────────────►                │       │
│    │                            │    ◄── user + hash         │                │       │
│    │                            │ 2. bcrypt.compare(pwd,hash)│                │       │
│    │                            │ 3. Si no coincide → 401   │                │       │
│    │                            │ 4. Si email no verif → 403│                │       │
│    │                            │                            │                │       │
│    │                            │ 5. Generar accessToken     │                │       │
│    │                            │    jwt.sign({sub,role},    │                │       │
│    │                            │      JWT_SECRET,{exp:1h})  │                │       │
│    │                            │                            │                │       │
│    │                            │ 6. Generar refreshToken    │                │       │
│    │                            │    crypto.randomBytes(64)  │                │       │
│    │                            │ 7. INSERT refresh_tokens   │                │       │
│    │                            │───────────────────────────►                │       │
│    │                            │                            │                │       │
│    │                            │ 8. Registrar login en Redis│                │       │
│    │                            │    (rate limit anti-brute) │───────────────►       │
│    │                            │                            │                │       │
│    │  200 {accessToken, user}   │                            │                │       │
│    │  Set-Cookie: refreshToken  │                            │                │       │
│    │◄──────────────────────────│                            │                │       │
│                                                                                      │
│  REQUEST AUTENTICADO (cualquier endpoint protegido):                                  │
│  ──────────────────────────────────────────────────                                   │
│  CLIENTE                CUALQUIER SERVICIO                                            │
│    │                         │                                                        │
│    │ GET /catalog/beats      │                                                        │
│    │ Auth: Bearer <access>   │                                                        │
│    │────────────────────────►│                                                        │
│    │                         │ 1. Middleware JWT:                                     │
│    │                         │    jwt.verify(token, JWT_ACCESS_SECRET)                │
│    │                         │    • Verifica firma                                    │
│    │                         │    • Verifica expiración                               │
│    │                         │    • Extrae {sub, role, email}                         │
│    │                         │    • Adjunta a request.user                            │
│    │                         │ 2. Pasar al handler                                    │
│    │  200 {...}              │                                                        │
│    │◄────────────────────────│                                                        │
│                                                                                      │
│  REFRESH (cuando access token expiró):                                                │
│  ─────────────────────────────────────                                                 │
│  CLIENTE                    AUTH SERVICE                 SUPABASE DB                  │
│    │                            │                            │                       │
│    │ POST /auth/refresh        │                            │                       │
│    │ Cookie: refreshToken      │                            │                       │
│    │──────────────────────────►│                            │                       │
│    │                            │ 1. Hash(refreshToken)     │                       │
│    │                            │ 2. Buscar en DB           │                       │
│    │                            │───────────────────────────►                       │
│    │                            │    ◄── token row           │                       │
│    │                            │ 3. Si no existe o revoked  │                       │
│    │                            │    o expirado → 401        │                       │
│    │                            │ 4. ROTACIÓN:               │                       │
│    │                            │    DELETE old token        │                       │
│    │                            │    INSERT new token        │                       │
│    │                            │ 5. Emitir nuevo accessToken│                       │
│    │  200 {accessToken}         │                            │                       │
│    │  Set-Cookie: refreshToken  │                            │                       │
│    │  (nuevo refresh token)     │                            │                       │
│    │◄──────────────────────────│                            │                       │
│                                                                                      │
│  LOGOUT:                                                                             │
│  ───────                                                                             │
│  CLIENTE                    AUTH SERVICE                 SUPABASE DB                  │
│    │                            │                            │                       │
│    │ POST /auth/logout         │                            │                       │
│    │ Cookie: refreshToken      │                            │                       │
│    │──────────────────────────►│                            │                       │
│    │                            │ 1. Hash(refreshToken)     │                       │
│    │                            │ 2. DELETE/REVOKE token    │                       │
│    │                            │───────────────────────────►                       │
│    │  200 OK                    │                            │                       │
│    │  Clear-Cookie: refreshToken│                            │                       │
│    │◄──────────────────────────│                            │                       │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 10.4 Rate Limiting

### 10.4.1 Estrategia por Tipo de Endpoint

```
┌─────────────────────────────────────────────────────────────────┐
│              RATE LIMITING — LÍMITES POR ENDPOINT                 │
│                                                                  │
│  TIPO                   VENTANA     LÍMITE        APLICA A       │
│  ────                   ───────     ──────        ────────       │
│                                                                  │
│  PÚBLICOS SUAVES        1 min       60 req        /beats (list)  │
│  (catálogo, perfiles)                            /beats/:id      │
│                                                  /producers/:id  │
│                                                  /genres         │
│                                                                  │
│  AUTENTICACIÓN          1 min       10 req        /auth/login    │
│  (login, register)      5 min       20 req        /auth/register │
│                         15 min      10 req        /auth/forgot   │
│                                                                  │
│  AUTENTICADOS           1 min       60 req        /beats (CRUD)  │
│  (operaciones de                                           │  │
│   usuario normal)                                        │  │
│                                                                  │
│  UPLOAD DE AUDIO        1 min       3 req         /audio/upload  │
│  (archivos pesados)     15 min      15 req                       │
│                                                                  │
│  PAGOS                  1 min       5 req         /checkout      │
│  (creación de sesión)                                    │  │
│                                                                  │
│  WEBOOKS (Stripe)       1 min       ILIMITADO     /webhooks/*    │
│  (IP whitelist)         (solo IPs de Stripe)                     │
│                                                                  │
│  HEALTH/STATUS          1 min       120 req       /health        │
│  (monitoreo)                                             │  │
│                                                                  │
│  IMPLEMENTACIÓN: Sliding Window en Upstash Redis                  │
│  - Key: rate:{ip}:{endpoint}  o  rate:{userId}:{endpoint}        │
│  - Ventana: ZSET con scores = timestamps                         │
│  - Se reciclan automáticamente (ZREMRANGEBYSCORE cada request)   │
│                                                                  │
│  RESPUESTA 429:                                                   │
│    HTTP 429 Too Many Requests                                     │
│    Retry-After: 45                                                │
│    X-RateLimit-Limit: 60                                          │
│    X-RateLimit-Remaining: 0                                       │
│    X-RateLimit-Reset: 1715475660                                  │
│    Content-Type: application/problem+json                         │
│    {                                                              │
│      "type": "https://api.mingarecords.com/errors/rate-limited", │
│      "title": "Too Many Requests",                                │
│      "status": 429,                                               │
│      "detail": "Rate limit exceeded. Try again in 45 seconds."   │
│    }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

### 10.4.2 Anti-Brute Force (Login)

```
┌─────────────────────────────────────────────────────────────────┐
│            ANTI-BRUTE FORCE — LOGIN ENDPOINT                      │
│                                                                  │
│  Capa 1: Rate limiting por IP (Upstash Redis)                    │
│    • 10 intentos/minuto/IP                                       │
│    • Al exceder: 429 + CAPTCHA requirement                       │
│                                                                  │
│  Capa 2: Account lockout (DB)                                    │
│    • 5 intentos fallidos consecutivos → cuenta bloqueada 15 min  │
│    • Contador en Redis: login_fail:{userId} TTL=900              │
│    • Al bloquear: email de alerta al usuario (Resend)            │
│    • Desbloqueo automático tras 15 min (TTL expira)              │
│                                                                  │
│  Capa 3: Delay progresivo (tarpit)                               │
│    • Intento 1-3: respuesta inmediata                            │
│    • Intento 4: delay 2s                                         │
│    • Intento 5: delay 5s                                         │
│    • Intento 6+: delay 10s                                       │
│    • El delay es server-side (no visible en la respuesta)        │
│    • Esto ralentiza ataques de diccionario sin afectar UX normal │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10.5 CORS Configuration

```typescript
// Configuración centralizada en el API Gateway (Cloudflare Worker)
// y replicada en cada servicio Fastify como fallback.

const CORS_ORIGINS = {
  development: ['http://localhost:5173', 'http://localhost:3000'],
  staging: [
    'https://staging.mingarecords.vercel.app',
    'https://staging-app.mingarecords.com',
  ],
  production: [
    'https://mingarecords.vercel.app',
    'https://app.mingarecords.com',
  ],
};

// Fastify CORS config:
const corsConfig = {
  origin: CORS_ORIGINS[env.NODE_ENV],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Correlation-ID',
    'X-Requested-With',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'Retry-After',
    'X-Correlation-ID',
  ],
  credentials: true,   // Permite cookies (refreshToken httpOnly)
  maxAge: 86400,       // Cache preflight por 24h
};

// Preflight OPTIONS responde 204 sin body.
// Si el origin no está en la whitelist → 403 Forbidden con RFC 7807.
```

---

## 10.6 Input Validation (Zod Schemas)

### 10.6.1 Registro de Usuario

```typescript
// apps/auth/src/domain/value-objects/email.ts
const emailSchema = z
  .string()
  .email('Email inválido')
  .max(255, 'Email demasiado largo')
  .transform((e) => e.toLowerCase().trim());

// apps/auth/src/domain/value-objects/password.ts
const passwordSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .max(128, 'Máximo 128 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial');

// apps/auth/src/application/use-cases/register.ts
const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['producer', 'artist']),
  alias: z.string().min(3).max(100).optional(),
});
```

### 10.6.2 Creación de Beat

```typescript
const createBeatSchema = z.object({
  title: z
    .string()
    .min(3, 'Título muy corto')
    .max(150, 'Título muy largo'),
  genre: z
    .string()
    .min(2)
    .max(50),
  bpm: z
    .number()
    .int()
    .min(20, 'BPM mínimo 20')
    .max(300, 'BPM máximo 300')
    .optional(),
  key: z
    .string()
    .regex(
      /^[A-G](b|#)?\s*(major|minor|maj|min)?$/i,
      'Key inválido. Ej: "C minor", "F# major"'
    )
    .optional(),
  priceCents: z
    .number()
    .int()
    .min(99, 'Precio mínimo $0.99 USD')
    .max(999999, 'Precio excede el máximo'),
  description: z
    .string()
    .max(2000, 'Descripción muy larga')
    .optional(),
  tags: z
    .array(z.string().min(2).max(30))
    .max(10, 'Máximo 10 tags')
    .optional(),
});
```

### 10.6.3 Checkout

```typescript
const checkoutSchema = z.object({
  beatId: z.string().uuid('Beat ID inválido'),
  licenseType: z.enum(['non_exclusive', 'exclusive']).default('non_exclusive'),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});
```

### 10.6.4 Validación Centralizada

```typescript
// Middleware de Fastify que valida request body con Zod
// Compartido en @mingarecords/shared/middleware/validate.ts

import { z, ZodError } from 'zod';
import { FastifyRequest, FastifyReply } from 'fastify';

export function validateBody<T>(schema: z.ZodSchema<T>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      request.body = schema.parse(request.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({
          type: 'https://api.mingarecords.com/errors/validation-error',
          title: 'Validation Error',
          status: 400,
          detail: 'Request body no cumple con el schema esperado',
          errors: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
            code: e.code,
          })),
        });
      }
      throw error;
    }
  };
}
```

---

## 10.7 File Upload Validation

### 10.7.1 Validación de Audio — Triple Capa

```
┌─────────────────────────────────────────────────────────────────┐
│           VALIDACIÓN DE ARCHIVOS DE AUDIO                         │
│                                                                  │
│  CAPA 1: VALIDACIÓN PRE-UPLOAD (cliente → servidor)              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Content-Type header: audio/wav, audio/mpeg, audio/aiff   │ │
│  │ • Content-Length header: 1MB - 100MB                       │ │
│  │ • Validación de extensión: .wav, .mp3, .aiff, .flac       │ │
│  │ • Si falla: 400 Bad Request (antes de recibir el archivo)  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  CAPA 2: VALIDACIÓN DE MAGIC BYTES (servidor, primeros bytes)    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ const magicBytes = buffer.slice(0, 4);                     │ │
│  │                                                            │ │
│  │ // WAV:  RIFF header                                        │ │
│  │ if (magicBytes[0]===0x52 && magicBytes[1]===0x49 &&       │ │
│  │     magicBytes[2]===0x46 && magicBytes[3]===0x46) → WAV   │ │
│  │                                                            │ │
│  │ // MP3:  Frame sync or ID3 tag                              │ │
│  │ if (magicBytes[0]===0xFF && (magicBytes[1]&0xE0)===0xE0)  │ │
│  │    → MP3                                                    │ │
│  │ if (magicBytes[0]===0x49 && magicBytes[1]===0x44 &&       │ │
│  │     magicBytes[2]===0x33) → MP3 (ID3 tag)                 │ │
│  │                                                            │ │
│  │ // AIFF: FORM header                                       │ │
│  │ if (magicBytes[0]===0x46 && magicBytes[1]===0x4F &&       │ │
│  │     magicBytes[2]===0x52 && magicBytes[3]===0x4D) → AIFF  │ │
│  │                                                            │ │
│  │ // FLAC: fLaC marker                                       │ │
│  │ if (magicBytes[0]===0x66 && magicBytes[1]===0x4C &&       │ │
│  │     magicBytes[2]===0x61 && magicBytes[3]===0x43) → FLAC  │ │
│  │                                                            │ │
│  │ // NINGUNO → 415 Unsupported Media Type                    │ │
│  │ (NUNCA confiar en la extensión del archivo)                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  CAPA 3: VALIDACIÓN CON ffprobe (servidor, post-upload)         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ffprobe -v quiet -print_format json -show_format          │ │
│  │         -show_streams temp_upload.bin                      │ │
│  │                                                            │ │
│  │ {                                                          │ │
│  │   "format": {                                              │ │
│  │     "format_name": "wav",       // Debe ser audio         │ │
│  │     "duration": "180.5",        // 30s — 600s (10 min)    │ │
│  │     "size": "52428800"          // Confirmar tamaño real  │ │
│  │   },                                                        │ │
│  │   "streams": [{                                             │ │
│  │     "codec_type": "audio",      // SOLO audio, no video   │ │
│  │     "sample_rate": "44100",     // 44100 o 48000           │ │
│  │     "channels": 2               // 1 o 2                   │ │
│  │   }]                                                       │ │
│  │ }                                                          │ │
│  │                                                            │ │
│  │ RECHAZAR SI:                                               │ │
│  │ • codec_type != "audio" (archivo de video disfrazado)     │ │
│  │ • duration < 30s (muy corto para ser un beat)             │ │
│  │ • duration > 600s (10 min, razonable para beat largo)     │ │
│  │ • sample_rate no es 44100 o 48000                          │ │
│  │ • channels > 2 (no es estéreo/mono normal)                │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 10.7.2 Sanitización de Metadata

```typescript
// Después de validar, sanitizar metadata del archivo
// para eliminar datos potencialmente maliciosos o personales

// ffmpeg strip metadata:
// ffmpeg -i input.wav -map_metadata -1 -c copy clean.wav

// Esto elimina:
// - Geolocalización (si el DAW la incrustó)
// - Nombres de archivo del sistema del productor
// - Software/hardware usado (fingerprinting)
// - Comentarios personales

// Solo preservamos metadata técnica: duration, sample rate, channels, bitrate
```

---

## 10.8 OWASP Top 10 — Aplicado a MingaRecords

| # | Riesgo OWASP | Cómo se mitiga en MingaRecords | Prioridad |
|---|-------------|-------------------------------|-----------|
| **A01** | Broken Access Control | JWT con middleware en cada servicio. Roles (`producer`/`artist`) validados en application layer. Un productor no puede editar beats de otro productor. Un artista no puede acceder al dashboard de productor. Soft-delete con verificación de ownership. | 🔴 CRÍTICA |
| **A02** | Cryptographic Failures | bcrypt (12 rounds) para passwords. JWT con HS256 y secret ≥ 64 chars. TLS 1.3 en todas las conexiones. Refresh tokens hasheados en DB. Secrets nunca en código ni logs. | 🔴 CRÍTICA |
| **A03** | Injection | Prisma ORM parametriza todas las queries SQL — no hay SQL injection posible. Búsqueda full-text con `to_tsvector` parametrizado. Nunca se concatena input del usuario en queries. | 🟡 ALTA |
| **A04** | Insecure Design | SDD documenta cada decisión de seguridad. Threat model básico en este documento. Principio de least privilege entre servicios. Schemas de DB separados. | 🟡 ALTA |
| **A05** | Security Misconfiguration | Zod valida environment variables al inicio. Si falta una variable requerida, el servicio no arranca. CORS configurado con whitelist. Rate limiting activo en todos los endpoints públicos. Headers de seguridad configurados (ver 10.12). | 🟡 ALTA |
| **A06** | Vulnerable Components | Dependabot activado en GitHub para PRs automáticos de seguridad. `pnpm audit` en CI. Librerías mínimas: Fastify, Prisma, Zod, Stripe SDK. Se evitan dependencias innecesarias. | 🟡 ALTA |
| **A07** | Auth Failures | Rate limiting anti-brute force en login. Account lockout tras 5 intentos. JWT expira en 1 hora. Refresh token rotation con detección de reuse. Email verification obligatoria antes de comprar/vender. | 🔴 CRÍTICA |
| **A08** | Software/Data Integrity | CI/CD con GitHub Actions auditable. Stripe webhooks verificados con firma (`stripe.webhooks.constructEvent`). Archivos de audio validados por magic bytes (no por extensión). | 🟡 ALTA |
| **A09** | Logging/Monitoring Failures | Logs estructurados JSON con Pino. Correlation IDs en cada request. Sentry para errores en producción. Logs de seguridad (login fallido, token inválido, rate limit hit) nunca contienen secrets. | 🟡 ALTA |
| **A10** | SSRF | Los servicios solo hacen requests HTTP a URLs configuradas en environment variables. No se construyen URLs con input del usuario. Stripe webhooks verifican IP de origen. | 🟢 MEDIA |

---

## 10.9 Payment Service Isolation

```
┌─────────────────────────────────────────────────────────────────┐
│           AISLAMIENTO DEL SERVICIO DE PAGOS                       │
│                                                                  │
│  NIVEL DE RED:                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Payments Service tiene su PROPIO schema en PostgreSQL    │ │
│  │   (payments.*) — ningún otro servicio accede a estas tablas│ │
│  │ • Catalog, Auth, Streaming NO tienen credenciales para     │ │
│  │   el schema payments.*                                     │ │
│  │ • Railway asigna un DOMINIO ÚNICO por servicio             │ │
│  │ • CORS en Payments solo permite requests desde el frontend │ │
│  │   y desde servicios internos (IP whitelist en v2)          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  NIVEL DE DATOS:                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • payments.transactions contiene datos financieros:         │ │
│  │   amount_cents, platform_fee_cents, producer_earnings_cents│ │
│  │ • NINGÚN otro servicio lee/escribe estas tablas            │ │
│  │ • Catalog solo recibe PATCH /beats/:id/sold (sin datos $) │ │
│  │ • Auth solo recibe GET /users/:id (email, alias)           │ │
│  │ • Los datos financieros NUNCA se loguean completos:        │ │
│  │   logger.info({ transactionId, status }) // OK             │ │
│  │   logger.info({ transaction })            // NUNCA!        │ │
│  │   (contiene datos sensibles del comprador)                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  NIVEL DE APLICACIÓN:                                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Payments Service es el ÚNICO que conoce la API key de    │ │
│  │   Stripe (STRIPE_SECRET_KEY)                               │ │
│  │ • Payments Service es el ÚNICO que expone endpoint de      │ │
│  │   webhook para Stripe                                      │ │
│  │ • Los webhooks se verifican con STRIPE_WEBHOOK_SECRET      │ │
│  │   usando stripe.webhooks.constructEvent()                  │ │
│  │ • Si la firma no coincide → 401 (podría ser un atacante)   │ │
│  │ • Stripe maneja datos de tarjeta de crédito (PCI DSS)      │ │
│  │   Nuestro servicio NUNCA ve números de tarjeta             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  POR QUÉ NO STRIPE CONNECT EN MVP:                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Stripe Connect permite payouts automáticos a productores,  │ │
│  │ pero agrega complejidad significativa:                     │ │
│  │ • Onboarding de productores (KYC si > cierto volumen)      │ │
│  │ • Manejo de cuentas conectadas                             │ │
│  │ • Tarifas adicionales de Connect                           │ │
│  │ • 2 developers no pueden mantener esto en MVP              │ │
│  │                                                            │ │
│  │ ESTRATEGIA MVP: Payouts manuales                           │ │
│  │ • Plataforma recibe todo el pago en Stripe                 │ │
│  │ • Cada 1° de mes: exportar CSV de ganancias por productor  │ │
│  │ • Transferencia bancaria manual a cada productor           │ │
│  │ • Esto escala hasta ~30 productores activos                │ │
│  │ • v2: Stripe Connect para automatizar                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10.10 Audio File Access Control

```
┌─────────────────────────────────────────────────────────────────┐
│         CONTROL DE ACCESO A ARCHIVOS DE AUDIO                     │
│                                                                  │
│  PROBLEMA:                                                       │
│  Los archivos en R2 son públicos (cualquiera con la URL          │
│  puede descargarlos). Necesitamos que:                            │
│  1. Los previews (30s) sean accesibles libremente                │
│  2. Los originales (WAV completos) SOLO se descarguen            │
│     después de una compra verificada                              │
│  3. Las licencias (PDFs) solo las descargue el comprador         │
│                                                                  │
│  SOLUCIÓN: URLS FIRMADAS + TOKEN AUTH                            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ PREVIEWS (acceso público):                                  │ │
│  │ • R2 bucket público para /previews/*                        │ │
│  │ • BunnyCDN sirve el preview con CORS headers                │ │
│  │ • No requiere autenticación                                 │ │
│  │ • Rate limiting: 60 req/min/IP                              │ │
│  │                                                            │ │
│  │ ORIGINALS (acceso restringido):                             │ │
│  │ • R2 bucket con acceso RESTRINGIDO para /originals/*        │ │
│  │ • BunnyCDN Token Authentication habilitado                  │ │
│  │ • Cuando se completa una compra:                            │ │
│  │   1. Payments Service genera URL firmada con token:         │ │
│  │      https://cdn.mingarecords.com/originals/{beatId}/      │ │
│  │        original.wav?token={TOKEN}&expires={UNIX_TS}        │ │
│  │   2. Token generado con HMAC-SHA256 usando                  │ │
│  │      BUNNYCDN_TOKEN_KEY (secreto)                           │ │
│  │   3. Token expira en 24 horas                               │ │
│  │   4. IP del comprador incluida en el token (opcional)       │ │
│  │   5. URL se envía en el email de entrega de licencia        │ │
│  │   6. URL se guarda en payments.transactions.license_url     │ │
│  │   7. El comprador puede regenerar la URL desde su dashboard │ │
│  │                                                            │ │
│  │ LICENCIAS (acceso restringido):                             │ │
│  │ • Mismo mecanismo que originals                             │ │
│  │ • Token expira en 30 días (la licencia es del comprador)    │ │
│  │ • Se puede regenerar desde el historial de compras          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  IMPLEMENTACIÓN EN PAYMENTS SERVICE:                              │
│                                                                  │
│  ```typescript                                                    │
│  import crypto from 'node:crypto';                                │
│                                                                   │
│  function generateBunnyCDNSignedUrl(                                │
│    path: string,                                                   │
│    expiresInSeconds: number = 86400,  // 24h                       │
│    ipAddress?: string                                              │
│  ): string {                                                       │
│    const expires = Math.floor(Date.now() / 1000) + expiresInSeconds;│
│    const tokenString = ipAddress                                   │
│      ? `${BUNNYCDN_TOKEN_KEY}${path}${expires}${ipAddress}`      │
│      : `${BUNNYCDN_TOKEN_KEY}${path}${expires}`;                 │
│    const token = crypto                                           │
│      .createHash('sha256')                                        │
│      .update(tokenString)                                         │
│      .digest('base64url');                                        │
│                                                                   │
│    const url = new URL(path, BUNNYCDN_BASE_URL);                 │
│    url.searchParams.set('token', token);                          │
│    url.searchParams.set('expires', String(expires));              │
│    if (ipAddress) url.searchParams.set('ip', ipAddress);           │
│                                                                   │
│    return url.toString();                                         │
│  }                                                                │
│  ```                                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10.11 Protección de Datos

### 10.11.1 Datos que NUNCA se loguean

```typescript
// Lista negra de campos que NUNCA aparecen en logs
const NEVER_LOG = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  'creditCard',
  'cardNumber',
  'cvv',
  'ssn',
  'stripeSecretKey',
  'jwtSecret',
];

// Pino serializers para redactar campos sensibles
const redactConfig = {
  redact: {
    paths: [
      'password',
      'passwordHash',
      '*.token',
      '*.secret',
      'headers.authorization',
      'headers.cookie',
      'body.password',
      'body.creditCard',
    ],
    censor: '[REDACTED]',
  },
};
```

### 10.11.2 GDPR y Privacidad Básica

| Requisito | Implementación |
|-----------|---------------|
| **Account deletion** | Soft-delete usuario + anonimizar datos personales. Beats se despublican pero no se eliminan (si tienen ventas). |
| **Data export** | Endpoint `GET /auth/me/export` devuelve JSON con todos los datos del usuario. |
| **Consentimiento** | Checkbox en registro: "Acepto los términos y condiciones". Se guarda timestamp en `auth.users.terms_accepted_at`. |
| **Cookies consent** | Solo usamos cookie técnica (refreshToken httpOnly). No requiere consentimiento GDPR. |
| **Email change** | Verificar nuevo email antes de actualizar. Email viejo recibe notificación. |
| **Data retention** | Usuarios inactivos 2+ años: email de aviso → si no responden en 30 días → anonimización. |

---

## 10.12 Security Headers

```typescript
// Middleware de Fastify que agrega headers de seguridad
// en TODOS los servicios

import helmet from '@fastify/helmet';

await fastify.register(helmet, {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://js.stripe.com'],
      frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
      connectSrc: [
        "'self'",
        'https://api.mingarecords.com',
        'https://cdn.mingarecords.com',
      ],
      mediaSrc: ["'self'", 'https://cdn.mingarecords.com'],
      imgSrc: ["'self'", 'https://*.supabase.co', 'data:'],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Necesario para cargar audio cross-origin
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Para el CDN
  hsts: {
    maxAge: 31536000,    // 1 año
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});
```

---

## 10.13 Plan de Respuesta a Incidentes (2-Dev Team)

```
┌─────────────────────────────────────────────────────────────────┐
│         INCIDENT RESPONSE — PARA EQUIPO DE 2 PERSONAS            │
│                                                                  │
│  QUÉ HACER ANTE UN INCIDENTE DE SEGURIDAD:                       │
│                                                                  │
│  1. DETECCIÓN (¿cómo nos enteramos?)                             │
│     • Alerta de Sentry (error spike en Payments)                 │
│     • Email de Stripe (actividad inusual)                        │
│     • Usuario reporta por email/soporte                         │
│     • Monitoreo de GitHub (dependencia vulnerable)               │
│                                                                  │
│  2. CONTENCIÓN (primeros 15 minutos)                             │
│     a. ¿Es un incidente real o falsa alarma?                    │
│     b. Si es real: NOTIFICAR al otro developer (WhatsApp/Discord)│
│     c. Si es crítico (datos expuestos, pagos fraudulentos):     │
│        → Rotar JWT_SECRET inmediatamente                        │
│        → Pausar endpoint de checkout (feature flag)             │
│        → Revocar todos los refresh tokens                       │
│        → Contactar a Stripe si hay actividad fraudulenta        │
│                                                                  │
│  3. ANÁLISIS (primeras 2 horas)                                  │
│     a. Revisar logs con correlation ID del incidente            │
│     b. Determinar alcance: ¿qué datos/vos se vieron afectados?  │
│     c. Identificar root cause                                   │
│                                                                  │
│  4. REMEDIACIÓN                                                  │
│     a. Fix → PR → Review → Deploy                                │
│     b. Verificar que el fix funciona (test + staging)            │
│                                                                  │
│  5. COMUNICACIÓN                                                 │
│     a. Si se expusieron datos de usuarios: notificar en < 72h   │
│        (GDPR requirement) via email                              │
│     b. Post-mortem interno (doc en docs/incidents/)              │
│     c. Si es relevante: transparencia pública en blog/redes      │
│                                                                  │
│  POST-MORTEM TEMPLATE (docs/incidents/YYYY-MM-DD-slug.md):       │
│  • Fecha y hora del incidente                                   │
│  • Duración (detección → resolución)                             │
│  • Impacto (usuarios afectados, datos comprometidos)             │
│  • Root cause                                                   │
│  • Timeline de eventos                                          │
│  • Qué funcionó bien en la respuesta                            │
│  • Qué mejorar                                                   │
│  • Action items (con dueño y deadline)                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 10.14 Checklist de Seguridad Pre-Producción

```
☐ JWT_ACCESS_SECRET y JWT_REFRESH_SECRET ≥ 64 caracteres aleatorios
☐ bcrypt salt rounds = 12 (verificado en código)
☐ Rate limiting activo en todos los endpoints públicos
☐ CORS configurado con whitelist exacta (no wildcard *)
☐ Helmet middleware activo en todos los servicios
☐ Zod validation en todos los request bodies
☐ Magic bytes validation en upload de audio
☐ Stripe webhook signature verification (stripe.webhooks.constructEvent)
☐ BunnyCDN Token Authentication para /originals/* y /licenses/*
☐ CORS credentials: true para cookies httpOnly
☐ Cookie refreshToken: httpOnly, Secure, SameSite=Strict
☐ Dependabot activado en GitHub
☐ pnpm audit en CI (fail on critical/high vulnerabilities)
☐ Logs redactan datos sensibles (password, token, secret)
☐ Variables de entorno validadas con Zod al iniciar
☐ Sin secrets en código, .env, o Docker images
☐ Account lockout después de 5 intentos fallidos
☐ Email verification obligatoria para acciones sensibles
☐ Soft delete para datos de usuario (no DELETE permanente)
☐ Incident response plan documentado y accesible
```

---

## 10.15 Resumen de Decisiones de Seguridad

| Decisión | ¿Por qué? | Alternativa descartada |
|----------|-----------|----------------------|
| HS256 sobre RS256 | Simplicidad para 4 servicios con 2 devs | RS256: setup más complejo, beneficio marginal en MVP |
| Refresh tokens opacos (no JWT) | Si se roban, se revocan individualmente sin invalidar todos | JWT como refresh token: no se puede revocar sin blacklist |
| Rotación de refresh token | Detecta token reuse (robo) automáticamente | Token fijo sin rotación: vulnerable a robo silencioso |
| BunnyCDN Token Auth para downloads | Protege archivos WAV completos sin proxy de aplicación | Proxy app: consume ancho de banda del servidor |
| Rate limiting por IP + userId | Protege endpoints públicos y autenticados | Solo IP: usuarios autenticados detrás de NAT comparten límite |
| Zod para input validation | Coherencia con el resto del stack, types inferidos | Joi/Yup: syntax diferente al resto del proyecto |
| Stripe maneja PCI DSS | Nunca tocamos datos de tarjeta, compliance delegado | Procesar tarjetas nosotros: PCI DSS Level 1 es imposible para 2 devs |
| Payouts manuales en MVP | Complejidad de Stripe Connect no justificada en MVP | Stripe Connect: ideal para v2 cuando hay > 50 productores |
| Una DB compartida con schemas | Simplicidad operativa sin comprometer aislamiento lógico | DBs separadas: overhead de gestión para 2 devs |
| Helmet para security headers | Estándar en Fastify, configuración en 10 líneas | Headers manuales: propenso a errores y omisiones |
