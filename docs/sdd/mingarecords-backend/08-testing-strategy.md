# 08 — Estrategia de Testing

> **Versión:** 1.0 — **Fecha:** 12 de mayo de 2026

---

## 8.1 Pirámide de Testing

```
                    ┌─────────────┐
                    │    E2E      │  ← 5-10 tests
                    │  (Playwright)│     Flujo completo del usuario
                    ├─────────────┤
                    │ Integration │  ← 30-50 tests
                    │  (API + DB) │     Endpoints con DB real
                    ├─────────────┤
                    │    Unit     │  ← 100-200 tests
                    │ (Domain +   │     Use cases con mocks
                    │  Use Cases) │     Domain entities, value objects
                    └─────────────┘

Proporción recomendada para MingaRecords:
- 70% Unit Tests    → Rápidos, baratos, no dependen de infraestructura
- 20% Integration   → Validan que los adapters funcionan con DB real
- 10% E2E           → Validan el flujo completo del usuario
```

---

## 8.2 Herramientas de Testing

| Capa | Herramienta | Propósito |
|------|-------------|-----------|
| Unit | Vitest | Framework de test (ya configurado en el proyecto) |
| Unit | @testing-library/react | Tests de componentes React (frontend) |
| Integration | Vitest + Prisma + PostgreSQL (Docker) | Tests de adapters con DB real |
| Integration | Supertest | Tests HTTP de endpoints Fastify |
| E2E | Playwright | Tests de flujo completo (frontend + backend) |
| Mocks | Vitest `vi.fn()` | Mocks de puertos en tests unitarios |
| Coverage | Vitest `--coverage` | Reporte de cobertura (v8) |

---

## 8.3 Unit Tests — Domain Layer

### Qué testear
- **Value objects**: validación en constructor/factory
- **Entities**: comportamientos y reglas de negocio
- **Use cases**: lógica de orquestación con mocks de puertos

### Qué NO testear en unit tests
- Adapters (eso es integration)
- HTTP handlers (eso es integration)
- DB queries (eso es integration)

### Ejemplo: Value Object Tests

```typescript
// test/unit/domain/value-objects/email.test.ts
import { describe, it, expect } from 'vitest';
import { Email } from '../../../src/domain/value-objects/email';

describe('Email', () => {
  it('should create a valid email', () => {
    const email = new Email('Test@Example.COM');
    expect(email.value).toBe('test@example.com');
  });

  it('should normalize and trim', () => {
    const email = new Email('  USER@DOMAIN.COM  ');
    expect(email.value).toBe('user@domain.com');
  });

  it('should reject invalid format', () => {
    expect(() => new Email('not-an-email')).toThrow('Email inválido');
    expect(() => new Email('user@')).toThrow('Email inválido');
    expect(() => new Email('@domain.com')).toThrow('Email inválido');
  });

  it('should reject emails longer than 255 chars', () => {
    const longEmail = 'a'.repeat(250) + '@domain.com';
    expect(() => new Email(longEmail)).toThrow('Email demasiado largo');
  });
});
```

### Ejemplo: Use Case Tests con Mocks

```typescript
// test/unit/application/use-cases/create-beat.test.ts
import { describe, it, expect, vi } from 'vitest';
import { CreateBeatUseCase } from '../../../src/application/use-cases/create-beat';
import type { BeatRepository } from '../../../src/domain/ports/beat-repository';

describe('CreateBeatUseCase', () => {
  const mockRepository: BeatRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    list: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
  };

  it('should create a beat with valid data', async () => {
    vi.mocked(mockRepository.create).mockResolvedValue({
      id: 'beat-123',
      producerId: 'user-456',
      title: 'Test Beat',
      slug: 'test-beat',
      genre: 'trap',
      bpm: 140,
      key: 'Cm',
      priceCents: 2999,
      description: null,
      tags: ['dark'],
      previewUrl: null,
      streamUrl: null,
      playsCount: 0,
      salesCount: 0,
      status: 'pending_audio',
      publishedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    });

    const useCase = new CreateBeatUseCase(mockRepository);

    const result = await useCase.execute({
      producerId: 'user-456',
      title: 'Test Beat',
      genre: 'trap',
      bpm: 140,
      key: 'Cm',
      priceCents: 2999,
      tags: ['dark'],
    });

    expect(result.title).toBe('Test Beat');
    expect(result.slug).toBe('test-beat');
    expect(result.status).toBe('pending_audio');
    expect(mockRepository.create).toHaveBeenCalledTimes(1);
  });

  it('should reject title shorter than 3 chars', async () => {
    const useCase = new CreateBeatUseCase(mockRepository);

    await expect(
      useCase.execute({
        producerId: 'user-456',
        title: 'AB',
        genre: 'trap',
        priceCents: 2999,
      }),
    ).rejects.toThrow('El título debe tener al menos 3 caracteres');
  });

  it('should reject price below minimum', async () => {
    const useCase = new CreateBeatUseCase(mockRepository);

    await expect(
      useCase.execute({
        producerId: 'user-456',
        title: 'Valid Title',
        genre: 'trap',
        priceCents: 50,  // $0.50 < $1.00 mín
      }),
    ).rejects.toThrow('El precio mínimo es $1.00 USD');
  });
});
```

