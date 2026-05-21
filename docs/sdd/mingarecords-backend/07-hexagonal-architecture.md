# 07 — Arquitectura Modular Simplificada

> **Versión:** 2.0 — **Fecha:** 19 de mayo de 2026

---

## 7.1 Principios Fundamentales

Para un MVP de **1 semana con 2 devs y presupuesto $0**, no necesitamos hexagonal completo con value objects, contenedores de DI ni capas de dominio/application/infrastructure separadas. Usamos una **arquitectura modular simplificada** con capas por módulo:

| Principio | Qué significa |
|-----------|---------------|
| **Módulos autocontenidos** | Cada módulo tiene sus rutas, servicio y repositorio. No hay carpetas `domain/`, `application/`, `infrastructure/`. |
| **Dependencias hacia adentro** | Routes → Service → Repository. Nunca al revés. |
| **Interfaces TypeScript** | Tipos claros, sin `any`. Sin clases con comportamiento, sin value objects. |
| **Validación con Zod** | En las rutas, antes de llamar al servicio. |
| **Prisma para datos** | Un solo schema.prisma para todo el monolito. |
| **Sin DI containers** | Se instancian servicios directamente donde se necesitan. |

---

## 7.2 Estructura de Carpetas

```
src/
├── modules/
│   ├── auth/
│   │   ├── routes.ts          → Express routes + validación Zod
│   │   ├── service.ts         → Lógica de negocio (login, register, refresh)
│   │   ├── repository.ts      → Acceso a datos con Prisma
│   │   └── types.ts           → Interfaces TypeScript del módulo
│   │
│   ├── beats/
│   │   ├── routes.ts
│   │   ├── service.ts
│   │   ├── repository.ts
│   │   └── types.ts
│   │
│   ├── payments/
│   │   ├── routes.ts
│   │   ├── service.ts         → MercadoPago integration
│   │   ├── repository.ts
│   │   └── types.ts
│   │
│   └── storage/
│       ├── routes.ts
│       ├── service.ts         → Cloudflare R2 operations
│       └── r2-client.ts       → R2 SDK wrapper
│
├── shared/
│   ├── middleware.ts           → authGuard, errorHandler, upload handler
│   ├── types.ts               → Tipos compartidos (UserSession, ApiResponse)
│   └── utils.ts               → Helpers (slugify, formatPrice, etc.)
│
├── db/
│   └── schema.prisma          → Schema único de Prisma
│
├── app.ts                     → Express app setup + mount routes
└── index.ts                   → Entry point (env vars, start server)
```

---

## 7.3 Ejemplo Completo: Módulo Auth

### 7.3.1 Tipos (`modules/auth/types.ts`)

```typescript
export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: 'producer' | 'artist';
  alias: string | null;
  avatarUrl: string | null;
  bio: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RegisterInput {
  email: string;
  password: string;
  role: 'producer' | 'artist';
  alias?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
```

### 7.3.2 Repositorio (`modules/auth/repository.ts`)

```typescript
import { PrismaClient } from '@prisma/client';
import type { UserRecord } from './types';

export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user as UserRecord | null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user as UserRecord | null;
  }

  async create(data: {
    email: string;
    passwordHash: string;
    role: 'producer' | 'artist';
    alias?: string;
  }): Promise<UserRecord> {
    const user = await this.prisma.user.create({ data });
    return user as UserRecord;
  }

  async updateRefreshToken(userId: string, token: string | null): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: token },
    });
  }
}
```

### 7.3.3 Servicio (`modules/auth/service.ts`)

