# 03 — Estrategia de Repositorio (Modular Monolith)

> **Versión:** 2.0 — **Fecha:** 19 de mayo de 2026

---

## 3.1 Decisión: Modular Monolith

Para un MVP de **1 semana** con **2 developers** y **presupuesto $0**, un monolito modular es la única opción sensata.

### ¿Por qué NO microservicios?

| Factor | Microservicios (6 apps) | Modular Monolith | Ganador |
|--------|------------------------|-----------------|---------|
| **Setup inicial** | Configurar 6 apps, 6 Dockerfiles, CI/CD por servicio | 1 `package.json`, 1 `tsconfig`, listo | Monolith |
| **Deploy** | 6 containers, orquestación, networking | 1 proceso, 1 deploy a EC2 | Monolith |
| **Comunicación** | HTTP entre servicios, timeouts, circuit breakers | Llamadas directas a funciones | Monolith |
| **Debugging** | Logs distribuidos, tracing complejo | Stack trace simple, debugger attach directo | Monolith |
| **Costo infra** | 6 containers en Railway/Render (~$25-50/mes) | 1 EC2 t2.micro Free Tier ($0) | Monolith |
| **Tiempo de desarrollo** | Semanas de infra antes de escribir negocio | Empezás a codear negocio el día 1 | Monolith |

**Veredicto**: Modular Monolith. Los módulos están separados en `src/modules/` para mantener orden y permitir extraer a microservicios en el futuro si hace falta, pero hoy todo corre en un solo proceso.

---

## 3.2 Estructura del Repositorio

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── routes.ts           # POST /auth/register, /auth/login
│   │   │   ├── handlers.ts         # Lógica de registro, login, JWT
│   │   │   └── middleware.ts       # JWT guard, auth context
│   │   │
│   │   ├── beats/
│   │   │   ├── routes.ts           # CRUD /beats, /producers, /dashboard
│   │   │   ├── handlers.ts         # CRUD beats, búsqueda, filtros
│   │   │   └── services.ts         # Lógica de negocio (stats, perfiles)
│   │   │
│   │   ├── payments/
│   │   │   ├── routes.ts           # POST /checkout, /webhook/mercadopago
│   │   │   ├── handlers.ts         # Checkout MP, webhooks, licencias
│   │   │   └── services.ts         # Generación de licencias, validación
│   │   │
│   │   └── storage/
│   │       ├── routes.ts           # POST /upload, GET /stream/:id
│   │       ├── handlers.ts         # Subida audio, streaming, previews
│   │       └── services.ts         # ffmpeg preview, R2 upload, signed URLs
│   │
│   ├── shared/
│   │   ├── middleware/
│   │   │   ├── error-handler.ts    # Error handler global
│   │   │   └── auth-context.ts     # Extraer user de JWT
│   │   ├── types/
│   │   │   ├── api.ts              # ApiResponse, PaginatedResponse
│   │   │   └── env.ts              # Tipos de env vars validados
│   │   └── utils/
│   │       ├── slug.ts             # Generación de slugs
│   │       └── audio.ts            # Validación MIME, metadata (ffprobe)
│   │
│   ├── config/
│   │   └── env.ts                  # Zod-validated environment variables
│   │
│   ├── db/
│   │   └── schema.prisma           # Prisma schema (único, toda la DB)
│   │
│   └── app.ts                      # Express app — registra todos los módulos
│
├── tests/
│   ├── auth.test.ts
│   ├── beats.test.ts
│   ├── payments.test.ts
│   └── storage.test.ts
│
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 3.3 Configuración del Proyecto

### `package.json`

```json
{
  "name": "mingarecords-backend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "lint": "eslint src/",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "express": "^4.21.0",
    "@prisma/client": "^6.0.0",
    "mercadopago": "^2.0.0",
    "@aws-sdk/client-s3": "^3.700.0",
    "fluent-ffmpeg": "^2.1.3",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tsx": "^4.19.0",
    "eslint": "^9.0.0",
    "@types/express": "^5.0.0",
    "@types/node": "^22.0.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/fluent-ffmpeg": "^2.1.0",
    "prisma": "^6.0.0",
    "vitest": "^3.0.0"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

---

## 3.4 Responsabilidades por Módulo

### auth
- Registro de usuarios (email + password con bcrypt)
- Login y generación de JWT
- Middleware de autenticación para proteger rutas
- Perfil básico del usuario (nombre, email, avatar)

### beats
- CRUD completo de beats (crear, listar, obtener, actualizar, eliminar)
- Búsqueda y filtros (género, BPM, tonalidad, precio)
- Perfiles de productores
- Dashboard del productor (ventas, reproducciones, stats)

### payments
- Integración con MercadoPago (checkout preference)
- Webhook handler para confirmar pagos
- Generación de licencias tras pago exitoso
- Historial de transacciones por usuario

### storage
- Subida de archivos de audio (multipart/form-data)
- Generación de preview con ffmpeg (30 segundos)
- Almacenamiento en Cloudflare R2 (S3-compatible)
- Streaming de audio con signed URLs temporales

---

## 3.5 Estrategia de Base de Datos

**Una sola base de datos PostgreSQL** (Supabase). Sin schemas separados por módulo — todas las tablas conviven en el schema `public`.

### Prisma schema único

```prisma
// src/db/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Auth
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String?
  avatarUrl String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  beats      Beat[]
  licenses   License[]
  transactions Transaction[]
}

