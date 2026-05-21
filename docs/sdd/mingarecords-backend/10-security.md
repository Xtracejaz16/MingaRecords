# 10 — Seguridad

> **Versión:** 2.0 — **Fecha:** 19 de mayo de 2026 — **Autores:** Sebastián Estrada, Yair Santiago Cetre

---

## 10.1 Principios de Seguridad

| # | Principio | Qué significa |
|---|-----------|---------------|
| **S1** | Least privilege | Cada endpoint solo accede a lo que necesita. Un productor no puede editar beats de otro. |
| **S2** | Validate everything | Zod en cada input del usuario. Nunca confiar en datos del cliente. |
| **S3** | Fail secure | Un error de seguridad revoca acceso, no lo otorga. Token expirado = 401. |
| **S4** | Secrets fuera del código | Variables de entorno, nunca hardcodeadas. `.env` en `.gitignore`. |

> **Nota:** Somos 2 developers, 1 semana, $0 de presupuesto. No hay microservicios, no hay zero-trust entre servicios, no hay Redis. Todo corre en un solo proceso Express. La seguridad es práctica, no perfecta.

---

## 10.2 Autenticación JWT (HS256)

### 10.2.1 Estructura del Token

```
ACCESS TOKEN (JWT — HS256)
┌────────────────────────────────────────────────────────────┐
│ Header:  { "alg": "HS256", "typ": "JWT" }                  │
│ Payload: {                                                 │
│   "sub": "user-uuid",        // Subject (user ID)          │
│   "role": "producer",       // producer | artist           │
│   "email": "user@email.com",                               │
│   "iat": 1715472000,        // Issued at                   │
│   "exp": 1715475600         // Expires (+1h)               │
│ }                                                          │
│ Signature: HMAC-SHA256(payload, JWT_SECRET)                │
└────────────────────────────────────────────────────────────┘

REFRESH TOKEN (opaco, almacenado en DB)
┌────────────────────────────────────────────────────────────┐
│ • Generado: crypto.randomBytes(64).toString('hex')         │
│ • Se almacena HASH en refresh_tokens                       │
│ • Se envía en cookie httpOnly: refreshToken                │
│ • Expira en: 7 días                                        │
│ • Sin rotación en MVP (simple)                             │
└────────────────────────────────────────────────────────────┘
```

### 10.2.2 ¿Por qué HS256?

Un solo proceso Express, 2 developers, 1 semana. HS256 con un secret compartido es suficiente. RS256 agrega complejidad (par de claves, JWKS) que no necesitamos para un monolito.

### 10.2.3 Middleware de Autenticación

```typescript
// src/middleware/auth.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface JwtPayload {
  sub: string;
  role: 'producer' | 'artist';
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tienes permiso para esta acción' });
    }
    next();
  };
}
```

### 10.2.4 Auth Flow Simplificado

```
REGISTRO:
  CLIENTE → POST /auth/register {email, password, role}
    → Validar con Zod
    → bcrypt.hash(password, 12)
    → INSERT INTO users
    → Enviar email de verificación (Resend)
    → 201 { userId }

LOGIN:
  CLIENTE → POST /auth/login {email, password}
    → Buscar user por email
    → bcrypt.compare(password, hash)
    → Si no coincide → 401
    → Si email no verificado → 403
    → Generar accessToken (JWT, 1h)
    → Generar refreshToken (random, 7 días)
    → INSERT hash(refreshToken) en refresh_tokens
    → 200 { accessToken, user }
    → Set-Cookie: refreshToken (httpOnly, secure, sameSite)

REQUEST AUTENTICADO:
  CLIENTE → GET /beats (Auth: Bearer <access>)
    → Middleware JWT verifica firma y expiración
    → Adjunta req.user = { sub, role, email }
    → Handler procesa

REFRESH:
  CLIENTE → POST /auth/refresh (Cookie: refreshToken)
    → Hash(refreshToken) y buscar en DB
    → Si no existe o expirado → 401
    → Generar nuevo accessToken
    → 200 { accessToken }

LOGOUT:
  CLIENTE → POST /auth/logout (Cookie: refreshToken)
    → DELETE refresh_token de DB
    → Clear-Cookie: refreshToken
    → 200 OK
```

