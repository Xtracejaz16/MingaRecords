# 07 — Arquitectura Hexagonal (Ports & Adapters)

> **Versión:** 1.0 — **Fecha:** 12 de mayo de 2026

---

## 7.1 Principios Fundamentales

| Principio | Qué significa |
|-----------|---------------|
| **Dominio puro** | El dominio NO importa nada externo. No frameworks, no DB, no HTTP. Solo entidades, value objects y reglas de negocio. |
| **Dependencias hacia adentro** | Infrastructure → Application → Domain. Nunca al revés. |
| **Puertos son interfaces** | Los puertos definen QUÉ se necesita, no CÓMO se implementa. |
| **Adapters son implementaciones** | Los adapters implementan los puertos con tecnología concreta (Prisma, Stripe, R2, etc.). |
| **Use cases explícitos** | Cada caso de uso es una clase con un solo método `execute()`. Fácil de testear, fácil de entender. |
| **Testabilidad** | El dominio y los use cases se testean sin DB, sin HTTP, sin frameworks. |

---

## 7.2 Estructura de Carpetas (por Servicio)

```
apps/{service}/
├── src/
│   ├── domain/
│   │   ├── entities/           # Entidades del dominio (interfaces puras)
│   │   │   ├── beat.ts
│   │   │   └── user.ts
│   │   ├── value-objects/      # Value objects (inmutables, auto-validados)
│   │   │   ├── email.ts
│   │   │   ├── password.ts
│   │   │   └── price.ts
│   │   └── ports/              # Interfaces (puertos) que el dominio necesita
│   │       ├── user-repository.ts
│   │       ├── beat-repository.ts
│   │       ├── token-service.ts
│   │       └── email-service.ts
│   │
│   ├── application/
│   │   └── use-cases/          # Casos de uso (orquestan dominio + puertos)
│   │       ├── register.ts
│   │       ├── login.ts
│   │       ├── create-beat.ts
│   │       └── list-beats.ts
│   │
│   ├── infrastructure/
│   │   ├── http/               # Adaptadores de entrada (HTTP)
│   │   │   ├── server.ts       # Fastify instance
│   │   │   ├── routes/         # Route definitions
│   │   │   └── middleware/     # JWT guard, error handler, CORS
│   │   ├── database/           # Adaptadores de salida (DB)
│   │   │   ├── prisma/
│   │   │   │   └── schema.prisma
│   │   │   └── user-repository.ts  # Implementación real del puerto
│   │   ├── adapters/           # Adaptadores de salida (servicios externos)
│   │   │   ├── jwt-token-service.ts
│   │   │   ├── stripe-gateway.ts
│   │   │   ├── r2-storage.ts
│   │   │   └── resend-email-service.ts
│   │   └── config/
│   │       └── env.ts          # Zod-validated environment variables
│   │
│   └── index.ts                # Entry point (wires everything together)
│
├── test/
│   ├── unit/                   # Tests de dominio y use cases (sin DB)
│   ├── integration/            # Tests de adapters (con DB real)
│   └── fixtures/               # Datos de prueba
│
├── package.json
├── tsconfig.json
└── Dockerfile
```

---

## 7.3 Ejemplo Completo: Auth Service — Login Flow

### 7.3.1 Domain Layer

**Entidad User** (`src/domain/entities/user.ts`):

```typescript
export interface User {
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
```

**Value Object Email** (`src/domain/value-objects/email.ts`):

```typescript
export class Email {
  constructor(readonly value: string) {
    const normalized = value.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new Error('Email inválido');
    }
    if (normalized.length > 255) {
      throw new Error('Email demasiado largo');
    }
    this.value = normalized;
  }

  toString(): string {
    return this.value;
  }
}
```

**Value Object Password** (`src/domain/value-objects/password.ts`):

```typescript
import bcrypt from 'bcrypt';

export class Password {
  private constructor(readonly hash: string) {}

  static async create(plain: string): Promise<Password> {
    if (plain.length < 8) throw new Error('Mínimo 8 caracteres');
    if (!/[A-Z]/.test(plain)) throw new Error('Debe contener una mayúscula');
    if (!/[a-z]/.test(plain)) throw new Error('Debe contener una minúscula');
    if (!/[0-9]/.test(plain)) throw new Error('Debe contener un número');

    const hash = await bcrypt.hash(plain, 12);
    return new Password(hash);
  }

  static fromHash(hash: string): Password {
    return new Password(hash);
  }

  async matches(plain: string): Promise<boolean> {
    return bcrypt.compare(plain, this.hash);
  }
}
```

**Puerto UserRepository** (`src/domain/ports/user-repository.ts`):

```typescript
import type { User } from '../entities/user';

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
}
```

**Puerto TokenService** (`src/domain/ports/token-service.ts`):

