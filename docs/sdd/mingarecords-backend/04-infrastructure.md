# 04 — Infraestructura y Costos

> **Versión:** 1.0 — **Fecha:** 12 de mayo de 2026 — **Autores:** Sebastián Estrada, Yair Santiago Cetre

---

## 4.1 Principio Rector: Costo Operativo $0 en MVP

Hasta que MingaRecords genere revenue real por comisiones de beats vendidos, la infraestructura DEBE mantenerse en tiers gratuitos y freemium. Cada servicio fue seleccionado priorizando:

1. **Free tier permanente** (no "trial de 14/30 días" que expire durante desarrollo)
2. **Estándares abiertos** (PostgreSQL, Redis-compatible, S3-compatible) para evitar vendor lock-in
3. **SDK TypeScript nativo** (documentación clara, tipado fuerte, mantenido activamente)
4. **Migración indolora** a plan pago o a otro proveedor cuando se superen los límites

---

## 4.2 Mapa Completo de Infraestructura

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                          MAPA DE INFRAESTRUCTURA — MINGARECORDS                        │
│                                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                             CAPA DE FRONTEND                                      │ │
│  │                                                                                  │ │
│  │   ┌──────────────────────────────────┐                                           │ │
│  │   │  Vercel (Hobby)                   │  https://mingarecords.vercel.app         │ │
│  │   │  • 100 GB bandwidth/mes           │  React 19 + Vite SPA                      │ │
│  │   │  • 6,000 build minutes/mes        │  Auto-deploy desde GitHub                 │ │
│  │   │  • 1 concurrent build             │                                           │ │
│  │   │  • Serverless functions incluidas │                                           │ │
│  │   │  • Dominio personalizado + SSL    │                                           │ │
│  │   └──────────────────────────────────┘                                           │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│                                          │ HTTPS                                       │
│                                          ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                    CAPA DE ROUTING / API GATEWAY                                  │ │
│  │                                                                                  │ │
│  │   ┌──────────────────────────────────┐                                           │ │
│  │   │  Cloudflare Workers (Free)        │  api.mingarecords.com                     │ │
│  │   │  • 100,000 requests/día           │  Proxy inverso por path                   │ │
│  │   │  • 10 ms CPU time/request         │  CORS, HTTPS enforcement                  │ │
│  │   │  • 1 worker script                │  Rate limit global 100 req/min/IP         │ │
│  │   │  • Dominio gestionado por CF      │                                           │ │
│  │   └──────────────────────────────────┘                                           │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
│           │                    │                    │                    │             │
│    /auth/*│           /catalog/*│          /stream/*│         /payments/*│             │
│           ▼                    ▼                    ▼                    ▼             │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │                           CAPA DE SERVICIOS (Railway)                             │ │
│  │                                                                                  │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │ │
│  │  │ Auth Service  │  │Catalog Service│  │Streaming Svc │  │Payments Svc  │         │ │
│  │  │ Fastify :4001 │  │ Fastify :4002│  │ Fastify :4003│  │ Fastify :4004│         │ │
│  │  │               │  │               │  │               │  │               │         │ │
│  │  │ Railway       │  │ Railway       │  │ Railway       │  │ Railway       │         │ │
│  │  │ (24/7)        │  │ (24/7)       │  │ (24/7)        │  │ (serverless)  │         │ │
│  │  │ $5/mes        │  │ $5/mes       │  │ $5/mes        │  │ ~$2/mes *     │         │ │
│  │  │ 512MB / 1vCPU │  │ 512MB/1vCPU  │  │ 1GB / 1vCPU   │  │ 512MB/0.5vCPU │         │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │ │
│  └─────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┘ │
│            │                 │                 │                 │                    │
│  ┌─────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┐ │
│  │                        CAPA DE INFRAESTRUCTURA COMPARTIDA                         │ │
│  │                                                                                  │ │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │ │
│  │  │  PostgreSQL     │  │  Cloudflare R2  │  │  BunnyCDN      │  │  Upstash Redis │ │ │
│  │  │  (Supabase)     │  │  (Audio Storage)│  │  (Audio CDN)   │  │  (Cache + RL)  │ │ │
│  │  │                │  │                │  │                │  │                │ │ │
│  │  │ • 500 MB       │  │ • 10 GB store  │  │ • Trial 100GB  │  │ • 256 MB       │ │ │
│  │  │ • 60 conexiones│  │ • 10M ops A/mes│  │   bandwidth    │  │ • 128 conex.   │ │ │
│  │  │ • 2 GB trans   │  │ • 10M ops B/mes│  │ • 114+ PoPs    │  │ • 10k req/día  │ │ │
│  │  │ • Backups 7d   │  │ • Egress: $0   │  │ • $0.01/GB     │  │ • 1 región     │ │ │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  └────────────────┘ │ │
│  │                                                                                  │ │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                     │ │
│  │  │  Resend         │  │  Stripe        │  │  GitHub Actions │                     │ │
│  │  │  (Email)        │  │  (Pagos)       │  │  (CI/CD)        │                     │ │
│  │  │                │  │                │  │                │                     │ │
│  │  │ • 100 emails/d │  │ • $0 fijo      │  │ • 2,000 min/mes │                     │ │
│  │  │ • 3,000/mes    │  │ • 2.9%+$0.30   │  │ • Windows/Linux │                     │ │
│  │  │ • Dominio pers │  │ • Webhooks free │  │ • Caché 10GB    │                     │ │
│  │  └────────────────┘  └────────────────┘  └────────────────┘                     │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────────────┘

* Payments corre en Railway serverless (escala a cero, paga por uso). Con ~20 checkouts/día
  y webhooks periódicos, consumo estimado < $2/mes.
```

---

## 4.3 Justificación Detallada por Proveedor

### 4.3.1 Railway — Hosting de Microservicios

| Criterio | Railway | Render | Fly.io | Vercel |
|----------|---------|--------|--------|--------|
| Backend Docker | Nativo, excelente | Nativo, bueno | Nativo | No soporta |
| Free tier real | $5 crédito inicial | 750h/mes (1 servicio 24/7) | $5 crédito/mes | No para backend |
| PostgreSQL integrado | Sí, managed | Sí, free 1GB | No (Fly Postgres aparte) | No |
| Monorepo deploy | `railway.json` por servicio | `render.yaml` | `fly.toml` | — |
| Precio/servicio/mes | $5 (512MB) | $7 (512MB) | $5.70 (512MB) | $20 |
| Escala a cero | Sí | Sí (pero cold start lento) | Sí | Solo functions |
| Rollback instantáneo | Sí (1 click) | Sí | Sí | Sí |
| GitHub integration | Sí | Sí | Sí | Sí |
| Métricas incluidas | CPU, RAM, requests | CPU, RAM | CPU, RAM | Analytics |

**Veredicto: Railway.**

**Estrategia de ahorro:**
- Auth, Catalog, Streaming → 24/7 ($5/servicio/mes c/u). Streaming necesita 1GB RAM por ffmpeg.
- Payments → serverless con escala a cero. Tráfico bajo y predecible (webhooks + checkout).
- Railway cobra por resource usage real en serverless, no por hora de uptime.

### 4.3.2 Supabase — PostgreSQL (Base de Datos)

| Recurso | Free Tier | Límite MVP | ¿Suficiente? |
|---------|-----------|------------|---------------|
| Almacenamiento | 500 MB | ~200 MB estimado (MVP) | ✅ |
| Conexiones directas | 60 | ~32 (8 por servicio × 4) | ✅ con PgBouncer |
| Conexiones con PgBouncer | 200 (pool mode transaction) | ~40 | ✅ holgado |
| Transferencia de datos | 2 GB/mes | ~500 MB/mes | ✅ |
| Backups automáticos | 1/día, 7 días retención | Ok para MVP | ✅ |
| Row Level Security | Incluido | No usado (backend-only) | N/A |
| Proyectos | 2 | 1 (MingaRecords) | ✅ |
| Autenticación Supabase | Incluida | NO la usamos (JWT propio) | N/A |
| Realtime | 200 clientes simultáneos, 2M mensajes | No usado en MVP | ✅ |
| Edge Functions | 500K invocaciones, 10 funciones | No usado en MVP | ✅ |
| Logs retention | 1 día | Insuficiente → logs van a Railway/Sentry | ⚠️ |

**Pooling con PgBouncer (transaction mode):**

```
┌───────────────────────────────────────────────────────┐
│           SUPABASE CONNECTION POOLING                   │
│                                                        │
│  Cada servicio configura:                              │
│    DATABASE_URL=postgres://...?pgbouncer=true           │
│                                                        │
│  Prisma config:                                        │
│    connection_limit=8  (por servicio)                   │
│    pool_mode=transaction                               │
│                                                        │
│  4 servicios × 8 conexiones = 32 conexiones en pool    │
│  Free tier soporta 200 conexiones con PgBouncer.       │
│  Solo usamos 16% del límite. Holgura para picos.       │
└───────────────────────────────────────────────────────┘
```

**Plan B si Supabase no escala:** Migrar a Railway PostgreSQL ($10/mes, 1GB RAM, 10GB disco, backups diarios). Las migraciones de Prisma por schema hacen el cambio trivial.

### 4.3.3 Cloudflare R2 — Almacenamiento de Audio

| Recurso | Free Tier | Uso MVP Estimado |
|---------|-----------|-----------------|
| Almacenamiento | 10 GB por mes | ~5 GB (100 beats × 50MB WAV) |
| Operaciones Clase A (PUT, POST, DELETE) | 1,000,000/mes | ~600 (uploads + preview generation) |
| Operaciones Clase B (GET, HEAD) | 10,000,000/mes | ~500,000 (streaming previews) |
| Egress (ancho de banda salida) | **$0.00** — GRATUITO | ~60 GB/mes |
| Buckets | Ilimitados | 1 (`mingarecords-audio`) |
| Regiones | Auto (global) | N/A |

**Por qué R2 sobre S3:**
- S3 cobra $0.09/GB de egress. Con 60 GB/mes de streaming: $5.40/mes solo en salida.
- R2 tiene **egress gratuito**. Esto es CRÍTICO para audio: cada play de preview consume ~2 MB de salida.
- R2 es S3-compatible. Si migramos a S3 en el futuro, el código cambia solo 3 variables de entorno.

**Estructura de buckets R2:**

```
mingarecords-audio/
├── originals/
│   └── {beatId}/
│       └── original.wav          # Archivo WAV subido por el productor
├── previews/
│   └── {beatId}/
│       └── preview.mp3           # Fragmento 30s, 192kbps, marca de agua
├── licenses/
│   └── {transactionId}/
│       └── license.pdf           # Licencia generada post-compra
└── temp/
    └── uploads/                  # Buffer temporal durante procesamiento ffmpeg
```

**Ciclo de vida de objetos:**
- `originals/` y `previews/` persisten mientras el beat existe.
- `licenses/` persisten indefinidamente (acceso del comprador a su licencia).
- `temp/` objetos con TTL de 1 hora configurado en bucket lifecycle rules.
- Cuando un beat se soft-deletea, sus objetos se mueven a `deleted/` y se purgan a los 30 días.

### 4.3.4 BunnyCDN — CDN de Audio

| Recurso | Free Trial | Post-Trial (Pay-as-you-go) |
|---------|-----------|---------------------------|
| Ancho de banda | 100 GB (14 días de prueba) | $0.01/GB (Standard) / $0.005/GB (Volume) |
| Almacenamiento | No incluido (R2 es el origin) | N/A (usamos R2 como origin) |
| Puntos de presencia (PoPs) | 114+ global | 114+ global |
| HTTP/2, HTTP/3 | ✅ | ✅ |
| Brotli compression | ✅ | ✅ |
| Edge Rules | Ilimitadas | Ilimitadas |
| Perma-Cache | ✅ | ✅ |
| Geo-replicación | No | $0.005/GB adicional (no necesario) |
| SSL personalizado | ✅ | ✅ |

**Por qué BunnyCDN sobre CloudFront:**
- BunnyCDN: $0.01/GB, CloudFront: $0.085/GB (primeros 10TB). Bunny es 8.5× más barato.
- BunnyCDN: 114+ PoPs. CloudFront: 400+ PoPs. Diferencia irrelevante para audio.
- BunnyCDN: panel simple. CloudFront: docenas de knobs, overkill para 2 devs.
- BunnyCDN: origin pull desde R2 funciona nativamente. CloudFront requiere configuración adicional.

**Configuración de Pull Zone:**

```
Pull Zone: mingarecords-audio
Origin URL: https://{account-id}.r2.cloudflarestorage.com/mingarecords-audio
Custom Domain: cdn.mingarecords.com

Edge Rules:
  1. Cache /previews/* → 365 días (los previews NO cambian nunca)
  2. Cache /originals/* → 365 días (se crea un nuevo objeto si se reemplaza)
  3. Cache /licenses/* → 24 horas (las licencias pueden regenerarse)
  4. Block direct access to /originals/* except via signed URL
  5. CORS headers: Access-Control-Allow-Origin: https://mingarecords.vercel.app

Security:
  - BunnyCDN Token Authentication para /originals/*
  - Solo el Payments Service genera tokens válidos post-compra
  - Token expira en 24 horas (tiempo razonable para descarga)
```

**Cálculo de ancho de banda:**

```
Estimación MVP (1000 plays/día):
  - Preview MP3 30s a 192kbps = ~720 KB por play
  - 1,000 plays/día × 720 KB = 720 MB/día
  - 720 MB/día × 30 días = 21.6 GB/mes
  - Costo: 21.6 × $0.01 = $0.22/mes

Estimación Post-MVP (50,000 plays/día):
  - 50,000 × 720 KB = 36 GB/día
  - 36 GB × 30 = 1,080 GB/mes
  - Costo: 1,080 × $0.005 (Volume pricing) = $5.40/mes
```

### 4.3.5 Upstash — Redis (Caché + Rate Limiting)

| Recurso | Free Tier | Uso MVP |
|---------|-----------|---------|
| Almacenamiento | 256 MB | ~10 MB |
| Conexiones simultáneas | 128 | ~8 (2 por servicio × 4) |
| Requests/día | 10,000 | ~3,000 |
| Ancho de banda | 1 GB/mes | ~100 MB/mes |
| Regiones | 1 (Global: us-east-1) | us-east-1 |
| SSL/TLS | ✅ | ✅ |
| Persistencia | Snapshot cada 12h | Ok |
| Eviction policy | volatile-lru | Configurado |

**Qué cacheamos (con TTL exactos):**

| Clave | Estructura | TTL | Razón |
|-------|-----------|-----|-------|
| `catalog:beats:page:{n}:{filters_hash}` | JSON paginado | 60s | Hot path: listado de beats |
| `catalog:beat:{beatId}` | JSON individual | 300s | Detalle de beat, cacheado por 5 min |
| `catalog:producer:{userId}` | Perfil + beats | 300s | Perfil público cambia poco |
| `catalog:genres` | Array de strings | 3600s | Datos estáticos |
| `catalog:bpm-range` | `{min, max}` | 3600s | Metadato estático |
| `rate:ip:{ip}:{endpoint}` | Contador sliding window | 60s | Rate limiting |
| `rate:user:{userId}:{endpoint}` | Contador sliding window | 60s | Rate limiting autenticado |
| `stream:upload:{uploadId}` | Estado de upload | 600s | Tracking de procesamiento async |

**Qué NUNCA cacheamos:**
- Datos financieros (transacciones, revenue, ganancias)
- Tokens JWT (son auto-contenidos, no requieren servidor de sesiones)
- Estado de pagos (siempre consulta directa a Stripe o DB)
- Datos de usuario autenticado (privacy, siempre fresh de DB)

### 4.3.6 Resend — Email Transaccional

| Recurso | Free Tier | Uso MVP Estimado |
|---------|-----------|-----------------|
| Emails/día | 100 | ~15 (registros, verificaciones, compras) |
| Emails/mes | 3,000 | ~450 |
| Dominio personalizado | ✅ | mingarecords.com |
| Templates React | ✅ (react-email) | — |
| Webhooks de eventos | ✅ | No usados en MVP |
| A/B testing | No | No necesario |
| Acceso API | REST + SDK TS | ✅ |

**Emails que enviamos:**

| Trigger | Template | Frecuencia estimada |
|---------|----------|---------------------|
| Registro de usuario | `verify-email` (magic link) | ~5/día |
| Verificación completada | `welcome` | ~5/día |
| Recuperación de contraseña | `reset-password` | ~2/día |
| Compra completada | `license-delivery` (con link de descarga) | ~3/día |
| Pago fallido | `payment-failed` | ~0.5/día |
| Reembolso procesado | `refund-confirmation` | ~0.2/día |

### 4.3.7 Stripe — Procesamiento de Pagos

| Concepto | Costo |
|----------|-------|
| Tarifa por transacción | 2.9% + $0.30 (tarifa estándar EE.UU.) |
| Tarifa internacional | +1.5% (si la tarjeta es de fuera de EE.UU.) |
| Costo fijo mensual | $0 |
| Webhooks | Ilimitados, gratuitos |
| Stripe Tax | No usado en MVP |
| Payouts a productores | Stripe Connect (no en MVP, se hace manual) |

**Comisión MingaRecords:**
- Plataforma cobra 15% del precio del beat.
- Ejemplo: beat de $29.99 → Stripe: $1.17 → Minga: $4.50 → Productor: $24.32
- En MVP, los payouts a productores son MANUALES (transferencia bancaria mensual).
- En v2, Stripe Connect automatiza los payouts.

### 4.3.8 Vercel — Frontend

| Recurso | Hobby (Free) | Uso MVP |
|---------|-------------|---------|
| Ancho de banda | 100 GB/mes | ~5 GB/mes |
| Build minutes | 6,000/mes | ~500/mes |
| Builds concurrentes | 1 | 1 (suficiente) |
| Serverless Functions | 100 GB-hrs, 10s timeout | Solo para SSR si se necesita |
| Dominios | 50 por proyecto | 1 (mingarecords.vercel.app) |
| SSL | Automático | ✅ |
| DDoS protection | Incluido (Cloudflare detrás) | ✅ |
| Preview deployments | Por PR | ✅ |

**Nota:** Vercel ya está en uso para el frontend existente. No cambia.

### 4.3.9 Cloudflare Workers — API Gateway

| Recurso | Free Tier | Uso MVP |
|---------|-----------|---------|
| Requests/día | 100,000 | ~10,000 |
| CPU time/request | 10 ms | < 2 ms (solo routing) |
| Scripts | 1 | 1 (proxy inverso) |
| KV Storage | 1 GB | No usado |

**Por qué no Nginx/Railway edge proxy:**
- Cloudflare Workers es $0 y ya está en nuestra infraestructura (R2, dominio).
- No requiere servidor adicional en Railway.
- DDoS protection de Cloudflare incluida.
- Workers puede hacer rate limiting básico antes de llegar a Railway.

---

## 4.4 Estrategia de Audio Completa

### 4.4.1 Flujo de Subida y Procesamiento

```
PRODUCTOR                STREAMING SERVICE                 R2                  BUNNYCDN
   │                          │                             │                      │
   │  POST /audio/upload      │                             │                      │
   │  multipart/form-data     │                             │                      │
   │  (archivo WAV 50MB)      │                             │                      │
   │─────────────────────────►│                             │                      │
   │                          │                             │                      │
   │                          │  ┌──────────────────────┐   │                      │
   │                          │  │ VALIDACIÓN DE ARCHIVO │   │                      │
   │                          │  │                       │   │                      │
   │                          │  │ 1. Leer magic bytes   │   │                      │
   │                          │  │    • WAV: 52 49 46 46 │   │                      │
   │                          │  │    • MP3: FF FB       │   │                      │
   │                          │  │    • AIFF: 46 4F 52 4D│   │                      │
   │                          │  │                       │   │                      │
   │                          │  │ 2. Validar tamaño     │   │                      │
   │                          │  │    • Máx: 100 MB      │   │                      │
   │                          │  │    • Mín: 1 MB        │   │                      │
   │                          │  │                       │   │                      │
   │                          │  │ 3. ffprobe validación  │   │                      │
   │                          │  │    • Duración: 30s-600s│   │                      │
   │                          │  │    • Canales: 1 o 2   │   │                      │
   │                          │  │    • Sample rate:      │   │                      │
   │                          │  │      44100 o 48000 Hz  │   │                      │
   │                          │  └──────────────────────┘   │                      │
   │                          │                             │                      │
   │                          │  ┌──────────────────────┐   │                      │
   │                          │  │ PROCESAMIENTO ffmpeg  │   │                      │
   │                          │  │                       │   │                      │
   │                          │  │ Preview 30s:          │   │                      │
   │                          │  │ ffmpeg -i input.wav   │   │                      │
   │                          │  │   -t 30               │   │                      │
   │                          │  │   -af "afade=t=out:   │   │                      │
   │                          │  │     st=28:d=2,        │   │                      │
   │                          │  │     volume=-8dB"      │   │                      │
   │                          │  │   -b:a 192k           │   │                      │
   │                          │  │   preview.mp3          │   │                      │
   │                          │  │                       │   │                      │
   │                          │  │ Marca de agua:        │   │                      │
   │                          │  │ - Reducción volumen   │   │                      │
   │                          │  │   (-8dB vs original)  │   │                      │
   │                          │  │ - Fade out últimos 2s │   │                      │
   │                          │  │ - "MingaRecords" tag  │   │                      │
   │                          │  │   en metadata ID3     │   │                      │
   │                          │  └──────────────────────┘   │                      │
   │                          │                             │                      │
   │                          │  PUT originals/{id}/        │                      │
   │                          │─────────────────────────────►                      │
   │                          │  PUT previews/{id}/         │                      │
   │                          │─────────────────────────────►                      │
   │                          │                             │                      │
   │                          │  PATCH /beats/:id/audio-ready                      │
   │                          │  {previewUrl, streamUrl}    │                      │
   │                          │─────────────────► CATALOG   │                      │
   │                          │                             │                      │
   │  202 + {uploadId}        │                             │                      │
   │◄─────────────────────────│                             │                      │
   │                          │                             │                      │
   │  [comprador solicita stream]                            │                      │
   │                          │                             │  GET /previews/{id}  │
   │                          │                             │◄─────────────────────│
   │                          │                             │  mp3 206 Partial    │
   │                          │                             │─────────────────────►│
```

### 4.4.2 Formatos Soportados

| Formato | MIME Type | Magic Bytes | Propósito | Tamaño máx |
|---------|-----------|-------------|-----------|------------|
| WAV | `audio/wav`, `audio/wave`, `audio/x-wav` | `52 49 46 46` (RIFF) | Subida original, entrega de licencia | 100 MB |
| MP3 | `audio/mpeg`, `audio/mp3` | `FF FB`, `FF F3`, `FF F2`, `ID3` | Preview streaming, reproducción | 50 MB |
| AIFF | `audio/aiff`, `audio/x-aiff` | `46 4F 52 4D` (FORM) | Subida original (alternativa) | 100 MB |
| FLAC | `audio/flac`, `audio/x-flac` | `66 4C 61 43` (fLaC) | Subida original sin pérdida | 100 MB |

**Rechazados:** M4A/AAC (problemas de compatibilidad), OGG (baja adopción en DAWs), WMA (formato propietario).

---

## 4.5 Estrategia de Base de Datos Completa

### 4.5.1 Esquemas PostgreSQL

```sql
-- ============================================
-- SCHEMA: auth
-- Propietario: Auth Service
-- ============================================
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE auth.users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('producer', 'artist')),
    alias           VARCHAR(100),
    avatar_url      VARCHAR(500),
    bio             TEXT,
    email_verified  BOOLEAN DEFAULT FALSE,
    email_verify_token VARCHAR(255),
    reset_token     VARCHAR(255),
    reset_expires   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE auth.refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON auth.refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON auth.refresh_tokens(token_hash);

-- ============================================
-- SCHEMA: catalog
-- Propietario: Catalog Service
-- ============================================
CREATE SCHEMA IF NOT EXISTS catalog;

CREATE TABLE catalog.beats (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producer_id     UUID NOT NULL,  -- FK lógico a auth.users
    title           VARCHAR(255) NOT NULL,
    slug            VARCHAR(300) NOT NULL UNIQUE,
    genre           VARCHAR(50) NOT NULL,
    bpm             INTEGER CHECK (bpm > 0 AND bpm <= 300),
    key             VARCHAR(10),
    price_cents     INTEGER NOT NULL CHECK (price_cents >= 100),  -- Mín $1.00 USD
    description     TEXT,
    tags            TEXT[] DEFAULT '{}',
    preview_url     VARCHAR(500),
    stream_url      VARCHAR(500),
    download_url    VARCHAR(500),
    plays_count     INTEGER DEFAULT 0,
    sales_count     INTEGER DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'draft'
                    CHECK (status IN ('draft', 'processing', 'published', 'archived')),
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ  -- Soft delete
);

CREATE INDEX idx_beats_producer ON catalog.beats(producer_id);
CREATE INDEX idx_beats_genre ON catalog.beats(genre);
CREATE INDEX idx_beats_price ON catalog.beats(price_cents);
CREATE INDEX idx_beats_status ON catalog.beats(status) WHERE status = 'published';
-- Full-text search index para búsqueda por título y tags
CREATE INDEX idx_beats_fts ON catalog.beats
    USING GIN (to_tsvector('spanish', coalesce(title, '') || ' ' || coalesce(description, '')));

CREATE TABLE catalog.genres (
    id      SERIAL PRIMARY KEY,
    name    VARCHAR(50) NOT NULL UNIQUE,
    slug    VARCHAR(50) NOT NULL UNIQUE
);

-- ============================================
-- SCHEMA: streaming
-- Propietario: Streaming Service
-- ============================================
CREATE SCHEMA IF NOT EXISTS streaming;

CREATE TABLE streaming.audio_files (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beat_id         UUID NOT NULL,  -- FK lógico a catalog.beats
    original_key    VARCHAR(500) NOT NULL,    -- R2 key del WAV original
    preview_key     VARCHAR(500),             -- R2 key del preview MP3
    size_bytes      BIGINT NOT NULL,
    duration_ms     INTEGER NOT NULL,
    format          VARCHAR(10) NOT NULL,
    sample_rate     INTEGER,
    bitrate_kbps    INTEGER,
    channels        INTEGER,
    status          VARCHAR(20) DEFAULT 'uploading'
                    CHECK (status IN ('uploading', 'processing', 'ready', 'failed')),
    error_message   TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audio_files_beat ON streaming.audio_files(beat_id);

-- ============================================
-- SCHEMA: payments
-- Propietario: Payments Service (AISLADO)
-- ============================================
CREATE SCHEMA IF NOT EXISTS payments;

CREATE TABLE payments.transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beat_id             UUID NOT NULL,      -- FK lógico a catalog.beats
    buyer_id            UUID NOT NULL,      -- FK lógico a auth.users
    producer_id         UUID NOT NULL,      -- FK lógico a auth.users
    stripe_session_id   VARCHAR(255) NOT NULL UNIQUE,
    stripe_payment_intent VARCHAR(255),
    amount_cents        INTEGER NOT NULL,
    platform_fee_cents  INTEGER NOT NULL,
    producer_earnings_cents INTEGER NOT NULL,
    currency            VARCHAR(3) DEFAULT 'usd',
    status              VARCHAR(20) DEFAULT 'pending'
                        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
    license_url         VARCHAR(500),
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_buyer ON payments.transactions(buyer_id);
CREATE INDEX idx_transactions_producer ON payments.transactions(producer_id);
CREATE INDEX idx_transactions_status ON payments.transactions(status);
CREATE INDEX idx_transactions_stripe ON payments.transactions(stripe_payment_intent);

CREATE TABLE payments.licenses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id  UUID NOT NULL REFERENCES payments.transactions(id),
    beat_id         UUID NOT NULL,
    buyer_id        UUID NOT NULL,
    license_type    VARCHAR(50) NOT NULL DEFAULT 'non_exclusive',
    terms           TEXT NOT NULL,
    file_url        VARCHAR(500),
    generated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.5.2 Migraciones con Prisma

Cada servicio tiene su propio `prisma/schema.prisma` apuntando a su schema:

```
// apps/auth/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["auth"]
}
```

Migraciones: `prisma migrate dev --schema apps/auth/prisma/schema.prisma`

Esto garantiza que Prisma solo ve y modifica el schema `auth`. Si en v2 migramos `auth` a su propia DB, solo cambiamos `DATABASE_URL`.

---

## 4.6 Estrategia de Caché (Upstash Redis)

### 4.6.1 Patrones de Caché

**Cache-Aside (Lazy Loading):** El patrón principal.

```
CLIENTE → CATALOG SERVICE
            │
            ├── 1. GET redis:catalog:beats:page:1:genre=trap
            │      ├── HIT → devolver JSON cacheado (2ms)
            │      └── MISS → consultar PostgreSQL (20ms)
            │                  │
            │                  └── 3. SET redis:catalog:beats:page:1:... EX 60
            │                      → devolver datos frescos
```

**Write-Through NO se usa** (demasiado acoplamiento para MVP).

**Invalida en escritura:**

```
POST /beats → Catalog Service
  1. INSERT INTO catalog.beats
  2. DEL redis:catalog:beats:page:*     (invalida todas las páginas cacheadas)
  3. DEL redis:catalog:producer:{id}    (invalida perfil del productor)
  4. 201 Created
```

### 4.6.2 Rate Limiting con Sliding Window

```
┌───────────────────────────────────────────────────────┐
│           RATE LIMITING — SLIDING WINDOW                │
│                                                        │
│  Algoritmo: Sliding Window Log (Upstash Redis)         │
│                                                        │
│  Para cada request:                                    │
│  1. Key: rate:{ip|userId}:{endpoint_path}              │
│  2. NOW = Date.now()                                   │
│  3. WINDOW = 60000 (1 minuto)                          │
│  4. ZREMRANGEBYSCORE key 0 (NOW - WINDOW)              │
│     → Elimina timestamps viejos                        │
│  5. ZADD key NOW NOW                                   │
│     → Agrega timestamp actual                          │
│  6. ZCARD key → cuenta requests en la ventana          │
│  7. Si count > LIMIT → 429 Too Many Requests           │
│                                                        │
│  Respuesta 429 incluye headers:                        │
│    Retry-After: {seconds}                              │
│    X-RateLimit-Limit: {limit}                          │
│    X-RateLimit-Remaining: {remaining}                  │
│    X-RateLimit-Reset: {unix_timestamp}                 │
└───────────────────────────────────────────────────────┘
```

---

## 4.7 Gestión de Secretos y Variables de Entorno

### 4.7.1 Estrategia por Entorno

```
┌─────────────────────────────────────────────────────────┐
│             GESTIÓN DE ENVIRONMENT VARIABLES              │
│                                                          │
│  ENTORNO         MÉTODO              ROTACIÓN            │
│  ─────────       ──────              ────────            │
│                                                          │
│  Desarrollo       .env local          N/A                │
│  (localhost)      (gitignored)                           │
│                                                          │
│  CI/CD            GitHub Secrets      Al crear/rotar     │
│                   (por repositorio)   secretos            │
│                                                          │
│  Staging          Railway Variables   Manual, cada       │
│                   (por servicio)      cambio de API key   │
│                                                          │
│  Producción       Railway Variables   Manual, con         │
│                   (por servicio)      procedimiento       │
│                                                          │
│  NO USAR:                                                │
│  - .env commiteados (riesgo de leaks)                    │
│  - Secrets hardcodeados en código                        │
│  - Vault/Secrets Manager (overkill MVP, costo adicional) │
│  - .env en Docker images                                 │
└─────────────────────────────────────────────────────────┘
```

### 4.7.2 Template `.env.example`

```bash
# ==========================================
# Base de Datos
# ==========================================
DATABASE_URL="postgresql://postgres.{ref}:{password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# ==========================================
# Auth Service (apps/auth)
# ==========================================
AUTH_PORT=4001
JWT_ACCESS_SECRET="openssl rand -hex 64"
JWT_REFRESH_SECRET="openssl rand -hex 64"
JWT_ACCESS_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# ==========================================
# Catalog Service (apps/catalog)
# ==========================================
CATALOG_PORT=4002
STREAMING_SERVICE_URL="http://localhost:4003"
AUTH_SERVICE_URL="http://localhost:4001"

# ==========================================
# Streaming Service (apps/streaming)
# ==========================================
STREAMING_PORT=4003
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET="mingarecords-audio"
R2_ENDPOINT="https://{account-id}.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://cdn.mingarecords.com"
BUNNYCDN_API_KEY=""
BUNNYCDN_PULL_ZONE_ID=""
CATALOG_SERVICE_URL="http://localhost:4002"
AUDIO_MAX_SIZE_MB="100"

# ==========================================
# Payments Service (apps/payments)
# ==========================================
PAYMENTS_PORT=4004
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PLATFORM_FEE_PERCENT="15"
CATALOG_SERVICE_URL="http://localhost:4002"
AUTH_SERVICE_URL="http://localhost:4001"

# ==========================================
# Email (Resend)
# ==========================================
RESEND_API_KEY="re_..."
EMAIL_FROM="MingaRecords <hola@mingarecords.com>"

# ==========================================
# Cache (Upstash Redis)
# ==========================================
UPSTASH_REDIS_URL="redis://default:{password}@{host}:{port}"
UPSTASH_REDIS_TOKEN=""

# ==========================================
# Observabilidad
# ==========================================
SENTRY_DSN=""
LOG_LEVEL="debug"  # debug | info | warn | error
CORRELATION_ID_HEADER="x-correlation-id"
```

### 4.7.3 Validación de Environment con Zod

```typescript
// Cada servicio tiene apps/{servicio}/src/infrastructure/config/env.ts
import { z } from 'zod';

// Ejemplo: Auth Service
const authEnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4001),
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  JWT_ACCESS_SECRET: z.string().min(64, 'JWT secret must be at least 64 chars'),
  JWT_REFRESH_SECRET: z.string().min(64, 'JWT secret must be at least 64 chars'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  RESEND_API_KEY: z.string().startsWith('re_'),
  UPSTASH_REDIS_URL: z.string().url(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  SENTRY_DSN: z.string().url().optional(),
});

export const env = authEnvSchema.parse(process.env);
// Si falta una variable requerida o tiene formato incorrecto,
// el servicio CRASHEA al iniciar con un mensaje claro.
// Esto es preferible a errores misteriosos en runtime.
```

---

## 4.8 Plan de Dominio y DNS

```
┌─────────────────────────────────────────────────────────┐
│                   PLAN DE DOMINIOS                        │
│                                                          │
│  DOMINIO PRINCIPAL (comprado en Namecheap, ~$10/año):    │
│  mingarecords.com                                        │
│                                                          │
│  SUBDOMINIOS:                                            │
│  ├── mingarecords.com          → Landing page (Vercel)  │
│  ├── app.mingarecords.com      → Web App (Vercel)       │
│  ├── api.mingarecords.com      → API Gateway (CF Worker)│
│  ├── cdn.mingarecords.com      → BunnyCDN Pull Zone     │
│  └── email.mingarecords.com    → Resend (MX records)    │
│                                                          │
│  DNS: Cloudflare (gratuito, management)                  │
│  SSL: Cloudflare Universal SSL (gratuito)                │
│        + BunnyCDN Let's Encrypt para cdn.*              │
└─────────────────────────────────────────────────────────┘
```

---

## 4.9 Proyección de Costos

### 4.9.1 Costo Mensual Detallado por Fase

| Proveedor | Servicio | MVP (0-6m) | Growth (6-12m) | Scale (12-24m) |
|-----------|----------|------------|-----------------|----------------|
| **Railway** | Auth (24/7, 512MB) | $5.00 | $5.00 | $10.00 (1GB) |
| **Railway** | Catalog (24/7, 512MB) | $5.00 | $5.00 | $10.00 (1GB) |
| **Railway** | Streaming (24/7, 1GB) | $5.00 | $10.00 (2GB) | $20.00 (4GB) |
| **Railway** | Payments (serverless) | ~$2.00 | $5.00 (24/7) | $10.00 (1GB) |
| **Supabase** | PostgreSQL (Free) | $0 | $25.00 (Pro) | $25.00 (Pro) |
| **Upstash** | Redis (Free) | $0 | $10.00 (Pro) | $10.00 (Pro) |
| **Cloudflare R2** | Audio storage | $0 | $1.50 (100GB) | $3.75 (250GB) |
| **BunnyCDN** | Audio CDN | ~$0.22 | $5.40 | $25.00 |
| **Resend** | Emails | $0 | $0 | $20.00 (50k/mes) |
| **Stripe** | Pagos | $0 + comisiones | $0 + comisiones | $0 + comisiones |
| **Vercel** | Frontend | $0 | $0 | $20.00 (Pro) |
| **Cloudflare** | DNS + Workers | $0 | $0 | $0 |
| **Namecheap** | Dominio | $0.83 | $0.83 | $0.83 |
| **Sentry** | Error tracking | $0 | $0 | $26.00 (Team) |
| **TOTAL** | | **~$18.05** | **~$62.73** | **~$180.58** |

### 4.9.2 Supuestos por Fase

| Métrica | MVP (0-6m) | Growth (6-12m) | Scale (12-24m) |
|---------|------------|-----------------|----------------|
| Usuarios registrados | < 500 | 500–5,000 | 5,000–20,000 |
| Beats subidos | < 100 | 100–2,000 | 2,000–10,000 |
| Plays/día | < 500 | 500–5,000 | 5,000–50,000 |
| Ventas/mes | < 30 | 30–500 | 500–3,000 |
| Beat precio promedio | $25 | $25 | $25 |
| Revenue plataforma/mes | < $112 | $112–$1,875 | $1,875–$11,250 |
| Emails transaccionales/mes | < 450 | 450–3,000 | 3,000–15,000 |
| Storage audio (GB) | < 5 | 5–100 | 100–500 |
| Tráfico CDN (GB/mes) | < 30 | 30–500 | 500–2,500 |

### 4.9.3 ¿Cuándo es Rentable?

```
Punto de equilibrio: cuando revenue > costos.

MVP:    Revenue $112/mes  — Costos $18/mes  ✅ Rentable desde mes 1
Growth: Revenue $1,875/mes — Costos $63/mes ✅ Ampliamente rentable
Scale:  Revenue $11,250/mes — Costos $181/mes ✅ Altamente rentable

El costo de infraestructura es < 2% del revenue.
La plataforma es viable incluso con volúmenes bajos de ventas.
```

---

## 4.10 Límites de Free Tier y Planes de Migración

| Recurso | Límite Free Actual | Trigger de Migración | Plan B |
|---------|-------------------|---------------------|--------|
| Supabase DB | 500 MB | > 350 MB usado (70%) | Railway PostgreSQL ($10/mes) |
| Supabase conexiones | 60 directas | > 40 activas | PgBouncer adicional ($0) |
| R2 Storage | 10 GB | > 7 GB usado (70%) | Upgrade R2 ($0.015/GB) |
| R2 Class A ops | 1M/mes | > 700K | Upgrade R2 ($4.50/millón) |
| R2 Class B ops | 10M/mes | > 7M | Upgrade R2 ($0.36/millón) |
| BunnyCDN bandwidth | 14-day trial | Día 15 | Pay-as-you-go (~$0.22/mes MVP) |
| Upstash Redis | 256 MB | > 180 MB (70%) | Upstash Pro ($10/mes) |
| Upstash requests | 10K/día | > 7K/día | Upstash Pro ($10/mes) |
| Resend emails | 100/día | > 70/día (70%) | Resend Pro ($20/mes) |
| Railway crédito $5 | Se agota en ~1 mes | Primer deploy production | Pagar $5-20/servicio |
| Vercel bandwidth | 100 GB/mes | > 70 GB/mes | Vercel Pro ($20/mes) |
| Vercel build minutes | 6,000/mes | > 4,000/mes | Vercel Pro ($20/mes) |
| Cloudflare Workers | 100K req/día | > 70K req/día | Workers Paid ($5/mes) |
| Sentry events | 5K/mes | > 3,500/mes | Sentry Team ($26/mes) |
| GitHub Actions | 2,000 min/mes | > 1,500 min/mes | Poco probable en MVP |

---

## 4.11 Setup Inicial (Día 0)

Checklist de lo que cada developer configura una sola vez:

```bash
# 1. Cuentas de servicio (una vez por equipo)
☐ Crear cuenta Railway (plan Starter)
☐ Crear proyecto Supabase (free tier)
☐ Crear bucket R2 en Cloudflare
☐ Crear Pull Zone en BunnyCDN
☐ Crear cuenta Upstash Redis (free tier)
☐ Crear cuenta Resend (free tier)
☐ Crear cuenta Stripe (modo test)
☐ Crear cuenta Sentry (developer tier)
☐ Comprar dominio mingarecords.com (Namecheap)
☐ Configurar DNS en Cloudflare

# 2. Secrets (por servicio en Railway)
☐ Agregar DATABASE_URL (Supabase, con pgbouncer=true)
☐ Agregar JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
☐ Agregar R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
☐ Agregar STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
☐ Agregar RESEND_API_KEY
☐ Agregar UPSTASH_REDIS_URL
☐ Agregar SENTRY_DSN

# 3. CI/CD (GitHub)
☐ Agregar secrets a GitHub Actions
☐ Configurar deploy hooks en Railway
☐ Configurar preview deployments en Vercel
☐ Configurar Dependabot para actualizaciones de seguridad

# 4. Monitoreo
☐ Activar health checks en Railway
☐ Configurar Sentry alert rules
☐ Agregar dashboard de Supabase
```

---

## 4.12 Resumen de Decisiones de Infraestructura

| Decisión | ¿Por qué? | Alternativa descartada |
|----------|-----------|----------------------|
| Railway sobre Render | Docker nativo, escala a cero, $5/servicio | Render: 750h free solo para 1 servicio |
| R2 sobre S3 | Egress gratuito (crítico para audio) | S3: $0.09/GB egress |
| BunnyCDN sobre CloudFront | $0.01/GB vs $0.085/GB, panel simple | CloudFront: overkill + caro |
| Supabase sobre Railway PG | Free tier real, PgBouncer incluido | Railway PG: $10/mes sin free tier |
| Upstash sobre Redis Cloud | Free tier 256MB, SDK TS nativo | Redis Cloud: 30MB free |
| Resend sobre SendGrid | Templates React, mejor DX, free tier amplio | SendGrid: 100 emails/día free, pero peor DX |
| Una DB compartida | 2 devs, simplicidad, schemas aislados | 4 DBs independientes: overhead operativo |
| Railway serverless para Payments | Bajo tráfico, webhooks periódicos | 24/7: $5/mes sin necesidad |
| Cloudflare Workers gateway | $0, DDoS incluido, ya usamos CF | Nginx en Railway: $5/mes extra |