```typescript
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { AuthRepository } from './repository';
import type { RegisterInput, LoginInput, TokenPair, UserRecord } from './types';

export class AuthService {
  constructor(
    private readonly repository: AuthRepository,
    private readonly jwtAccessSecret: string,
    private readonly jwtRefreshSecret: string,
  ) {}

  async register(input: RegisterInput): Promise<UserRecord> {
    const existing = await this.repository.findByEmail(input.email);
    if (existing) {
      throw new Error('Ya existe una cuenta con ese email');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    return this.repository.create({
      email: input.email,
      passwordHash,
      role: input.role,
      alias: input.alias,
    });
  }

  async login(input: LoginInput): Promise<TokenPair & { user: Omit<UserRecord, 'passwordHash'> }> {
    const user = await this.repository.findByEmail(input.email);
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    const validPassword = await bcrypt.compare(input.password, user.passwordHash);
    if (!validPassword) {
      throw new Error('Credenciales inválidas');
    }

    if (!user.emailVerified) {
      throw new Error('Verificá tu email antes de iniciar sesión');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    await this.repository.updateRefreshToken(user.id, refreshToken);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;

    return { accessToken, refreshToken, user: userWithoutPassword };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const payload = jwt.verify(refreshToken, this.jwtRefreshSecret) as { sub: string };
    const user = await this.repository.findById(payload.sub);

    if (!user || user.refreshToken !== refreshToken) {
      throw new Error('Token inválido');
    }

    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);

    await this.repository.updateRefreshToken(user.id, newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  private generateAccessToken(user: UserRecord): string {
    return jwt.sign(
      { sub: user.id, role: user.role, email: user.email },
      this.jwtAccessSecret,
      { expiresIn: '1h' },
    );
  }

  private generateRefreshToken(user: UserRecord): string {
    return jwt.sign({ sub: user.id }, this.jwtRefreshSecret, { expiresIn: '7d' });
  }
}
```

### 7.3.4 Rutas (`modules/auth/routes.ts`)

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { AuthService } from './service';
import { authGuard } from '../../shared/middleware';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.enum(['producer', 'artist']),
  alias: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export function createAuthRoutes(authService: AuthService): Router {
  const router = Router();

  router.post('/auth/register', async (req, res, next) => {
    try {
      const parsed = registerSchema.parse(req.body);
      const user = await authService.register(parsed);
      res.status(201).json({ user });
    } catch (error) {
      next(error);
    }
  });

  router.post('/auth/login', async (req, res, next) => {
    try {
      const parsed = loginSchema.parse(req.body);
      const result = await authService.login(parsed);
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      });
      res.json({ accessToken: result.accessToken, user: result.user });
    } catch (error) {
      next(error);
    }
  });

  router.post('/auth/refresh', async (req, res, next) => {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) throw new Error('No hay refresh token');
      const tokens = await authService.refresh(token);
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ accessToken: tokens.accessToken });
    } catch (error) {
      next(error);
    }
  });

  router.get('/auth/me', authGuard, async (req, res, next) => {
    try {
      res.json({ user: req.user });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
```

---

## 7.4 Shared Middleware (`shared/middleware.ts`)

```typescript
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'producer' | 'artist';
    email: string;
  };
}

export function authGuard(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as {
      sub: string;
      role: 'producer' | 'artist';
      email: string;
    };
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof z.ZodError) {
    res.status(400).json({ error: 'Datos inválidos', details: err.errors });
    return;
  }

  if (err instanceof Error) {
    res.status(400).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: 'Error interno del servidor' });
}
```

---

## 7.5 App Setup (`app.ts`)

```typescript
import express from 'express';
import cookieParser from 'cookie-parser';
import { PrismaClient } from '@prisma/client';
import { AuthRepository } from './modules/auth/repository';
import { AuthService } from './modules/auth/service';
import { createAuthRoutes } from './modules/auth/routes';
import { errorHandler } from './shared/middleware';

export function createApp(): express.Application {
  const app = express();

  // ── Global middleware ──
  app.use(express.json());
  app.use(cookieParser());

  // ── Setup dependencies ──
  const prisma = new PrismaClient();
  const authRepository = new AuthRepository(prisma);
  const authService = new AuthService(
    authRepository,
    process.env.JWT_ACCESS_SECRET!,
    process.env.JWT_REFRESH_SECRET!,
  );

  // ── Mount routes ──
  app.use('/api/v1', createAuthRoutes(authService));
  // app.use('/api/v1', createBeatsRoutes(beatsService));
  // app.use('/api/v1', createPaymentsRoutes(paymentsService));

  // ── Health check ──
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'mingarecords-api' });
  });

  // ── Error handler (must be last) ──
  app.use(errorHandler);

  return app;
}
```

---

## 7.6 Entry Point (`index.ts`)

```typescript
import { createApp } from './app';

const port = process.env.PORT || 3000;
const app = createApp();

app.listen(port, () => {
  console.log(`MingaRecords API running on http://localhost:${port}`);
});
```

---

## 7.7 Schema Prisma (`db/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  producer
  artist
}

enum BeatStatus {
  draft
  pending_audio
  processing
  ready
  published
  sold
  archived
  deleted
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  role          Role      @default(producer)
  alias         String?
  avatarUrl     String?
  bio           String?
  emailVerified Boolean   @default(false)
  refreshToken  String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  beats         Beat[]
  orders        Order[]
}

