# 04 — Infraestructura

> **Versión:** 2.0 — **Fecha:** 19 de mayo de 2026 — **Autores:** Sebastián Estrada, Yair Santiago Cetre

---

## 4.1 Principio Rector: MVP en 1 Semana, Costo $0

La infraestructura del MVP debe ser lo más simple posible. Un solo proceso Express, un solo deploy, un solo `.env`. Nada de microservicios, nada de orquestación, nada de configuración compleja.

Criterios de selección:

1. **Free tier permanente** — no trials que expiren
2. **Setup en minutos** — no días de configuración
3. **Estándares abiertos** — PostgreSQL, S3-compatible para migrar sin dolor
4. **1 proceso, 1 deploy** — monolito modular con módulos hexagonales internos

---

## 4.2 Mapa de Infraestructura

```
Frontend (Vercel) → HTTPS → Backend (AWS EC2 t2.micro, Express :3000)
                                      │
                    ┌───────────────────┼───────────────────┬──────────────┐
                    ▼                   ▼                   ▼              ▼
              Supabase DB         Cloudflare R2        MercadoPago    Resend
              (PostgreSQL)        (Audio Storage)      (Payments)     (Email)
              Free: 500MB         Free: 10GB           ~5% comisión   100 emails/día
```

**Flujo simple:**

- El frontend en Vercel habla con el backend en EC2 vía HTTPS
- El backend lee/escribe en Supabase (PostgreSQL)
- Los archivos de audio se guardan en Cloudflare R2
- Los pagos se procesan con MercadoPago (sandbox en desarrollo)
- Todo corre en un solo proceso Express con módulos internos separados

---

## 4.3 Proveedores

### 4.3.1 AWS EC2 — Hosting del Backend

| Recurso | Free Tier | Detalle |
|---------|-----------|---------|
| Instancia | t2.micro, 750h/mes | 1 vCPU, 1 GB RAM |
| Duración | 12 meses | Desde creación de cuenta |
| Storage | 30 GB EBS | Suficiente para app + logs |
| Transferencia | 15 GB/mes | Holgado para MVP |
| Costo | **$0** | Dentro del free tier |

**Por qué EC2:**

- Control total del servidor, sin vendor lock-in de plataforma
- Deploy simple: SSH + PM2, sin Docker ni orquestación
- 750 horas = 1 instancia 24/7 todo el mes gratis
- Predictable: sabés exactamente qué estás corriendo

### 4.3.2 Supabase — PostgreSQL

| Recurso | Free Tier | Detalle |
|---------|-----------|---------|
| Almacenamiento | 500 MB | ~200 MB estimado MVP |
| Conexiones | 60 directas | Suficiente para 1 proceso |
| Transferencia | 2 GB/mes | Holgado |
| Backups | 1/día, 7 días | Incluido |
| Connection pooler | Incluido | No hace falta PgBouncer externo |
| Costo | **$0** | Free tier permanente |

**Por qué Supabase:**

- PostgreSQL managed sin configuración
- Connection pooler incluido (no hace falta configurar PgBouncer)
- Backups automáticos
- Dashboard web para consultas rápidas
- Si superamos 500 MB, migrar a otro PostgreSQL es trivial (solo cambiar `DATABASE_URL`)

### 4.3.3 Cloudflare R2 — Almacenamiento de Audio

| Recurso | Free Tier | Detalle |
|---------|-----------|---------|
| Almacenamiento | 10 GB | ~5 GB estimado (100 beats × 50 MB) |
| Operaciones Clase A (PUT, POST, DELETE) | 1M/mes | Suficiente |
| Operaciones Clase B (GET, HEAD) | 10M/mes | Suficiente |
| Egress | **$0** — gratuito | Esta es la ventaja clave sobre S3 |
| API | S3-compatible | SDK AWS SDK funciona sin cambios |
| Costo | **$0** | Free tier permanente |

**Por qué R2 sobre S3:**

