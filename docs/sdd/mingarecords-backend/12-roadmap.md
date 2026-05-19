# 12 — Roadmap Técnico

> **Versión:** 2.0 — **Fecha:** 19 de mayo de 2026
> **Equipo:** 2 developers full-stack, 7 días para MVP, presupuesto $0 (AWS Free Tier)
> **Stack:** Express + Supabase (PostgreSQL) + Cloudflare R2 + MercadoPago

---

## 12.1 Sprint de 7 Días

```
DÍA 1        DÍA 2        DÍA 3        DÍA 4        DÍA 5        DÍA 6        DÍA 7
Setup & Auth Beats       Storage      Frontend     Payments     Polish       Deploy
──────────   ──────────   ──────────   ──────────   ──────────   ──────────   ──────────
Express      CRUD beats   R2 upload    Login page   MercadoPago  Rate limit   EC2 deploy
Supabase     PG schema    ffmpeg       Catalog      Webhooks     Validation   Domain
JWT          Search       Streaming    Filters      Licencias    Tests        Smoke tests
                                                                              
                                        ▲                                      ▲
                                        └── Frontend conectado                 └── MVP LIVE 🚀
```

---

## 12.2 MVP Definition: What's In / What's Out

### ✅ IN (MVP — 7 días)

| Feature | Prioridad | Justificación |
|---------|-----------|---------------|
| Registro/login con email + password | P0 | Sin usuarios no hay plataforma |
| CRUD beats con metadata | P0 | Core product: beats subibles y listables |
| Preview de 30s con streaming HTTP Range | P0 | UX crítica: escuchar antes de comprar |
| Catálogo público con filtros y búsqueda | P0 | Beats visibles para compradores |
| Subida de audio a Cloudflare R2 | P0 | Storage de beats |
| Checkout con MercadoPago | P0 | Monetización core |
| Webhook handler + entrega de licencia | P0 | Sin esto no hay valor post-compra |
| Rate limiting básico (in-memory) | P1 | Protección mínima contra abuso |
| Validación de inputs | P1 | Seguridad básica |

### ❌ OUT (v2+)

| Feature | Cuándo | Razón |
|---------|--------|-------|
| Email verification flow | v2 | No bloquea primera venta |
| Password reset | v2 | Se puede hacer manual al inicio |
| Perfil público de productor | v2 | Nice-to-have para MVP |
| Dashboard de productor con stats | v2 | Datos crudos alcanzan al principio |
| Chat en tiempo real | v2+ | Requiere WebSockets, complejo |
| Playlists / colecciones | v2 | No valida MVP |
| Analytics avanzados | v2 | Sin datos que analizar todavía |
| App móvil nativa | v3 | PWA first |
| Procesamiento de audio avanzado | v3 | Requiere compute pesado |

---

## 12.3 Día 1: Setup & Auth

**Objetivo**: Express corriendo, Supabase conectado, auth funcional.

| Tarea | Detalle |
|-------|---------|
| Scaffold Express app | `express`, `cors`, `dotenv`, estructura de carpetas |
| Conexión a Supabase | `@supabase/supabase-js`, variables de entorno validadas con Zod |
| Auth module | `POST /auth/register`, `POST /auth/login` → JWT |
| Auth guard middleware | Verifica JWT en rutas protegidas |
| Error handler middleware | Respuestas consistentes de error |

**Entregable**: Podés registrarte, loguearte y acceder a rutas protegidas con JWT.

---

## 12.4 Día 2: Beats Module

**Objetivo**: CRUD completo de beats con PostgreSQL.

| Tarea | Detalle |
|-------|---------|
| Schema PostgreSQL | Tabla `beats`: id, title, slug, description, producer_id, bpm, key, genre, tags, created_at |
| `POST /beats` | Crear beat (solo productores autenticados) |
| `GET /beats` | Listar con paginación |
| `GET /beats/:id` | Detalle de un beat |
| `PUT /beats/:id` | Actualizar (solo owner) |
| `DELETE /beats/:id` | Soft delete (solo owner) |
| Búsqueda y filtros | Por genre, bpm, tags (query params) |

**Entregable**: Beats se crean, listan, filtran y buscan desde la API.

---

## 12.5 Día 3: Storage Module

**Objetivo**: Audio subido a R2, preview generado, streaming funcionando.