---

## 8.4 Integration Tests — Adapters + DB

### Setup
- PostgreSQL en Docker (el mismo `docker-compose.yml` de desarrollo)
- Prisma migrate antes de correr los tests
- Transacciones para aislar cada test (rollback al final)

### Ejemplo: Repository Integration Test

```typescript
// test/integration/database/beat-repository.test.ts
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaBeatRepository } from '../../../src/infrastructure/database/beat-repository';

describe('PrismaBeatRepository', () => {
  let prisma: PrismaClient;
  let repository: PrismaBeatRepository;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
    repository = new PrismaBeatRepository(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Limpiar antes de cada test
    await prisma.beat.deleteMany();
  });

  it('should create a beat and retrieve it by id', async () => {
    const beat = await repository.create({
      producerId: 'user-123',
      title: 'Integration Test Beat',
      slug: 'integration-test-beat',
      genre: 'trap',
      priceCents: 2999,
      tags: ['test'],
      status: 'pending_audio',
    });

    expect(beat.id).toBeDefined();
    expect(beat.title).toBe('Integration Test Beat');
    expect(beat.status).toBe('pending_audio');

    const found = await repository.findById(beat.id);
    expect(found).not.toBeNull();
    expect(found!.id).toBe(beat.id);
  });

  it('should list beats with pagination', async () => {
    // Crear 15 beats
    for (let i = 0; i < 15; i++) {
      await repository.create({
        producerId: `user-${i}`,
        title: `Beat ${i}`,
        slug: `beat-${i}`,
        genre: 'trap',
        priceCents: 1000 + i * 100,
        tags: [],
        status: 'ready',
      });
    }

    const page1 = await repository.list({ page: 1, limit: 10 });
    expect(page1.data.length).toBe(10);
    expect(page1.totalPages).toBe(2);
    expect(page1.totalItems).toBe(15);

    const page2 = await repository.list({ page: 2, limit: 10 });
    expect(page2.data.length).toBe(5);
  });

  it('should filter beats by genre', async () => {
    await repository.create({
      producerId: 'user-1',
      title: 'Trap Beat',
      slug: 'trap-beat',
      genre: 'trap',
      priceCents: 2000,
      tags: [],
      status: 'ready',
    });

    await repository.create({
      producerId: 'user-2',
      title: 'Lo-fi Beat',
      slug: 'lofi-beat',
      genre: 'lo-fi',
      priceCents: 1500,
      tags: [],
      status: 'ready',
    });

    const trapBeats = await repository.list({ genre: 'trap' });
    expect(trapBeats.data.length).toBe(1);
    expect(trapBeats.data[0].genre).toBe('trap');
  });

  it('should soft delete a beat', async () => {
    const beat = await repository.create({
      producerId: 'user-1',
      title: 'To Delete',
      slug: 'to-delete',
      genre: 'trap',
      priceCents: 2000,
      tags: [],
      status: 'ready',
    });

    await repository.softDelete(beat.id);

    const deleted = await repository.findById(beat.id);
    expect(deleted!.deletedAt).not.toBeNull();

    // Soft-deleted beats no aparecen en list
    const list = await repository.list();
    expect(list.data.find((b) => b.id === beat.id)).toBeUndefined();
  });
});
```