---

## 10.3 Seguridad de Contraseñas (bcrypt)

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

// Hash al registrar:
const hash = await bcrypt.hash(password, SALT_ROUNDS);

// Comparar al login:
const isValid = await bcrypt.compare(password, hash);
```

- **12 rounds**: balance entre seguridad y rendimiento en MVP
- **Nunca** loguear passwords ni hashes
- **Nunca** enviar passwords en respuestas

---

## 10.4 Validación de Input (Zod)

### 10.4.1 Registro de Usuario

```typescript
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email('Email inválido').max(255).transform((e) => e.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .max(128)
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  role: z.enum(['producer', 'artist']),
  alias: z.string().min(3).max(100).optional(),
});
```

### 10.4.2 Creación de Beat

```typescript
const createBeatSchema = z.object({
  title: z.string().min(3, 'Título muy corto').max(150),
  genre: z.string().min(2).max(50),
  bpm: z.number().int().min(20).max(300).optional(),
  priceCents: z.number().int().min(99, 'Precio mínimo $0.99 USD').max(999999),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string().min(2).max(30)).max(10).optional(),
});
```

### 10.4.3 Middleware de Validación

```typescript
// src/middleware/validate.ts
import { z, ZodError } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validateBody(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation Error',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      next(error);
    }
  };
}
```

### 10.4.4 Uso en Rutas

```typescript
import { Router } from 'express';
import { validateBody } from '../middleware/validate.js';
import { registerSchema } from '../schemas/auth.js';

const router = Router();

router.post('/auth/register', validateBody(registerSchema), registerHandler);
```

---

## 10.5 Validación de File Upload

### 10.5.1 Validación en Servidor

```typescript
// src/middleware/upload.ts
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

const ALLOWED_MIME_TYPES = ['audio/wav', 'audio/mpeg', 'audio/aiff', 'audio/flac'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Tipo de archivo no permitido. Solo WAV, MP3, AIFF, FLAC'));
    }
    cb(null, true);
  },
});

// Middleware para validar magic bytes
export function validateAudioFile(req: Request, res: Response, next: NextFunction) {
  const buffer = req.file?.buffer;
  if (!buffer) return next();

  const magicBytes = buffer.slice(0, 4);

  // WAV: RIFF header
  const isWav = magicBytes[0] === 0x52 && magicBytes[1] === 0x49 &&
                magicBytes[2] === 0x46 && magicBytes[3] === 0x46;

  // MP3: Frame sync o ID3 tag
  const isMp3 = (magicBytes[0] === 0xFF && (magicBytes[1] & 0xE0) === 0xE0) ||
                (magicBytes[0] === 0x49 && magicBytes[1] === 0x44 && magicBytes[2] === 0x33);

  // AIFF: FORM header
  const isAiff = magicBytes[0] === 0x46 && magicBytes[1] === 0x4F &&
                 magicBytes[2] === 0x52 && magicBytes[3] === 0x4D;

  // FLAC: fLaC marker
  const isFlac = magicBytes[0] === 0x66 && magicBytes[1] === 0x4C &&
                 magicBytes[2] === 0x61 && magicBytes[3] === 0x43;

  if (!isWav && !isMp3 && !isAiff && !isFlac) {
    return res.status(415).json({ error: 'Archivo de audio inválido' });
  }

  next();
}
```

### 10.5.2 Uso en Rutas

```typescript
router.post(
  '/beats/:id/audio',
  authenticate,
  upload.single('audio'),
  validateAudioFile,
  uploadAudioHandler
);
```

---

## 10.6 Configuración CORS (Express)

```typescript
// src/middleware/cors.ts
import cors from 'cors';
import { Express } from 'express';

