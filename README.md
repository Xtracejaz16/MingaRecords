# MingaRecords

**La plataforma donde los beatmakers monetizan su música directamente, sin intermediarios.**

> 🎵 Un productor sube un beat → un artista lo escucha → compra una licencia → todo en minutos.

---

## 📋 Resumen del Proyecto

MingaRecords resuelve **tres problemas reales** del ecosistema de beatmaking latinoamericano:

1. **Visibilidad** — Los productores no tienen un lugar para mostrar sus beats a compradores potenciales.
2. **Monetización** — Vender beats por WhatsApp o redes sociales es inseguro, informal y no escala.
3. **Descubrimiento** — Los artistas no saben dónde encontrar productores de calidad con precios claros.

### Objetivos del MVP

| # | Objetivo | Criterio de éxito |
|---|----------|-------------------|
| OBJ-1 | Beatmaker sube un beat con metadata (título, género, precio, licencia) | Subida funcional con preview automático en < 30 seg |
| OBJ-2 | Comprador navega el catálogo, filtra por género y precio | Búsqueda y filtro con < 500ms de respuesta |
| OBJ-3 | Comprador escucha preview de 30 segundos antes de comprar | Streaming de preview en < 2 seg desde click |
| OBJ-4 | Comprador paga y recibe su licencia automáticamente | Pago procesado en < 10 seg, entrega de licencia inmediata |
| OBJ-5 | Productor ve sus ganancias y estadísticas en un dashboard | Dashboard con datos reales actualizados cada 24h |

---

## 🧱 Stack Tecnológico

### Backend (monolito modular)

| Componente | Tecnología | Versión | Propósito |
|------------|-----------|---------|-----------|
| Framework | **Express.js** | 5.x | Servidor HTTP principal |
| Lenguaje | **TypeScript** | 5.x | Tipado estático full-stack |
| ORM | **Prisma** | 7.x | ORM con tipos generados automáticamente |
| Base de datos | **PostgreSQL** (Docker/Supabase) | 16 | Persistencia de datos |
| Validación | **Zod** | 4.x | Schemas de validación en runtime |
| Autenticación | **JWT** (jsonwebtoken) | 9.x | Auth stateless con refresh tokens |
| Encriptación | **bcryptjs** | 3.x | Hash de contraseñas |
| Emails | **Resend** | 6.x | Emails transaccionales (free: 100/día) |
| Pagos | **MercadoPago** | — | Pasarela de pagos LATAM |
| Audio | **Cloudflare R2** | — | Almacenamiento y streaming de beats |

### Frontend (SPA)

| Componente | Tecnología | Propósito |
|------------|-----------|-----------|
| Framework | **React 19** | UI declarativa con React Compiler |
| Build tool | **Vite** | Dev server y bundler ultrarrápido |
| Tipado | **TypeScript** | Tipado estático |
| Estado global | **Zustand 5** | Estado liviano, sin boilerplate |
| Estilos | **Tailwind CSS 4** | Utility-first CSS |
| Testing | **Vitest** | Tests unitarios y de integración |
| Iconos | **lucide-react** | Iconos SVG livianos |

### Monorepo

| Herramienta | Propósito |
|------------|-----------|
| **pnpm** | Package manager con workspaces |
| **Turbo** | Task runner para pipelines del monorepo |
| **Docker** | PostgreSQL local para desarrollo |

---

## 🏗️ Arquitectura

### Estilo: Monolito Modular (con extracción a microservicios en v2)

La arquitectura parte de una decisión crítica: **2 developers, 1 semana de deadline, $0 de presupuesto**. En lugar de 4 microservicios independientes (que costarían ~$18/mes y requerirían deploys separados), implementamos un **monolito modular**:

```
CLIENTE (React 19 + Vite)
       │ HTTPS
       ▼
┌───────────────────────────────────────────────┐
│         BACKEND — Express.js                   │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │   AUTH   │  │  BEATS   │  │ PAYMENTS │     │
│  │  Módulo  │  │  Módulo  │  │  Módulo  │     │
│  │          │  │          │  │          │     │
│  │ /auth/*  │  │ /beats/* │  │/payments/*│    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘     │
│       │              │              │           │
│       └──────────────┴──────────────┘           │
│          Llamadas directas entre módulos         │
│          (sin HTTP, sin serialización)           │
└───────────────────────┬─────────────────────────┘
                        ▼
┌───────────────────────────────────────────────┐
│         INFRAESTRUCTURA COMPARTIDA              │
│                                                 │
│  PostgreSQL  │  Cloudflare R2  │ MercadoPago   │
│  (Docker)    │  (beats audio)  │  (pagos)      │
└───────────────────────────────────────────────┘
```

**¿Por qué monolito modular y no microservicios?**