### Ejemplo: HTTP Integration Test (Supertest)

```typescript
// test/integration/http/auth-routes.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { authRoutes } from '../../../src/infrastructure/http/routes/auth.routes';

describe('Auth Routes', () => {
  let app: Fastify.FastifyInstance;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();

    app = Fastify();

    // Setup DI y routes (simplificado para el test)
    await app.register(authRoutes, { prefix: '/api/v1' });
    await app.ready();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('POST /auth/register should create a new user', async () => {
    const response = await request(app.server)
      .post('/api/v1/auth/register')
      .send({
        email: 'newuser@minga.com',
        password: 'Password123',
        role: 'producer',
      });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('newuser@minga.com');
    expect(response.body.user.role).toBe('producer');
    expect(response.body.accessToken).toBeDefined();
  });

  it('POST /auth/register should reject duplicate email', async () => {
    // Primero crear el usuario
    await request(app.server)
      .post('/api/v1/auth/register')
      .send({
        email: 'duplicate@minga.com',
        password: 'Password123',
        role: 'artist',
      });

    // Intentar crear de nuevo
    const response = await request(app.server)
      .post('/api/v1/auth/register')
      .send({
        email: 'duplicate@minga.com',
        password: 'Password123',
        role: 'artist',
      });

    expect(response.status).toBe(409);
    expect(response.body.type).toContain('conflict');
  });

  it('POST /auth/login should reject invalid credentials', async () => {
    const response = await request(app.server)
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent@minga.com',
        password: 'WrongPassword',
      });

    expect(response.status).toBe(401);
    expect(response.body.type).toContain('unauthenticated');
  });
});
```

---

## 8.5 E2E Tests — Playwright

### Qué testear en E2E
Solo los flujos críticos del usuario. No testear cada endpoint.

| Test | Flujo | Prioridad |
|------|-------|-----------|
| `register-login-flow` | Registro → Login → Ver perfil | P0 |
| `upload-beat-flow` | Login → Crear beat → Subir audio → Ver en catálogo | P0 |
| `browse-stream-flow` | Abrir catálogo → Filtrar → Escuchar preview | P0 |
| `purchase-flow` | Login → Ver beat → Comprar → Recibir licencia | P0 |
| `error-states` | Login inválido → Upload archivo no audio → Pago fallido | P0 |

### Ejemplo: E2E Test — Purchase Flow

```typescript
// test/e2e/purchase-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete purchase flow', async ({ page }) => {
  // 1. Login como artista
  await page.goto('/auth/login');
  await page.fill('input[name="email"]', 'artist@test.com');
  await page.fill('input[name="password"]', 'Password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/catalog');

  // 2. Buscar un beat
  await page.goto('/catalog');
  await page.fill('input[name="search"]', 'trap');
  await page.click('button[type="submit"]');
  await expect(page.locator('[data-testid="beat-card"]')).toBeVisible();

  // 3. Ver detalle del beat
  await page.click('[data-testid="beat-card"] >> nth=0');
  await expect(page.locator('[data-testid="beat-title"]')).toBeVisible();

  // 4. Escuchar preview
  const audioPlayer = page.locator('audio');
  await expect(audioPlayer).toBeVisible();

  // 5. Comprar (redirige a Stripe en test mode)
  await page.click('[data-testid="buy-button"]');
  await expect(page).toHaveURL(/checkout\.stripe\.com/);

  // 6. Completar pago en Stripe (test mode)
  await page.fill('input[name="cardNumber"]', '4242424242424242');
  await page.fill('input[name="cardExpiry"]', '12/30');
  await page.fill('input[name="cardCvc"]', '123');
  await page.click('button[type="submit"]');

  // 7. Ver confirmación
  await expect(page).toHaveURL(/success/);
  await expect(page.locator('[data-testid="purchase-confirmation"]')).toBeVisible();
});
```

---

## 8.6 Contract Testing — OpenAPI Validation

### Estrategia
Validar que las respuestas de los endpoints cumplen con los contratos OpenAPI definidos en `docs/openapi/`.