- S3 cobra $0.09/GB de egress. Con streaming de audio eso suma rápido.
- R2 tiene egress gratuito. Es la diferencia entre $0 y $5+/mes.
- API S3-compatible: el mismo código funciona con ambos.

**Estructura del bucket:**

```
mingarecords-audio/
├── originals/
│   └── {beatId}/
│       └── original.wav          # Archivo subido por el productor
├── previews/
│   └── {beatId}/
│       └── preview.mp3           # Preview 30s, 192kbps
└── licenses/
    └── {transactionId}/
        └── license.pdf           # Licencia generada post-compra
```

**Ciclo de vida:**

- `originals/` y `previews/` persisten mientras el beat existe
- `licenses/` persisten indefinidamente
- Soft-delete: los archivos se marcan pero no se borran inmediatamente

### 4.3.4 MercadoPago — Pagos

| Concepto | Detalle |
|----------|---------|
| Comisión | ~5% por transacción |
| Costo fijo | $0 |
| Sandbox | Disponible para testing |
| Webhooks | Confirmación de pago |
| Integración | SDK oficial + preferencias de pago |

**Por qué MercadoPago:**

- Disponible en LATAM (Stripe no lo es legalmente en nuestro país)
- Sandbox completo para desarrollo sin costos
- Webhooks para confirmación automática de pagos
- Sin costo fijo mensual — solo pagás cuando vendés

### 4.3.5 Resend — Email Transaccional

| Recurso | Free Tier | Detalle |
|---------|-----------|---------|
| Emails/mes | 100/día (~3,000/mes) | Suficiente para MVP |
| Dominios verificados | 1 | mingarecords.com |
| API | REST + SDK Node.js | `resend` npm package |
| Templates | Soportados | HTML + React |
| Costo | **$0** | Free tier permanente |

**Por qué Resend:**

- Free tier generoso: 100 emails/día cubre verificación, licencias y password reset.
- SDK oficial de Node.js, integración trivial con Express.
- No hace falta configurar servidor SMTP ni gestionar reputación de IP.
- Alternativa a SendGrid/Mailgun con mejor DX para developers.

**Tipos de email en MVP:**

| Tipo | Trigger | Desde módulo |
|------|---------|-------------|
| Verificación de email | Registro de usuario | Auth Module |
| Licencia de compra | Pago aprobado | Payments Module |
| Password reset | Solicitud de recuperación | Auth Module |

---

## 4.4 Formatos de Audio Soportados

| Formato | MIME Type | Propósito | Tamaño máx |
|---------|-----------|-----------|------------|
| WAV | `audio/wav`, `audio/x-wav` | Subida original, entrega de licencia | 100 MB |
| MP3 | `audio/mpeg` | Preview streaming | 50 MB |
| AIFF | `audio/aiff` | Subida original (alternativa) | 100 MB |
| FLAC | `audio/flac` | Subida original sin pérdida | 100 MB |

**Rechazados:** M4A/AAC, OGG, WMA.

---

## 4.5 Esquema de Base de Datos

Un solo PostgreSQL (Supabase) con schemas lógicos separados por módulo:

```sql
-- ============================================
-- SCHEMA: auth
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
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SCHEMA: beats
-- ============================================
CREATE SCHEMA IF NOT EXISTS beats;

CREATE TABLE beats.beats (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producer_id     UUID NOT NULL,
    title           VARCHAR(255) NOT NULL,
    slug            VARCHAR(300) NOT NULL UNIQUE,
    genre           VARCHAR(50) NOT NULL,
    bpm             INTEGER CHECK (bpm > 0 AND bpm <= 300),
    key             VARCHAR(10),
    price_cents     INTEGER NOT NULL CHECK (price_cents >= 100),
    description     TEXT,
    tags            TEXT[] DEFAULT '{}',
    preview_url     VARCHAR(500),
    plays_count     INTEGER DEFAULT 0,
    sales_count     INTEGER DEFAULT 0,
    status          VARCHAR(20) DEFAULT 'draft'
                    CHECK (status IN ('draft', 'processing', 'published', 'archived')),
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_beats_producer ON beats.beats(producer_id);
CREATE INDEX idx_beats_genre ON beats.beats(genre);
CREATE INDEX idx_beats_status ON beats.beats(status) WHERE status = 'published';

-- ============================================
-- SCHEMA: storage
-- ============================================
CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE storage.audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beat_id UUID NOT NULL REFERENCES beats.beats(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  preview_url TEXT NOT NULL,
  format VARCHAR(10) NOT NULL CHECK (format IN ('wav', 'mp3')),
  size_bytes BIGINT NOT NULL,
  duration_seconds INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audio_files_beat ON storage.audio_files(beat_id);

-- ============================================
-- SCHEMA: payments
-- ============================================
CREATE SCHEMA IF NOT EXISTS payments;

CREATE TABLE payments.transactions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beat_id             UUID NOT NULL,
    buyer_id            UUID NOT NULL,
    producer_id         UUID NOT NULL,
    mp_payment_id       VARCHAR(255) NOT NULL UNIQUE,
    mp_preference_id    VARCHAR(255),
    amount_cents        INTEGER NOT NULL,
    platform_fee_cents  INTEGER NOT NULL,
    producer_earnings_cents INTEGER NOT NULL,
    currency            VARCHAR(3) DEFAULT 'ars',
    status              VARCHAR(20) DEFAULT 'pending'
                        CHECK (status IN ('pending', 'approved', 'rejected', 'refunded')),
    license_url         VARCHAR(500),
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_buyer ON payments.transactions(buyer_id);
CREATE INDEX idx_transactions_producer ON payments.transactions(producer_id);
CREATE INDEX idx_transactions_status ON payments.transactions(status);
```

---

## 4.6 Variables de Entorno

Un solo `.env` para el monolito:

```bash
# ==========================================
# Server
# ==========================================
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# ==========================================
# Base de Datos (Supabase)
# ==========================================
DATABASE_URL="postgresql://postgres.{ref}:{password}@aws-0-us-east-1.pooler.supabase.com:6543/postgres"

# ==========================================
# Auth
# ==========================================
JWT_ACCESS_SECRET="openssl rand -hex 64"
JWT_REFRESH_SECRET="openssl rand -hex 64"
JWT_ACCESS_EXPIRES_IN="1h"
JWT_REFRESH_EXPIRES_IN="7d"

# ==========================================
# Cloudflare R2 (Audio Storage)
# ==========================================
R2_ACCESS_KEY_ID=""
R2_SECRET_ACCESS_KEY=""
R2_BUCKET="mingarecords-audio"
R2_ENDPOINT="https://{account-id}.r2.cloudflarestorage.com"
R2_PUBLIC_URL="https://pub-{account-id}.r2.dev"

# ==========================================
# MercadoPago (Pagos)
# ==========================================
MP_ACCESS_TOKEN="APP_USR-..."
MP_PUBLIC_KEY="APP_USR-..."
MP_WEBHOOK_SECRET=""

# ==========================================
# Resend (Email Transaccional)
# ==========================================
RESEND_API_KEY="re_..."

# ==========================================
# Frontend URL (CORS)
# ==========================================
FRONTEND_URL="https://mingarecords.vercel.app"
```

**Validación con Zod al inicio:**

```typescript
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  JWT_ACCESS_SECRET: z.string().min(64),
  JWT_REFRESH_SECRET: z.string().min(64),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET: z.string().min(1),
  R2_ENDPOINT: z.string().url(),
  MP_ACCESS_TOKEN: z.string().startsWith('APP_USR-'),
  MP_PUBLIC_KEY: z.string().startsWith('APP_USR-'),
  RESEND_API_KEY: z.string().startsWith('re_'),
  FRONTEND_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
// Si falta algo, el proceso crashea al inicio con mensaje claro.
```

---