| Tarea | Detalle |
|-------|---------|
| `POST /audio/upload` | Recibe archivo WAV/MP3, valida tipo y tamaño |
| Subida a Cloudflare R2 | S3-compatible SDK, bucket configurado |
| ffmpeg preview | Genera preview de 30s MP3 192kbps |
| `GET /audio/stream/:beatId` | Streaming con HTTP Range headers |
| Cleanup | Borra archivos de R2 al soft-delete del beat |

**Entregable**: Subís un beat → se genera preview → se puede escuchar en el navegador.

---

## 12.6 Día 4: Frontend Integration (Auth + Catalog)

**Objetivo**: React frontend conectado al backend.

| Tarea | Detalle |
|-------|---------|
| Login page | Conecta a `POST /auth/login`, guarda token |
| Register page | Conecta a `POST /auth/register` |
| Auth context | Proveedor de autenticación en React |
| Catalog page | `GET /beats` con paginación y filtros |
| Beat detail page | `GET /beats/:id` + reproductor de preview |
| Protected routes | Redirige a login si no hay sesión |

**Entregable**: Usuario puede loguearse, ver catálogo, filtrar beats y escuchar previews.

---

## 12.7 Día 5: Payments Module

**Objetivo**: MercadoPago integrado, flujo de compra completo.

| Tarea | Detalle |
|-------|---------|
| MercadoPago SDK | Configurar sandbox, API keys |
| `POST /payments/checkout` | Crea preferencia de pago |
| `POST /payments/webhooks/mercadopago` | Recibe eventos de pago |
| Webhook verification | Valida firma de MercadoPago |
| `payment.approved` → licencia | Genera licencia, envía email con link de descarga |
| `payment.failed` → log | Registra error, no entrega licencia |
| Tabla `transactions` | Historial de pagos |
| Tabla `licenses` | Licencias generadas con link de descarga |

**Entregable**: Usuario puede comprar un beat → paga con MercadoPago → recibe licencia por email.

---

## 12.8 Día 6: Polish & Testing

**Objetivo**: MVP seguro, validado, testeado.

| Tarea | Detalle |
|-------|---------|
| Rate limiting | In-memory por IP (`express-rate-limit`) |
| Validación de inputs | Zod schemas en todos los endpoints |
| Error handling consistente | RFC 7807 en todas las respuestas de error |
| Sanitización | XSS prevention, SQL injection (Prisma parametrizado) |
| Tests happy path | Auth flow, CRUD beats, upload, checkout básico |
| CORS | Configurado solo para dominio del frontend |

**Entregable**: API validada, protegida, con tests básicos pasando.

---

## 12.9 Día 7: Deploy & Launch

**Objetivo**: MVP en producción, dominio configurado, live.

| Tarea | Detalle |
|-------|---------|
| Deploy a AWS EC2 | t2.micro (Free Tier), PM2 para process manager |
| PostgreSQL | Supabase cloud (ya configurado) |
| Storage | Cloudflare R2 (ya configurado) |
| Dominio | DNS apuntando a EC2, nginx reverse proxy |
| SSL | Let's Encrypt con certbot |
| Smoke tests | Auth, upload, stream, checkout en producción |
| MVP LIVE | `v1.0.0` tag, anuncio |

**Entregable**: mingarecords.com (o dominio elegido) funcionando con flujo completo E2E.

---

## 12.10 Critical Path Analysis

```
CAMINO CRÍTICO (7 días — sin margen)

Día 1: Setup + Auth ──────────────────────────► Bloquea TODO lo demás
  └─ Si falla: +1 día de retraso (no hay buffer)

Día 2: Beats CRUD ────────────────────────────► Bloquea Storage y Frontend
  └─ Dependencia: Auth del Día 1

Día 3: Storage (R2 + ffmpeg + streaming) ─────► Bloquea Frontend (reproductor)
  └─ Dependencia: Beats del Día 2

Día 4: Frontend (Auth + Catalog) ─────────────► Bloquea Payments (UI de compra)
  └─ Dependencia: Auth + Beats + Streaming

Día 5: Payments (MercadoPago) ────────────────► Bloquea Launch
  └─ Dependencia: Auth + Beats + Frontend
  └─ Riesgo externo: aprobación de cuenta MercadoPago

Día 6: Polish ────────────────────────────────► No bloquea pero es P1
  └─ Se puede recortar si hay retraso

Día 7: Deploy ────────────────────────────────► MVP LIVE
  └─ Dependencia: TODO lo anterior
```

### Dependencias Externas