model Beat {
  id          String      @id @default(uuid())
  producerId  String
  title       String
  slug        String      @unique
  genre       String
  bpm         Int?
  key         String?
  priceCents  Int
  description String?
  tags        String[]
  previewUrl  String?
  streamUrl   String?
  playsCount  Int         @default(0)
  salesCount  Int         @default(0)
  status      BeatStatus  @default(draft)
  publishedAt DateTime?
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  deletedAt   DateTime?

  producer    User        @relation(fields: [producerId], references: [id])
  orderItems  OrderItem[]

  @@index([producerId])
  @@index([status])
  @@index([slug])
}

model Order {
  id          String      @id @default(uuid())
  userId      String
  totalCents  Int
  mpPaymentId String?     @unique
  status      String      @default('pending')
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  user        User        @relation(fields: [userId], references: [id])
  items       OrderItem[]

  @@index([userId])
  @@index([mpPaymentId])
}

model OrderItem {
  id        String   @id @default(uuid())
  orderId   String
  beatId    String
  priceCents Int

  order     Order    @relation(fields: [orderId], references: [id])
  beat      Beat     @relation(fields: [beatId], references: [id])

  @@unique([orderId, beatId])
}
```

---

## 7.8 Comunicación entre Módulos

En un **modular monolith**, los módulos se comunican por **importación directa de funciones**, no por HTTP ni eventos:

```typescript
// modules/payments/service.ts
import { BeatRepository } from '../beats/repository';
import { OrderRepository } from './repository';

export class PaymentService {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly beatRepo: BeatRepository,
    private readonly mpClient: MercadoPagoClient,
  ) {}

  async createPreference(userId: string, beatIds: string[]) {
    // Importamos directo del módulo beats, sin HTTP
    const beats = await this.beatRepo.findByIds(beatIds);
    const total = beats.reduce((sum, b) => sum + b.priceCents, 0);

    const preference = await this.mpClient.preferences.create({
      items: beats.map(b => ({
        title: b.title,
        unit_price: b.priceCents / 100,
        quantity: 1,
      })),
    });

    await this.orderRepo.create({
      userId,
      totalCents: total,
      mpPreferenceId: preference.id,
    });

    return preference.init_point;
  }
}
```

**Regla**: un módulo puede importar repositorios o servicios de otro módulo directamente. No hay capas intermedias ni message buses para un MVP de 1 semana.

---

## 7.9 Reglas de la Arquitectura

| Regla | Descripción |
|-------|-------------|
| **Routes llaman Services** | Las rutas solo parsean input con Zod, llaman al servicio, y responden JSON |
| **Services contienen lógica** | Validaciones de negocio, orquestación, integración con externos (MP, R2) |
| **Repositories solo Prisma** | Acceso a datos puro. Sin lógica de negocio |
| **Un solo schema.prisma** | Todo el monolito comparte un solo schema en `src/db/` |
| **Sin DI containers** | Se instancian servicios directamente en `app.ts` |
| **Sin value objects** | Validación con Zod en rutas, no con clases en el dominio |
| **Sin port interfaces** | Los repositorios son clases concretas, no interfaces abstractas |
| **Error handling centralizado** | `errorHandler` en `shared/middleware.ts` atrapa todo |

---

## 7.10 Testing Simplificado

Para un MVP de 1 semana, priorizamos **tests de integración** sobre tests unitarios complejos:

```typescript
// test/auth.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Auth API', () => {
  const app = createApp();

  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@minga.com',
        password: 'Password123',
        role: 'producer',
      });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('test@minga.com');
  });

  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@minga.com',
        password: 'Password123',
      });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should reject invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'not-an-email',
        password: 'Password123',
      });

    expect(res.status).toBe(400);
  });
});
```

---

## 7.11 Stack Tecnológico

| Componente | Tecnología |
|------------|------------|
| **Framework** | Express |
| **Base de datos** | Supabase (PostgreSQL) |
| **ORM** | Prisma |
| **Pagos** | MercadoPago SDK |
| **Storage** | Cloudflare R2 (@aws-sdk/client-s3) |
| **Validación** | Zod |
| **Auth** | JWT (jsonwebtoken) + bcrypt |
| **Testing** | Vitest + Supertest |
| **Deploy MVP** | AWS EC2 t2.micro (Free Tier) |