// Beats
model Beat {
  id          String   @id @default(uuid())
  title       String
  slug        String   @unique
  bpm         Int
  key         String?
  genre       String
  price       Decimal
  audioUrl    String
  previewUrl  String
  producerId  String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  producer    User     @relation(fields: [producerId], references: [id])
}

// Payments
model Transaction {
  id          String   @id @default(uuid())
  userId      String
  beatId      String
  amount      Decimal
  status      String   // pending, completed, failed
  mpPaymentId String?  // ID de MercadoPago
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
  license     License?
}

model License {
  id            String    @id @default(uuid())
  userId        String
  beatId        String
  transactionId String    @unique
  type          String    // basic, premium, exclusive
  expiresAt     DateTime?
  createdAt     DateTime  @default(now())

  user          User      @relation(fields: [userId], references: [id])
}
```

### Migraciones

```bash
# Crear nueva migración
npx prisma migrate dev --name add_beat_genre

# Aplicar migraciones en producción
npx prisma migrate deploy
```

---

## 3.6 Variables de Entorno

### `.env.example`

```env
# Server
PORT=3000
NODE_ENV=development

# Database (Supabase)
DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"

# JWT
JWT_SECRET="tu-secret-aqui"
JWT_EXPIRES_IN="7d"

# MercadoPago
MP_ACCESS_TOKEN="tu-access-token"
MP_PUBLIC_KEY="tu-public-key"
MP_WEBHOOK_SECRET="tu-webhook-secret"

# Cloudflare R2
R2_ACCOUNT_ID="tu-account-id"
R2_ACCESS_KEY_ID="tu-access-key"
R2_SECRET_ACCESS_KEY="tu-secret-key"
R2_BUCKET_NAME="mingarecords-audio"
R2_PUBLIC_URL="https://audio.mingarecords.com"

# ffmpeg (path local, requerido por fluent-ffmpeg)
FFMPEG_PATH="ffmpeg"
FFPROBE_PATH="ffprobe"
```

### Validación con Zod

```ts
// src/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  MP_ACCESS_TOKEN: z.string(),
  MP_PUBLIC_KEY: z.string(),
  R2_ACCOUNT_ID: z.string(),
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  R2_BUCKET_NAME: z.string(),
  R2_PUBLIC_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

---

## 3.7 Registro de Módulos en Express

```ts
// src/app.ts
import express from 'express';
import { env } from './config/env';
import { errorHandler } from './shared/middleware/error-handler';

// Importar módulos
import { authRoutes } from './modules/auth/routes';
import { beatsRoutes } from './modules/beats/routes';
import { paymentsRoutes } from './modules/payments/routes';
import { storageRoutes } from './modules/storage/routes';

const app = express();

// Middleware global
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Registrar módulos
app.use('/auth', authRoutes);
app.use('/beats', beatsRoutes);
app.use('/payments', paymentsRoutes);
app.use('/storage', storageRoutes);

// Error handler (siempre al final)
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});
```

---

## 3.8 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Generar cliente de Prisma
npm run db:generate

# Aplicar migraciones (crea la DB si no existe)
npm run db:migrate

# Levantar en modo desarrollo (con hot reload)
npm run dev

# En otra terminal, abrir Prisma Studio para ver la DB
npm run db:studio
```

**No se necesita Docker**. Supabase provee PostgreSQL en la nube y se conecta directamente con `DATABASE_URL`.

---

## 3.9 CI/CD (GitHub Actions)

Pipeline simple: lint + type-check en cada PR.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
```

El deploy a EC2 se maneja fuera de CI (script manual o GitHub Actions separado con SSH). No hace falta container registry ni orquestación.