const CORS_ORIGINS = {
  development: ['http://localhost:5173', 'http://localhost:3000'],
  staging: ['https://staging.mingarecords.com'],
  production: ['https://mingarecords.com'],
};

export function setupCors(app: Express) {
  const env = process.env.NODE_ENV || 'development';
  const origins = CORS_ORIGINS[env as keyof typeof CORS_ORIGINS] || CORS_ORIGINS.development;

  app.use(cors({
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  }));
}
```

---

## 10.7 Rate Limiting (In-Memory)

```typescript
// src/middleware/rate-limit.ts
import { Request, Response, NextFunction } from 'express';

interface WindowEntry {
  count: number;
  resetAt: number;
}

// In-memory store (se reinicia al restart del proceso)
const windows = new Map<string, WindowEntry>();

export function rateLimit(options: { windowMs: number; max: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `rl:${req.ip}:${req.path}`;
    const now = Date.now();

    let entry = windows.get(key);

    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + options.windowMs };
      windows.set(key, entry);
    }

    entry.count++;

    res.set('X-RateLimit-Limit', String(options.max));
    res.set('X-RateLimit-Remaining', String(Math.max(0, options.max - entry.count)));
    res.set('X-RateLimit-Reset', String(entry.resetAt));

    if (entry.count > options.max) {
      res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'Demasiadas peticiones. Intentá de nuevo más tarde.' });
    }

    next();
  };
}

// Límites por tipo de endpoint
export const limits = {
  public: rateLimit({ windowMs: 60_000, max: 60 }),       // 60 req/min
  auth: rateLimit({ windowMs: 60_000, max: 10 }),          // 10 req/min (login)
  upload: rateLimit({ windowMs: 60_000, max: 3 }),         // 3 req/min (uploads)
};
```

### 10.7.1 Limpieza Periódica

```typescript
// Limpiar ventanas expiradas cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of windows.entries()) {
    if (now > entry.resetAt) {
      windows.delete(key);
    }
  }
}, 5 * 60 * 1000);
```

> **Nota MVP:** In-memory es suficiente para 1 proceso. Si escalamos a múltiples instancias, migrar a Redis.

---

## 10.8 Seguridad de Webhooks de MercadoPago

```typescript
// src/routes/webhooks.ts
import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';

const router = Router();

router.post('/webhooks/mercadopago', async (req: Request, res: Response) => {
  const signature = req.headers['x-signature'] as string;
  const requestId = req.headers['x-request-id'] as string;
  const data = req.body;

  // Verificar firma del webhook
  const isValid = verifyMercadoPagoSignature(data, signature, process.env.MP_WEBHOOK_SECRET!);
  if (!isValid) {
    return res.status(401).json({ error: 'Firma inválida' });
  }

  // Procesar el evento
  const { type, data: eventData } = data;

  if (type === 'payment') {
    await handlePaymentEvent(eventData);
  }

  // Responder 200 inmediatamente (MercadoPago espera ACK rápido)
  res.status(200).json({ received: true });
});