```typescript
export interface TokenPayload {
  sub: string;
  role: 'producer' | 'artist';
  email: string;
}

export interface TokenService {
  generateAccessToken(payload: TokenPayload): Promise<string>;
  generateRefreshToken(): Promise<{ token: string; expiresAt: Date }>;
  verifyAccessToken(token: string): Promise<TokenPayload>;
}
```

### 7.3.2 Application Layer

**Login Use Case** (`src/application/use-cases/login.ts`):

```typescript
import type { UserRepository } from '../../domain/ports/user-repository';
import type { TokenService } from '../../domain/ports/token-service';
import { Password } from '../../domain/value-objects/password';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  user: {
    id: string;
    email: string;
    role: 'producer' | 'artist';
    alias: string | null;
  };
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(request: LoginRequest): Promise<LoginResponse> {
    // 1. Buscar usuario por email
    const user = await this.userRepository.findByEmail(request.email);
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    // 2. Verificar password
    const password = Password.fromHash(user.passwordHash);
    const isValid = await password.matches(request.password);
    if (!isValid) {
      throw new Error('Credenciales inválidas');
    }

    // 3. Verificar email verificado
    if (!user.emailVerified) {
      throw new Error('Verificá tu email antes de iniciar sesión');
    }

    // 4. Generar tokens
    const accessToken = await this.tokenService.generateAccessToken({
      sub: user.id,
      role: user.role,
      email: user.email,
    });

    const refreshToken = await this.tokenService.generateRefreshToken();

    // 5. Retornar respuesta
    return {
      accessToken,
      refreshToken: refreshToken.token,
      refreshTokenExpiresAt: refreshToken.expiresAt,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        alias: user.alias,
      },
    };
  }
}
```

### 7.3.3 Infrastructure Layer

**Prisma User Repository** (`src/infrastructure/database/user-repository.ts`):

```typescript
import { PrismaClient, User as PrismaUser } from '@prisma/client';
import type { User } from '../../domain/entities/user';
import type { UserRepository } from '../../domain/ports/user-repository';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? this.toDomain(user) : null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toDomain(user) : null;
  }

  async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        alias: data.alias,
        avatarUrl: data.avatarUrl,
        bio: data.bio,
        emailVerified: data.emailVerified,
      },
    });
    return this.toDomain(user);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.alias !== undefined && { alias: data.alias }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.emailVerified !== undefined && { emailVerified: data.emailVerified }),
      },
    });
    return this.toDomain(user);
  }

  private toDomain(prismaUser: PrismaUser): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      passwordHash: prismaUser.passwordHash,
      role: prismaUser.role as 'producer' | 'artist',
      alias: prismaUser.alias,
      avatarUrl: prismaUser.avatarUrl,
      bio: prismaUser.bio,
      emailVerified: prismaUser.emailVerified,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    };
  }
}
```

**JWT Token Service** (`src/infrastructure/adapters/jwt-token-service.ts`):

```typescript
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import type { TokenPayload, TokenService } from '../../domain/ports/token-service';

export class JwtTokenService implements TokenService {
  constructor(
    private readonly accessSecret: string,
    private readonly refreshSecret: string,
    private readonly accessExpiresIn: string = '1h',
    private readonly refreshExpiresIn: string = '7d',
  ) {}

  async generateAccessToken(payload: TokenPayload): Promise<string> {
    return jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiresIn,
      algorithm: 'HS256',
    });
  }

  async generateRefreshToken(): Promise<{ token: string; expiresAt: Date }> {
    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return { token, expiresAt };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    return jwt.verify(token, this.accessSecret, {
      algorithms: ['HS256'],
    }) as TokenPayload;
  }
}
```

**Login Route** (`src/infrastructure/http/routes/auth.routes.ts`):

```typescript
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { LoginUseCase } from '../../../application/use-cases/login';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      throw parsed.error;
    }

    // Los use cases se inyectan via dependency injection en index.ts
    const loginUseCase = fastify.diContainer.resolve<LoginUseCase>('LoginUseCase');

    const result = await loginUseCase.execute(parsed.data);

    return reply
      .setCookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/auth',
        expires: result.refreshTokenExpiresAt,
      })
      .status(200)
      .send({
        accessToken: result.accessToken,
        user: result.user,
      });
  });
}
```

### 7.3.4 Dependency Injection (`src/index.ts`)

