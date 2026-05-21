# 08 — Estrategia de Testing

> **Versión:** 2.0 — **Fecha:** 19 de mayo de 2026
> **Contexto:** MVP en 1 semana, 2 developers, presupuesto $0

---

## 8.1 Filosofía de Testing para MVP de 1 Semana

Para un MVP con deadline de **una semana**, la prioridad es **testear lo que importa y saltear el resto**. No hay tiempo para testing perfecto — hay que ser pragmático.

**Principios:**
- Testeá los caminos críticos que, si fallan, el producto no funciona
- Mockeá todo lo externo (MercadoPago, R2, Supabase)
- No pierdas tiempo en contract testing, Docker, ni cobertura al 80%
- Si un test tarda más de 30 minutos en escribirse, preguntate si vale la pena

### Pirámide de Testing (Simplificada)

```
         ┌─────┐
         │ E2E │  ← 3 tests (caminos críticos solamente)
         ├─────┤
         │ API │  ← 10-15 tests (endpoints clave)
         ├─────┤
         │Unit │  ← 20-30 tests (servicios + validación)
         └─────┘
```

**Total estimado:** ~35-50 tests, no 200+.

---

## 8.2 Herramientas

| Capa | Herramienta | Propósito |
|------|-------------|-----------|
| Unit + API | Vitest | Framework de test |
| API | Supertest | Tests HTTP de endpoints Express |
| E2E (opcional) | Playwright | 3 flujos críticos, solo si hay tiempo |
| Mocks | Vitest `vi.fn()` | Mocks de SDKs y servicios externos |
| Coverage | Vitest `--coverage` | Apuntar a ~60%, no más |

---

## 8.3 Unit Tests — Servicios y Validación

### Qué testear (prioridad)
1. **Validación Zod** de inputs (auth, beats, pagos)
2. **Servicios** que contienen lógica de negocio (auth, beats, pagos)
3. **Utilidades** (slugs, formateo de precios, etc.)

### Qué NO testear en unit tests
- Rutas HTTP (eso va en API tests)
- Conexiones reales a Supabase, R2 o MercadoPago
- Middlewares genéricos de Express

### Ejemplo: Validación Zod

```typescript
// test/unit/validation/auth.test.ts
import { describe, it, expect } from 'vitest';
import { registerSchema } from '../../src/validation/auth';

describe('registerSchema', () => {
  it('should accept valid data', () => {
    const result = registerSchema.safeParse({
      email: 'test@minga.com',
      password: 'Password123',
      role: 'producer',
    });

    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'Password123',
      role: 'producer',
    });

    expect(result.success).toBe(false);
  });

  it('should reject weak password', () => {
    const result = registerSchema.safeParse({
      email: 'test@minga.com',
      password: '123',
      role: 'producer',
    });

    expect(result.success).toBe(false);
  });

  it('should reject invalid role', () => {
    const result = registerSchema.safeParse({
      email: 'test@minga.com',
      password: 'Password123',
      role: 'admin',
    });

    expect(result.success).toBe(false);
  });
});
```

### Ejemplo: Servicio con Mocks

```typescript
// test/unit/services/auth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../src/services/auth';
import { supabase } from '../../src/lib/supabase';
import { jwt } from '../../src/lib/jwt';

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
  },
}));

vi.mock('../../src/lib/jwt', () => ({
  jwt: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
    vi.clearAllMocks();
  });

  it('should register a new user', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@minga.com' } },
      error: null,
    });

    vi.mocked(jwt.sign).mockReturnValue('fake-jwt-token');

    const result = await service.register({
      email: 'test@minga.com',
      password: 'Password123',
      role: 'producer',
    });

    expect(result.user.id).toBe('user-123');
    expect(result.accessToken).toBe('fake-jwt-token');
  });

  it('should reject registration if email exists', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: { user: null },
      error: { message: 'User already registered' },
    });

    await expect(
      service.register({
        email: 'existing@minga.com',
        password: 'Password123',
        role: 'producer',
      })
    ).rejects.toThrow('El email ya está registrado');
  });
});
```

---

## 8.4 API Tests — Supertest + Express

### Qué testear
Endpoints clave que forman parte del flujo del usuario. No hace falta testear cada ruta.

| Endpoint | Qué validar |
|----------|-------------|
| `POST /api/v1/auth/register` | Crea usuario, devuelve JWT |
| `POST /api/v1/auth/login` | Login correcto / credenciales inválidas |
| `GET /api/v1/beats` | Lista beats publicados |
| `POST /api/v1/beats` | Crea beat (requiere auth) |
| `GET /api/v1/beats/:id` | Devuelve beat existente / 404 |
| `POST /api/v1/payments/preference` | Crea preferencia de MercadoPago |
| `POST /api/v1/payments/webhook` | Maneja webhook de MercadoPago |

### Ejemplo: Auth Routes

```typescript
// test/api/auth.test.ts
import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { app } from '../../src/app';

describe('POST /api/v1/auth/register', () => {
  it('should create a new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@minga.com',
        password: 'Password123',
        role: 'producer',
      });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('test@minga.com');
    expect(res.body.accessToken).toBeDefined();
  });

  it('should reject duplicate email', async () => {
    // Primero registrar
    await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'dup@minga.com',
        password: 'Password123',
        role: 'producer',
      });

    // Intentar de nuevo
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'dup@minga.com',
        password: 'Password123',
        role: 'producer',
      });

    expect(res.status).toBe(409);
  });

  it('should reject invalid input', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'not-an-email',
        password: 'short',
      });

    expect(res.status).toBe(400);
  });
});
```