| Razón | Detalle |
|-------|---------|
| **2 devs, deadline corto** | No hay margen para gestionar 4 deploys independientes |
| **Costo $0** | AWS Free Tier cubre 1 proceso, no 4 |
| **Transacciones ACID** | Un pago actualiza ventas + licencia en 1 transacción |
| **Sin overhead de red** | Llamadas directas, sin serialización JSON, sin timeouts |
| **Extracción trivial en v2** | Cada módulo ya está aislado en su carpeta |

### Estructura del Backend por Módulos

```
apps/backend/src/
├── app.ts                   # Express app + middleware global
├── modules/
│   ├── auth/                # Registro, login, JWT, roles, verificación email
│   │   ├── routes.ts        → 6 endpoints REST
│   │   ├── service.ts       → Lógica de negocio (bcrypt, JWT, Resend)
│   │   ├── repository.ts    → Prisma queries (users, refresh_tokens)
│   │   └── types.ts         → Zod schemas, interfaces
│   │
│   ├── beats/               # CRUD beats, búsqueda, filtros, perfiles
│   │   ├── routes.ts        → Endpoints REST
│   │   ├── service.ts       → Lógica de beats, dashboard stats
│   │   ├── repository.ts    → Prisma queries (beats, genres)
│   │   └── types.ts         → Zod schemas, interfaces
│   │
│   └── [payments/]          # MVP: MercadoPago checkout + webhooks
│       ├── routes.ts        → Checkout + webhooks
│       ├── service.ts       → Integración MercadoPago
│       ├── repository.ts    → Prisma queries (transactions, licenses)
│       └── types.ts         → Zod schemas
│
├── shared/
│   └── middleware/
│       ├── auth.ts          → JWT verification middleware
│       └── ...              → Error handler, rate limiter
│
├── config/
│   └── env.ts               → Zod-validated env variables
│
└── prisma/
    └── schema.prisma        → Modelo de datos completo
```

### Arquitectura del Frontend: Hexagonal

El frontend implementa **Arquitectura Hexagonal (Puertos y Adaptadores)** con separación clara de capas:

```
apps/web/src/
├── domain/                  ← Núcleo del negocio (sin dependencias externas)
│   ├── auth/
│   │   ├── entities/        → AuthUser, AuthSession, AuthDraft
│   │   ├── ports/           → AuthRepository (interfaz/contrato)
│   │   └── value-objects/   → Validaciones, normalización de email
│   ├── cart/
│   ├── beats/
│   └── marketplace/
│
├── application/             ← Casos de uso (dependen solo de domain)
│   ├── auth/
│   │   └── use-cases/       → login, register, loadSession, clearSession
│   ├── cart/
│   │   └── use-cases/       → ProceedToCheckout, SelectLicense
│   └── ...
│
├── infrastructure/         ← Adaptadores (implementan ports)
│   ├── auth/
│   │   └── adapters/        → ApiAuthRepository (fetch nativo)
│   │                       → LocalStorageAuthAdapter (fallback local)
│   └── ...
│
├── ui/                     ← Componentes React (consumen hooks)
│   ├── auth/
│   │   ├── hooks/           → useAuth (conecta UI con casos de uso)
│   │   └── screens/         → AuthScreen, PanelScreen, VerifyEmailScreen
│   ├── marketplace/
│   ├── beats/
│   └── ...
│
├── routing/
│   └── routes.ts            → Hash-based routing SPA
│
└── App.tsx                  → Entry point con route resolver
```

**Reglas de dependencia estrictas:**
- `domain` → No importa `ui` ni `infrastructure`
- `application` → Solo importa `domain`
- `infrastructure` → Implementa puertos de `domain`
- `ui` → Consume hooks, nunca llama a adaptadores directamente

---

## 📡 API REST

Todos los endpoints usan el prefijo `/api/v1/` con versionado semántico.

### Auth Module

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| POST | `/api/v1/auth/register` | Registrar nuevo usuario (email, password, alias, role) | No |
| POST | `/api/v1/auth/login` | Iniciar sesión, devuelve JWT + refresh cookie | No |
| POST | `/api/v1/auth/logout` | Cerrar sesión, elimina refresh token | Sí |
| GET | `/api/v1/auth/me` | Obtener perfil del usuario autenticado | Sí |
| POST | `/api/v1/auth/refresh` | Renovar access token vía refresh token | Cookie |
| GET | `/api/v1/auth/verify-email` | Verificar email con token de verificación | No |

### Beats Module

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| GET | `/api/v1/beats` | Listar beats con paginación y filtros | No |
| GET | `/api/v1/beats/:id` | Detalle de un beat | No |
| POST | `/api/v1/beats` | Crear nuevo beat | Producer |

**Formato de errores:** RFC 7807 (Problem Details)
```json
{
  "error": "VALIDATION_ERROR",
  "message": "El email ya está registrado"
}
```