```typescript
// test/integration/contract/openapi-validation.test.ts
import { describe, it, expect } from 'vitest';
import { createValidator } from 'openapi-validator';
import authContract from '../../../docs/openapi/auth.openapi.yaml';

describe('OpenAPI Contract — Auth Service', () => {
  const validator = createValidator(authContract);

  it('POST /auth/register response matches schema', async () => {
    const response = {
      status: 201,
      body: {
        user: {
          id: 'user-123',
          email: 'test@minga.com',
          role: 'producer',
          alias: null,
        },
        accessToken: 'jwt-token-here',
      },
    };

    const valid = await validator.validateResponse('/auth/register', 'post', response.status, response.body);
    expect(valid.valid).toBe(true);
  });

  it('POST /auth/login 401 response matches schema', async () => {
    const response = {
      status: 401,
      body: {
        type: 'https://mingarecords.com/errors/unauthenticated',
        title: 'Credenciales inválidas',
        status: 401,
        detail: 'El email o la contraseña son incorrectos.',
      },
    };

    const valid = await validator.validateResponse('/auth/login', 'post', 401, response.body);
    expect(valid.valid).toBe(true);
  });
});
```

### CI Gate
En el pipeline de CI, validar que los contratos OpenAPI son válidos:

```yaml
# En ci.yml
- name: Validate OpenAPI contracts
  run: npx @redocly/cli lint docs/openapi/*.yaml
```

---

## 8.7 Mocking Strategy

### Qué mockear
| Elemento | Por qué | Cómo |
|----------|---------|------|
| Repositorios en tests de use cases | No queremos DB en unit tests | `vi.fn()` con Vitest |
| TokenService en tests de use cases | No queremos crypto real | `vi.fn().mockResolvedValue('fake-token')` |
| EmailService en tests de use cases | No queremos enviar emails reales | `vi.fn()` |
| Stripe SDK en tests de Payments | No queremos llamadas reales a Stripe | `vi.fn()` con responses predefinidos |
| HTTP clients (Catalog, Auth) en tests de Payments/Streaming | No queremos dependencias cross-service | `vi.fn()` |
| ffmpeg en tests de Streaming | ffmpeg es pesado y lento | Mock del adapter, no del binario |

### Qué NO mockear
| Elemento | Por qué |
|----------|---------|
| Prisma en integration tests | Queremos validar queries reales |
| Zod schemas | La validación debe ser real |
| Value objects | La validación de dominio debe ser real |
| Fastify server en integration tests | Queremos validar el HTTP real |

---

## 8.8 CI Validation Gates

| Gate | Qué valida | Cuándo se ejecuta | Bloquea merge si falla |
|------|-----------|-------------------|------------------------|
| `pnpm lint` | ESLint sin errores | Cada push a PR | ✅ Sí |
| `pnpm type-check` | TypeScript sin errores | Cada push a PR | ✅ Sí |
| `pnpm test` (unit) | Todos los unit tests pasan | Cada push a PR | ✅ Sí |
| `pnpm test` (integration) | Integration tests con DB | Cada push a PR | ✅ Sí |
| OpenAPI lint | Contratos `.yaml` válidos | Cada push a PR | ✅ Sí |
| Coverage threshold | > 60% cobertura (MVP) | Cada push a PR | ⚠️ Warning (no bloquea en MVP) |
| E2E tests | Flujos críticos completos | En merge a main | ✅ Sí |

---

## 8.9 Testing de Features de Audio

### Desafíos
- ffmpeg requiere binario instalado
- Los archivos de audio reales son pesados
- El streaming de audio es difícil de testear en CI

### Estrategia