### Ejemplo: Beats Routes

```typescript
// test/api/beats.test.ts
import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';
import { app } from '../../src/app';

describe('GET /api/v1/beats', () => {
  it('should list published beats', async () => {
    const res = await request(app).get('/api/v1/beats');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should support pagination', async () => {
    const res = await request(app)
      .get('/api/v1/beats')
      .query({ page: 1, limit: 5 });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
  });
});

describe('POST /api/v1/beats', () => {
  it('should create a beat with valid auth', async () => {
    // Obtener token de un usuario de test
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'producer@minga.com',
        password: 'Password123',
      });

    const token = loginRes.body.accessToken;

    const res = await request(app)
      .post('/api/v1/beats')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Test Beat',
        genre: 'trap',
        bpm: 140,
        priceCents: 2999,
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Test Beat');
  });

  it('should reject unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/v1/beats')
      .send({
        title: 'Test Beat',
        genre: 'trap',
        priceCents: 2999,
      });

    expect(res.status).toBe(401);
  });
});
```

---

## 8.5 E2E Tests — 3 Caminos Críticos (Opcional)

Solo si hay tiempo después de los unit y API tests. Máximo 3 flujos.

| # | Flujo | Prioridad |
|---|-------|-----------|
| 1 | Registro → Login → Ver perfil | P0 |
| 2 | Login → Crear beat → Ver en catálogo | P0 |
| 3 | Buscar beat → Ver detalle → Crear preferencia de pago | P0 |

### Ejemplo: Registro → Login

```typescript
// test/e2e/auth-flow.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

test('register and login flow', async ({ page }) => {
  // 1. Registro
  await page.goto(`${BASE_URL}/auth/register`);
  await page.fill('input[name="email"]', 'e2e-test@minga.com');
  await page.fill('input[name="password"]', 'Password123');
  await page.selectOption('select[name="role"]', 'producer');
  await page.click('button[type="submit"]');

  // 2. Debería redirigir al dashboard
  await expect(page).toHaveURL(/dashboard/);

  // 3. Logout y login
  await page.goto(`${BASE_URL}/auth/login`);
  await page.fill('input[name="email"]', 'e2e-test@minga.com');
  await page.fill('input[name="password"]', 'Password123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/dashboard/);
});
```

---

## 8.6 Estrategia de Mocking

### Qué mockear

| Elemento | Por qué | Cómo |
|----------|---------|------|
| Supabase client | No queremos queries reales en unit tests | `vi.mock()` con responses predefinidos |
| MercadoPago SDK | No queremos crear preferencias reales | `vi.mock()` con datos fake |
| Cloudflare R2 | No queremos subir archivos reales | `vi.mock()` con upload simulado |
| JWT sign/verify | No queremos crypto real en tests | `vi.fn()` con tokens fake |

### Qué NO mockear

| Elemento | Por qué |
|----------|---------|
| Validación Zod | Tiene que ser real |
| Express app en API tests | Queremos validar el HTTP real |
| Middlewares de auth | Queremos validar que protegen rutas |

### Ejemplo: Mock de MercadoPago

```typescript
// test/unit/services/payments.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentsService } from '../../src/services/payments';

vi.mock('mercadopago', () => ({
  MercadoPago: vi.fn().mockImplementation(() => ({
    preference: {
      create: vi.fn().mockResolvedValue({
        body: {
          id: 'pref-fake-123',
          init_point: 'https://mp.com/checkout/fake-123',
        },
      }),
    },
  })),
}));

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(() => {
    service = new PaymentsService();
    vi.clearAllMocks();
  });

  it('should create a MercadoPago preference', async () => {
    const result = await service.createPreference({
      beatId: 'beat-123',
      title: 'Test Beat',
      priceCents: 2999,
      buyerEmail: 'buyer@minga.com',
    });

    expect(result.preferenceId).toBe('pref-fake-123');
    expect(result.checkoutUrl).toContain('https://mp.com/checkout/');
  });
});
```

---

## 8.7 Qué NO Testear en el MVP

Esto es clave para cumplir el deadline de 1 semana:

- **Contract testing / validación OpenAPI** — No aporta valor inmediato
- **Tests de integración con R2 real** — Mock alcanza
- **Tests de integración con MercadoPago real** — Usar sandbox si hace falta
- **E2E tests más allá de los 3 caminos críticos** — El resto se cubre con API tests
- **Tests de archivos de audio** — Demasiado complejo para el MVP
- **Cobertura al 80%+** — Apuntar a ~60%, lo importante es que los caminos críticos funcionen
- **Tests de cada endpoint CRUD** — Testear los que importan, no todos

---

## 8.8 CI Gate

Simple y directo:

```yaml
# En el pipeline de CI
- name: Run tests
  run: pnpm test

- name: Type check
  run: pnpm type-check
```

**Regla:** `pnpm test` debe pasar para hacer merge. Nada más.

### Scripts en `package.json`

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

### Cobertura

Apuntar a **~60%** global. No bloquear merges por cobertura en el MVP. Si hay tiempo después del launch, se sube.

---

## 8.9 Resumen de Testing

| Capa | Cantidad | Enfoque |
|------|----------|---------|
| Unit | 20-30 | Validación Zod, servicios con mocks |
| API | 10-15 | Endpoints clave con Supertest |
| E2E | 3 | Caminos críticos (opcional) |
| **Total** | **~35-50** | **Lo mínimo para dormir tranquilo** |