```typescript
import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { JwtTokenService } from './infrastructure/adapters/jwt-token-service';
import { PrismaUserRepository } from './infrastructure/database/user-repository';
import { LoginUseCase } from './application/use-cases/login';
import { authRoutes } from './infrastructure/http/routes/auth.routes';
import { errorHandler } from './infrastructure/http/middleware/error-handler';
import { env } from './infrastructure/config/env';

async function start() {
  const fastify = Fastify({ logger: true });

  // ── Infrastructure setup ──
  const prisma = new PrismaClient({
    datasources: [{ url: env.DATABASE_URL }],
  });
  await prisma.$connect();

  const tokenService = new JwtTokenService(
    env.JWT_ACCESS_SECRET,
    env.JWT_REFRESH_SECRET,
    env.JWT_ACCESS_EXPIRES_IN,
    env.JWT_REFRESH_EXPIRES_IN,
  );

  const userRepository = new PrismaUserRepository(prisma);

  // ── Dependency Injection container (simple Map) ──
  const diContainer = new Map<string, unknown>();
  diContainer.set('LoginUseCase', new LoginUseCase(userRepository, tokenService));
  // ... otros use cases

  fastify.decorate('diContainer', { resolve: <T>(key: string) => diContainer.get(key) as T });

  // ── Middleware ──
  fastify.setErrorHandler(errorHandler);

  // ── Routes ──
  await fastify.register(authRoutes, { prefix: '/api/v1' });

  // ── Health check ──
  fastify.get('/health', async () => ({
    status: 'ok',
    service: 'auth',
    version: process.env.npm_package_version || 'dev',
  }));

  // ── Start ──
  await fastify.listen({ port: env.PORT, host: '0.0.0.0' });
  fastify.log.info(`Auth service running on port ${env.PORT}`);
}

start().catch((err) => {
  console.error('Failed to start auth service:', err);
  process.exit(1);
});
```

---

## 7.4 Ejemplo: Catalog Service — Create Beat Flow

### Domain Layer

**Beat Entity** (`src/domain/entities/beat.ts`):

```typescript
export interface Beat {
  id: string;
  producerId: string;
  title: string;
  slug: string;
  genre: string;
  bpm: number | null;
  key: string | null;
  priceCents: number;
  description: string | null;
  tags: string[];
  previewUrl: string | null;
  streamUrl: string | null;
  playsCount: number;
  salesCount: number;
  status: 'draft' | 'pending_audio' | 'processing' | 'ready' | 'published' | 'sold' | 'archived' | 'deleted';
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
```

**Create Beat Use Case** (`src/application/use-cases/create-beat.ts`):

```typescript
import type { Beat } from '../../domain/entities/beat';
import type { BeatRepository } from '../../domain/ports/beat-repository';

export interface CreateBeatRequest {
  producerId: string;
  title: string;
  genre: string;
  bpm?: number;
  key?: string;
  priceCents: number;
  description?: string;
  tags?: string[];
}

export class CreateBeatUseCase {
  constructor(private readonly beatRepository: BeatRepository) {}

  async execute(request: CreateBeatRequest): Promise<Beat> {
    // Validaciones de dominio
    if (request.title.length < 3) {
      throw new Error('El título debe tener al menos 3 caracteres');
    }
    if (request.priceCents < 100) {
      throw new Error('El precio mínimo es $1.00 USD');
    }

    // Generar slug único
    const slug = this.generateSlug(request.title);

    return this.beatRepository.create({
      producerId: request.producerId,
      title: request.title,
      slug,
      genre: request.genre,
      bpm: request.bpm,
      key: request.key,
      priceCents: request.priceCents,
      description: request.description,
      tags: request.tags ?? [],
      status: 'pending_audio',
    });
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 100);
  }
}
```

---

## 7.5 Testing por Capa

### Unit Test — Use Case (sin DB, sin HTTP)

```typescript
// test/unit/application/use-cases/login.test.ts
import { describe, it, expect, vi } from 'vitest';
import { LoginUseCase } from '../../../../src/application/use-cases/login';
import type { UserRepository } from '../../../../src/domain/ports/user-repository';
import type { TokenService } from '../../../../src/domain/ports/token-service';

describe('LoginUseCase', () => {
  const mockUserRepository: UserRepository = {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  };

  const mockTokenService: TokenService = {
    generateAccessToken: vi.fn().mockResolvedValue('fake-access-token'),
    generateRefreshToken: vi.fn().mockResolvedValue({
      token: 'fake-refresh-token',
      expiresAt: new Date('2026-05-19'),
    }),
    verifyAccessToken: vi.fn(),
  };

  it('should login successfully with valid credentials', async () => {
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue({
      id: 'user-123',
      email: 'test@minga.com',
      passwordHash: '$2b$12$...', // bcrypt hash de "Password1"
      role: 'producer',
      alias: 'Test User',
      avatarUrl: null,
      bio: null,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const useCase = new LoginUseCase(mockUserRepository, mockTokenService);

    const result = await useCase.execute({
      email: 'test@minga.com',
      password: 'Password1',
    });

    expect(result.accessToken).toBe('fake-access-token');
    expect(result.user.email).toBe('test@minga.com');
    expect(result.user.role).toBe('producer');
  });

  it('should throw error with invalid email', async () => {
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue(null);

    const useCase = new LoginUseCase(mockUserRepository, mockTokenService);

    await expect(
      useCase.execute({ email: 'nonexistent@minga.com', password: 'Password1' }),
    ).rejects.toThrow('Credenciales inválidas');
  });

  it('should throw error if email not verified', async () => {
    vi.mocked(mockUserRepository.findByEmail).mockResolvedValue({
      id: 'user-123',
      email: 'test@minga.com',
      passwordHash: '$2b$12$...',
      role: 'producer',
      alias: null,
      avatarUrl: null,
      bio: null,
      emailVerified: false,  // ← No verificado
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const useCase = new LoginUseCase(mockUserRepository, mockTokenService);

    await expect(
      useCase.execute({ email: 'test@minga.com', password: 'Password1' }),
    ).rejects.toThrow('Verificá tu email antes de iniciar sesión');
  });
});
```