```typescript
// test/unit/application/use-cases/upload-audio.test.ts
import { describe, it, expect, vi } from 'vitest';
import { UploadAudioUseCase } from '../../../src/application/use-cases/upload-audio';
import type { AudioStorage } from '../../../src/domain/ports/audio-storage';
import type { AudioProcessor } from '../../../src/domain/ports/audio-processor';
import type { CatalogClient } from '../../../src/infrastructure/adapters/catalog-client';

describe('UploadAudioUseCase', () => {
  const mockStorage: AudioStorage = {
    upload: vi.fn().mockResolvedValue('https://cdn.mingarecords.com/previews/beat-123.mp3'),
    delete: vi.fn(),
  };

  const mockProcessor: AudioProcessor = {
    generatePreview: vi.fn().mockResolvedValue('/tmp/preview-123.mp3'),
    extractMetadata: vi.fn().mockResolvedValue({
      duration: 180,
      sampleRate: 44100,
      channels: 2,
      format: 'wav',
    }),
    validateAudio: vi.fn().mockResolvedValue(true),
  };

  const mockCatalog: CatalogClient = {
    notifyAudioReady: vi.fn(),
    notifyAudioDeleted: vi.fn(),
  };

  it('should upload audio and notify catalog', async () => {
    const useCase = new UploadAudioUseCase(mockStorage, mockProcessor, mockCatalog);

    const result = await useCase.execute({
      beatId: 'beat-123',
      audioBuffer: Buffer.from('fake-wav-data'),
      mimeType: 'audio/wav',
    });

    expect(mockProcessor.validateAudio).toHaveBeenCalled();
    expect(mockProcessor.generatePreview).toHaveBeenCalled();
    expect(mockStorage.upload).toHaveBeenCalledTimes(2); // original + preview
    expect(mockCatalog.notifyAudioReady).toHaveBeenCalledWith({
      beatId: 'beat-123',
      previewUrl: expect.any(String),
      streamUrl: expect.any(String),
    });
  });

  it('should reject non-audio files', async () => {
    vi.mocked(mockProcessor.validateAudio).mockResolvedValue(false);

    const useCase = new UploadAudioUseCase(mockStorage, mockProcessor, mockCatalog);

    await expect(
      useCase.execute({
        beatId: 'beat-123',
        audioBuffer: Buffer.from('fake-data'),
        mimeType: 'application/octet-stream',
      }),
    ).rejects.toThrow('El archivo no es un formato de audio válido');
  });
});
```

### Test Files de Audio
Crear archivos de audio mínimos para tests:

```
test/fixtures/audio/
├── valid-beat-30s.wav      # WAV válido de 30 segundos (~5MB)
├── valid-beat-3min.wav     # WAV válido de 3 minutos (~30MB)
├── invalid-not-audio.txt   # Archivo de texto con extensión .wav
├── too-short-5s.wav        # WAV de 5 segundos (rechazado: < 30s)
└── too-large-200mb.wav     # Referencia (no commitear el archivo real)
```

---

## 8.10 Resumen de Testing por Servicio

| Servicio | Unit Tests | Integration Tests | E2E Tests |
|----------|-----------|-------------------|-----------|
| Auth | Register, Login, Refresh, Profile | DB repository, HTTP routes | Register → Login → Profile |
| Catalog | CreateBeat, ListBeats, SearchBeats | DB repository, HTTP routes, full-text search | Browse → Filter → Search |
| Streaming | UploadAudio, GeneratePreview, StreamAudio | R2 storage (mock), ffmpeg (mock), HTTP routes | Upload → Process → Stream |
| Payments | CreateCheckout, HandleWebhook, GenerateLicense | Stripe (mock), DB repository, HTTP routes | Checkout → Webhook → License |
| **Total estimado** | ~120 tests | ~40 tests | ~5 tests |

### Cobertura Target

| Capa | Target MVP | Target v2 |
|------|-----------|-----------|
| Domain (entities, value objects) | 90%+ | 95%+ |
| Application (use cases) | 80%+ | 90%+ |
| Infrastructure (adapters) | 60%+ | 80%+ |
| HTTP routes | 60%+ | 80%+ |
| **Global** | **60%+** | **80%+** |

---

## 8.11 Data Management para Tests

### Unit Tests
- Datos inline en los tests (no fixtures externas)
- Mocks devuelven datos predefinidos

### Integration Tests
- `beforeEach`: limpiar tablas relevantes
- Cada test crea sus propios datos
- `afterAll`: limpiar todo

### E2E Tests
- Seed script: `pnpm db:seed` crea datos base para E2E
- Usuarios de prueba: `test-producer@minga.com`, `test-artist@minga.com`
- Beats de prueba: 5 beats con diferentes géneros y precios
- Stripe test cards: `4242424242424242` (success), `4000000000000002` (declined)