## 4.7 Setup Checklists

### 4.7.1 EC2 (AWS Free Tier)

```bash
# 1. Crear cuenta AWS (necesaria tarjeta, pero no cobra dentro del free tier)
# 2. Lanzar instancia EC2:
#    - AMI: Ubuntu Server 22.04 LTS
#    - Tipo: t2.micro
#    - Storage: 30 GB gp2
#    - Security Group: permitir puertos 22 (SSH) y 3000 (app)
# 3. Conectar por SSH:
ssh -i ~/.ssh/mingarecords.pem ubuntu@<ec2-public-ip>

# 4. Instalar Node.js 20:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 5. Habilitar corepack (incluido con Node 20):
sudo corepack enable

# 6. Instalar PM2:
sudo npm install -g pm2

# 7. Clonar repo:
git clone <repo-url> mingarecords
cd mingarecords
pnpm install --prod

# 8. Configurar .env:
cp .env.example .env
nano .env  # completar variables

# 9. Iniciar con PM2:
pm2 start dist/index.js --name mingarecords
pm2 save
pm2 startup  # genera comando para ejecutar al boot

# 10. (Opcional) Configurar Nginx como reverse proxy + SSL con Let's Encrypt
```

### 4.7.2 Supabase

```bash
# 1. Crear proyecto en https://supabase.com (free tier)
# 2. Obtener DATABASE_URL desde Settings → Database → Connection string
# 3. Ejecutar migraciones:
npx prisma migrate deploy
# 4. (Opcional) Configurar políticas RLS si se necesita acceso directo desde frontend
```

### 4.7.3 Cloudflare R2

```bash
# 1. Ir a Cloudflare Dashboard → R2 → Create Bucket
# 2. Nombre: mingarecords-audio
# 3. Crear API Token con permisos de Admin Read & Write
# 4. Guardar Access Key ID y Secret Access Key
# 5. La URL pública del bucket es: https://pub-{account-id}.r2.dev
```

### 4.7.4 MercadoPago Sandbox

```bash
# 1. Crear cuenta en https://www.mercadopago.com/developers
# 2. Ir a Panel → Credenciales de prueba
# 3. Copiar Access Token (empieza con APP_USR-) y Public Key
# 4. Configurar webhook URL: https://<ec2-ip>:3000/api/payments/webhook
# 5. Testear con tarjetas de prueba del sandbox
```

---

## 4.8 Costo Estimado del MVP

| Proveedor | Servicio | Costo mensual |
|-----------|----------|---------------|
| AWS | EC2 t2.micro (free tier) | $0 |
| Supabase | PostgreSQL (free tier) | $0 |
| Cloudflare R2 | Audio storage (free tier) | $0 |
| MercadoPago | Pagos | ~5% comisión por venta |
| Resend | Email transaccional (free tier) | $0 |
| Vercel | Frontend (hobby plan) | $0 |
| Dominio | Namecheap (~$10/año) | $0.83 |
| **TOTAL** | | **~$0.83/mes** |

**El MVP corre gratis.** El único costo fijo es el dominio. MercadoPago cobra solo cuando hay ventas.

---

## 4.9 Resumen de Decisiones

| Decisión | ¿Por qué? | Alternativa descartada |
|----------|-----------|----------------------|
| Monolito modular | 2 devs, 1 semana, $0 presupuesto | Microservicios: overhead innecesario |
| Express | Ya lo sabemos, time-to-market | Fastify: curva de aprendizaje |
| EC2 t2.micro | 750h gratis, control total, deploy simple | Railway: crédito se agota rápido |
| Supabase | PostgreSQL managed, pooler incluido | Railway PG: sin free tier real |
| R2 | Egress gratuito (crítico para audio) | S3: $0.09/GB egress |
| MercadoPago | Disponible en LATAM, sandbox | Stripe: no disponible legalmente |
| 1 DB compartida | Simplicidad, schemas aislados | Múltiples DBs: overkill |