### Integration Test — Repository (con DB real)

```typescript
// test/integration/database/user-repository.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaUserRepository } from '../../../src/infrastructure/database/user-repository';

describe('PrismaUserRepository', () => {
  let prisma: PrismaClient;
  let repository: PrismaUserRepository;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    repository = new PrismaUserRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should create and find a user', async () => {
    const user = await repository.create({
      email: 'integration-test@minga.com',
      passwordHash: '$2b$12$test-hash',
      role: 'artist',
      alias: 'Integration Test',
      avatarUrl: null,
      bio: null,
      emailVerified: true,
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe('integration-test@minga.com');
    expect(user.role).toBe('artist');

    const found = await repository.findByEmail('integration-test@minga.com');
    expect(found).not.toBeNull();
    expect(found!.id).toBe(user.id);
  });

  it('should return null for non-existent user', async () => {
    const found = await repository.findByEmail('nonexistent@minga.com');
    expect(found).toBeNull();
  });
});
```

---

## 7.6 Reglas de Arquitectura Hexagonal

| Regla | Descripción | Consecuencia de violarla |
|-------|-------------|--------------------------|
| **Domain NO importa nada** | `src/domain/` solo importa TypeScript estándar | Si importa Fastify, Prisma o Zod, el dominio queda acoplado y es imposible de testear aisladamente |
| **Application solo importa Domain** | `src/application/` importa entidades y puertos del domain | Si importa adapters, los use cases dependen de tecnología concreta |
| **Infrastructure importa todo** | `src/infrastructure/` importa domain (para implementar puertos) y application (para invocar use cases) | Es la capa que conecta todo con el mundo exterior |
| **Puertos en Domain, implementaciones en Infrastructure** | Las interfaces viven en `domain/ports/`, las clases concretas en `infrastructure/` | Si la implementación vive en domain, no podés swappear entre Prisma y otro ORM |
| **Un use case, una responsabilidad** | Cada use case hace UNA sola cosa | Si un use case hace login Y envía email Y crea perfil, es imposible de testear y mantener |
| **Value objects se auto-validan** | El constructor o factory method lanza error si el valor es inválido | Si la validación está fuera, podés tener entidades en estado inválido |
| **Entidades son interfaces, no clases** | El domain define contratos, no implementaciones | Si son clases con lógica de persistencia, el domain depende de la DB |

---

## 7.7 Cuándo Simplificar Hexagonal

No todos los servicios necesitan hexagonal completo. Regla práctica:

| Servicio | Complejidad Hexagonal | Justificación |
|----------|----------------------|---------------|
| **Auth** | Completo | Lógica de autenticación es compleja: tokens, roles, verificación, refresh rotation |
| **Catalog** | Completo | Reglas de negocio: estados de beat, ownership, búsqueda, filtros |
| **Streaming** | Simplificado | Es principalmente I/O: recibir archivo, procesar con ffmpeg, subir a R2. Poca lógica de negocio. |
| **Payments** | Completo | Lógica financiera compleja: webhooks, idempotencia, revenue split, licencias |

**Simplificación para Streaming**:

```
apps/streaming/src/
├── domain/
│   ├── entities/audio-file.ts
│   └── ports/
│       ├── audio-storage.ts
│       └── audio-processor.ts
├── application/
│   └── use-cases/
│       ├── upload-audio.ts
│       └── stream-audio.ts
├── infrastructure/
│   ├── http/
│   ├── adapters/
│   │   ├── r2-storage.ts
│   │   └── ffmpeg-processor.ts
│   └── config/
│       └── env.ts
└── index.ts
```

Sin value objects complejos, sin entidades con comportamiento. Solo interfaces de storage y processor.