| Dependencia | Impacto si falla | Plan B |
|-------------|-----------------|--------|
| **MercadoPago sandbox** | Bloquea Día 5 | Usar mock de webhook, integrar live post-MVP |
| **Supabase free tier** | Plataforma caída | Migrar a PostgreSQL local en EC2 (backup) |
| **Cloudflare R2** | Uploads y streaming caídos | Backblaze B2 (S3-compatible, egress gratis) |
| **AWS EC2 Free Tier** | No hay donde deployar | Render/Railway free tier como fallback temporal |

---

## 12.11 Milestones con Fechas

| Milestone | Fecha | Entregable verificable |
|-----------|-------|------------------------|
| **M0: Setup listo** | Día 1 (fin de día) | Express corriendo, Supabase conectado, auth funcional |
| **M1: Beats CRUD** | Día 2 (fin de día) | Crear, listar, filtrar beats desde API |
| **M2: Audio funcionando** | Día 3 (fin de día) | Upload a R2, preview generado, streaming HTTP Range |
| **M3: Frontend conectado** | Día 4 (fin de día) | Login, catálogo, reproductor de preview |
| **M4: Pagos integrados** | Día 5 (fin de día) | Checkout MercadoPago, webhook, licencia entregada |
| **M5: MVP pulido** | Día 6 (fin de día) | Rate limit, validación, tests pasando |
| **M6: MVP LIVE** | Día 7 (fin de día) | Deploy en EC2, dominio configurado, smoke tests OK |

---

## 12.12 Risk Assessment (7 días)

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| **No hay buffer** | 100% | Alto | Si algo se atrasa, recortar Día 6 (polish) antes que features core |
| **ffmpeg setup complejo** | Media | Medio | Usar `fluent-ffmpeg` con binario precompilado, no compilar desde source |
| **MercadoPago aprobación lenta** | Media | Alto | Trabajar con sandbox desde Día 1, migrar a live post-MVP |
| **EC2 setup tarda más** | Baja | Alto | Tener Render/Railway como plan B (deploy en 5 min) |
| **R2 bucket permissions** | Baja | Medio | Configurar bucket el Día 1, probar upload simple antes del Día 3 |
| **Frontend-backend CORS** | Alta | Bajo | Configurar CORS el Día 1, no esperar al Día 4 |
| **Un dev se enferma** | Baja | Crítico | El otro dev toma solo P0, posterga todo lo demás |

### Regla de oro del sprint

> Si una tarea lleva más de **4 horas**, se simplifica o se corta. No hay tiempo para perfeccionismo.

---

## 12.13 Principio de Priorización

Cada feature pasa este filtro:

```
¿Esta feature nos acerca a la PRIMERA VENTA?
  ├── SÍ → ¿Bloquea algo más? → SÍ → P0 (hacer HOY)
  │                           → NO → P1 (hacer esta semana)
  └── NO → P2/P3 (backlog v2+)
```

Si una tarea P0 lleva más de 4 horas sin terminar:
1. Simplificar al mínimo viable
2. Si no se puede simplificar, cortar y mover a v2
3. **No hay buffer para extender el sprint**

---

## 12.14 Future Improvements (Backlog v2+)

### v2.0 (Post-MVP, cuando haya revenue)

| # | Feature | Valor | Esfuerzo |
|---|---------|-------|----------|
| 1 | Email verification + password reset | Medio — seguridad básica | Bajo (2 días) |
| 2 | Perfil público de productor | Alto — cada productor necesita su URL | Medio (3 días) |
| 3 | Dashboard de productor (ventas, plays) | Alto — feedback #1 de productores | Medio (4 días) |
| 4 | Licencias personalizables por productor | Alto — diferenciación | Medio (3 días) |
| 5 | PayPal como alternativa de pago | Medio — algunos compradores solo PayPal | Medio (3 días) |

### v3.0 (Cuando haya > 1000 usuarios)

| # | Feature | Valor | Esfuerzo |
|---|---------|-------|----------|
| 1 | Chat comprador ↔ productor (WebSockets) | Alto — cierra ventas | Alto (2 semanas) |
| 2 | Playlists / colecciones | Medio — engagement | Medio (1 semana) |
| 3 | Analytics avanzados | Medio — optimizar revenue | Alto (2 semanas) |
| 4 | PWA con soporte offline | Alto — movilidad | Alto (2 semanas) |
| 5 | Programa de afiliados | Alto — crecimiento | Alto (3 semanas) |