function verifyMercadoPagoSignature(
  data: unknown,
  signature: string,
  secret: string
): boolean {
  // Verificar firma HMAC-SHA256 del body
  const bodyString = JSON.stringify(data);
  const expected = crypto
    .createHmac('sha256', secret)
    .update(bodyString)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

### 10.8.1 Principios

- **Nunca** confiar en webhooks sin verificar firma
- **Responder 200** inmediatamente, procesar async después
- **Loguear** el event ID para idempotencia (evitar doble procesamiento)
- **No loguear** datos completos del pago (contiene info sensible del comprador)

---

## 10.9 Control de Acceso a R2 (Cloudflare)

### 10.9.1 Estrategia

| Tipo de archivo | Acceso | Ubicación |
|----------------|--------|-----------|
| Previews (30s) | Público | `r2://previews/{beatId}.mp3` |
| Originales (WAV) | Privado | `r2://originals/{beatId}.wav` |
| Licencias (PDF) | Privado | `r2://licenses/{transactionId}.pdf` |

### 10.9.2 URLs Firmadas para Archivos Privados

```typescript
// src/services/storage.ts
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function generateSignedUrl(
  key: string,
  expiresIn = 3600 // 1 hora por defecto
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(r2, command, { expiresIn });
}

// Uso: después de una compra verificada
const downloadUrl = await generateSignedUrl(`originals/${beatId}.wav`, 86400); // 24h
```

### 10.9.3 Reglas

- **Previews**: bucket público, sin firma, rate limited
- **Originales**: bucket privado, URL firmada expira en 24h
- **Licencias**: bucket privado, URL firmada expira en 30 días
- **Nunca** exponer las credenciales de R2 al cliente

---

## 10.10 OWASP Essentials

Solo los críticos para un MVP de 1 semana:

| # | Riesgo | Mitigación en MingaRecords |
|---|--------|---------------------------|
| **A01** | Broken Access Control | Middleware JWT + roles. Un productor no puede editar beats de otro. Ownership verificado en cada operación. |
| **A02** | Cryptographic Failures | bcrypt (12 rounds) para passwords. JWT HS256 con secret ≥ 64 chars. Secrets en variables de entorno, nunca en código. |
| **A03** | Injection | Parameterized queries con el driver de PostgreSQL. Nunca concatenar input del usuario en queries SQL. Zod valida y sanitiza input. |
| **A07** | Authentication Failures | Rate limiting en login (10 req/min). JWT expira en 1 hora. Email verification obligatoria antes de comprar/vender. |

---

## 10.11 Variables de Entorno (Secrets)

```env
# .env.example (NUNCA commitear .env real)

# JWT
JWT_SECRET= # Mínimo 64 caracteres, generar con: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"

# Base de datos (Supabase)
DATABASE_URL=postgresql://...

# MercadoPago
MP_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Email (Resend)
RESEND_API_KEY=

# App
NODE_ENV=development
PORT=3000
```

### 10.11.1 Validación de Environment Variables

```typescript
// src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  JWT_SECRET: z.string().min(64, 'JWT_SECRET debe tener al menos 64 caracteres'),
  DATABASE_URL: z.string().url(),
  MP_ACCESS_TOKEN: z.string().min(1),
  MP_WEBHOOK_SECRET: z.string().min(1),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
});

export const env = envSchema.parse(process.env);

// Si falta alguna variable requerida, el proceso NO arranca
```

---

## 10.12 Headers de Seguridad

```typescript
// src/middleware/security-headers.ts
import { Request, Response, NextFunction } from 'express';

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevenir MIME sniffing
  res.set('X-Content-Type-Options', 'nosniff');

  // Prevenir clickjacking
  res.set('X-Frame-Options', 'DENY');

  // Referrer policy
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // HSTS (solo production)
  if (process.env.NODE_ENV === 'production') {
    res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  next();
}
```

---

## 10.13 Logging de Seguridad

```typescript
// src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

// Eventos de seguridad a loguear:
// - Login fallido (sin password)
// - Token inválido
// - Rate limit hit
// - Webhook con firma inválida
// - Upload rechazado

// NUNCA loguear:
// - Passwords
// - JWT secrets
// - Tokens completos
// - Datos financieros completos
```

---

## 10.14 Checklist de Seguridad Pre-Deploy

- [ ] `JWT_SECRET` generado con crypto.randomBytes (≥ 64 chars)
- [ ] `.env` en `.gitignore`
- [ ] CORS configurado con origins correctos (no `*` en production)
- [ ] Rate limiting activo en `/auth/login` y `/auth/register`
- [ ] Webhook de MercadoPago verifica firma
- [ ] R2 bucket de originales es privado
- [ ] Headers de seguridad configurados
- [ ] No hay secrets en logs
- [ ] bcrypt con al menos 10 rounds
- [ ] Zod valida todos los inputs del usuario
- [ ] File upload valida MIME type y magic bytes