---

## 🗄️ Modelo de Datos

### Diagrama Entidad-Relación

```
User
├── id (UUID, PK)
├── email (unique)
├── passwordHash
├── alias
├── role (producer | artist)
├── emailVerified (boolean)
├── createdAt
└── updatedAt

RefreshToken
├── id (UUID, PK)
├── token (unique)
├── userId (FK → User)
├── expiresAt
└── createdAt

VerificationToken
├── id (UUID, PK)
├── token (unique)
├── userId (FK → User)
├── expiresAt
└── createdAt

Beat
├── id (UUID, PK)
├── title
├── slug (unique)
├── description
├── price (Decimal)
├── bpm
├── key
├── genre
├── tags (JSON)
├── status (draft | published | sold | archived | deleted)
├── audioUrl
├── previewUrl
├── plays (int)
├── producerId (FK → User)
├── buyerId (FK → User, nullable)
├── createdAt
└── updatedAt
```

**Decisiones de diseño:**
- **FK lógicas entre schemas**: Los módulos tienen schemas separados en PostgreSQL para facilitar la migración a microservicios en v2. La integridad referencial se mantiene a nivel de aplicación.
- **Un solo PrismaClient**: En el monolito, un solo cliente Prisma accede a todos los schemas, permitiendo transacciones ACID entre módulos.

---

## 🔐 Autenticación y Seguridad

### Flujo de Autenticación

```
Registro → POST /auth/register → Se crea usuario + verification token
  → Se envía email via Resend con link de verificación
  → Usuario hace click → SPA llama a GET /auth/verify-email?token=xxx
  → Email verificado → Usuario puede loguearse

Login → POST /auth/login → Valida credenciales (bcrypt)
  → JWT access token (15 min) en memoria del cliente
  → Refresh token (7 días) en httpOnly cookie
  → Access token se envía en header Authorization: Bearer <token>

GET /auth/me → Middleware JWT verifica token sin llamar a Auth Module
  → Devuelve perfil del usuario autenticado

Refresh → POST /auth/refresh → Cookie httpOnly se envía automáticamente
  → Nuevo access token + refresh token rotado (seguridad)
```

### Decisiones de Seguridad

| Decisión | Justificación |
|----------|---------------|
| **JWT auto-contenido** | No se consulta DB en cada request — el middleware verifica la firma directamente |
| **Refresh token en httpOnly cookie** | No accesible desde JavaScript — previene XSS token theft |
| **Access token en memoria** | No se persiste en localStorage — previene XSS persistente |
| **Refresh token rotation** | Cada refresh invalida el token anterior — previene token reuse |
| **bcrypt + salt (10 rounds)** | Hash de passwords con costo computacional controlado |
| **Password: min 8 + mayúscula + número** | Validación tanto en frontend como en backend (Zod) |
| **Rate limiting in-memory** | Protección contra abuso sin Redis (simplicidad MVP) |

---

## 💳 Flujo de Pago (MVP)

```
1. Comprador hace clic en "Comprar" en un beat
2. Frontend llama a POST /checkout con beatId
3. Backend crea preferencia en MercadoPago
4. Comprador es redirigido a MercadoPago para pagar
5. MercadoPago envía webhook (payment.updated) al backend
6. Backend verifica el pago contra API de MercadoPago
7. Si approved → marca beat como vendido + genera licencia
8. Comprador recibe email con link de descarga
9. Productor ve la venta reflejada en su dashboard
```

**Pasarela:** MercadoPago (disponible en LATAM, sandbox completo). Stripe se descartó por restricciones legales en Colombia/Argentina.

---

## 🚀 Despliegue ($0 Infrastructure)

### Estrategia MVP

| Componente | Proveedor | Costo | Detalle |
|------------|-----------|-------|---------|
| Backend | **AWS EC2 t3.micro** | $0 (12 meses) | 750h/mes gratis, corre el monolito |
| Frontend | **Vercel** | $0 | Deploy automático desde GitHub |
| Base de datos | **Docker (dev)** / Supabase (prod) | $0 | PostgreSQL en contenedor local |
| Storage audio | **Cloudflare R2** | $0 (10GB) | S3-compatible, sin costo de egress |
| Emails | **Resend** | $0 (100/día) | Free tier para emails transaccionales |
| Pagos | **MercadoPago** | $0 | Sin costo fijo mensual, ~5% por venta |

### Decisiones de Infraestructura (ADR-004)

El ADR-004 revisó el stack original (Fastify + Stripe + BunnyCDN + 4 microservicios) y lo simplificó drásticamente:

- **Express.js** sobre Fastify — El equipo ya lo domina, la diferencia de performance es irrelevante para MVP
- **MercadoPago** sobre Stripe — Stripe no está disponible legalmente en LATAM sin empresa en EE.UU.
- **Monolito modular** sobre 4 microservicios — Costo $0, un solo deploy, transacciones ACID
- **$0 absoluto** — Se eliminaron BunnyCDN, Upstash Redis, Cloudflare Workers, circuit breaker

---

## 🧪 Testing

### Backend
- **Framework:** Vitest
- **Tests de integración:** supertest para endpoints HTTP
- **Prisma errores:** Tests de manejo de errores de base de datos
- **Auth flow:** 19 tests de integración para rutas de autenticación
- **Beats:** Tests de HTTP, repositorio, servicio y tipos

### Frontend
- **Framework:** Vitest + React Testing Library
- **Tests de integración:** ApiAuthRepository con mocks de fetch
- **Tests de componentes:** App.test.tsx con renderizado de rutas
- **Cobertura:** ~11 archivos de test, 103+ tests pasando

---

## 📊 Estado Actual del Proyecto

### Implementado ✅

| Módulo | Backend | Frontend | Tests |
|--------|---------|----------|-------|
| Auth (registro, login, JWT, refresh, logout, /me) | ✅ | ✅ | ✅ 19 tests |
| Auth (verificación de email) | ✅ | ✅ | ⬜ |
| Beats (CRUD, búsqueda, filtros, streaming) | ✅ PR #33 | ⬜ | ✅ 4 archivos |
| Beats (rutas HTTP, upload, streaming) | ✅ PR #35 | ⬜ | ✅ |
| Payments (MercadoPago) | ⬜ | ⬜ | ⬜ |
| Storage (R2) | ⬜ | ⬜ | ⬜ |
| Marketplace UI | ⬜ | ⬜ | ⬜ |

### Pendiente 🟡
- Módulo de pagos con MercadoPago (checkout, webhooks, licencias)
- Módulo de storage (subida de audio a R2, streaming)
- Dashboard de productor con estadísticas
- Marketplace UI completo con reproductor de preview
- Deploy a producción (AWS EC2 / Vercel)

---

## 🏁 Roadmap

```
SEMANA 1 — MVP
────────────────────────────────────
Día 1-2:  Auth + Perfiles básicos
Día 2-3:  Beats CRUD + Búsqueda
Día 3-4:  Storage + Streaming + R2
Día 4-5:  MercadoPago + Webhooks + Licencias
Día 5-6:  Dashboard + Frontend Integration
Día 6-7:  Testing + Deploy AWS Free Tier
```

### Criterio de éxito del MVP
> Un productor puede subir un beat, un artista puede escucharlo y comprarlo con MercadoPago, y el productor ve la venta en su dashboard.

---

## 📐 Principios Arquitectónicos

| # | Principio | Qué significa en la práctica |
|---|-----------|------------------------------|
| P1 | **Simplicidad extrema** | Si algo se puede hacer con 1 archivo en vez de 3, se hace con 1 |
| P2 | **Costo $0 hasta revenue** | Todo proveedor debe tener un free tier que cubra MVP |
| P3 | **DX primero** | El backend debe correr con `pnpm dev` — si necesitás 5 terminales, está mal diseñado |
| P4 | **Fail fast, fail loud** | Un error debe avisar al usuario en < 3 segundos |
| P5 | **Seguridad por defecto** | JWT corto, refresh httpOnly, archivos validados server-side |

---

## 📚 Decisiones Registradas (ADRs)

| ADR | Decisión | Fecha |
|-----|----------|-------|
| 001 | Arquitectura de Microservicios (revisado a monolito modular en ADR-004) | 06/04/2026 |
| 002 | Arquitectura Hexagonal en frontend (Puertos y Adaptadores) | 10/04/2026 |
| 003 | REST sobre HTTP/1.1 con OpenAPI 3.0 como protocolo de comunicación | 27/04/2026 |
| 004 | Express + MercadoPago + Monolito Modular + $0 infrastructure | 15/05/2026 |

---

## 👥 Equipo

| Rol | Integrante |
|-----|-----------|
| Full-stack Developer | Sebastián Estrada |
| Full-stack Developer | Yair Santiago Cetre |

**Frecuencia de despliegues:** 2 lanzamientos por día para ajustar rápidamente según feedback del mercado.

---

## 🚀 Cómo empezar a desarrollar

```bash
# 1. Clonar e instalar dependencias
pnpm install

# 2. Iniciar base de datos local (Docker)
pnpm docker:up

# 3. Iniciar backend (otra terminal)
cd apps/backend
pnpm db:migrate
pnpm dev          # → http://localhost:3001

# 4. Iniciar frontend (otra terminal)
cd apps/web
pnpm dev          # → http://localhost:5173
```

**Requisitos:** Node.js 22+, pnpm 10+, Docker 24+, Windows/Mac/Linux.
