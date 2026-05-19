# 14 — Escalabilidad Futura

> **Versión:** 2.0 — **Fecha:** 19 de mayo de 2026

---

## 14.1 Filosofía de Escalado

| Principio | Qué significa |
|-----------|---------------|
| **No escalar antes de que duela** | Si no hay problema de performance, no hay problema. Premature optimization is the root of all evil. |
| **Métricas sobre intuición** | No escalar porque "va a crecer". Escalar cuando las métricas lo exigen. |
| **Un cambio a la vez** | No migrar DB + introducir colas + separar servicios en la misma semana. Un cambio, medir, estabilizar, siguiente. |
| **Reversible siempre** | Cada cambio de infraestructura debe poder revertirse en < 1 hora. |
| **2 devs, 1 semana** | Todo lo que agreguemos tiene que ser mantenible por 2 personas. Si no lo bancamos, no lo hacemos. |

---

## 14.2 Escalado Vertical (AWS EC2)

### Estado Actual (MVP): EC2 t2.micro

```
┌─────────────────────────────────┐
│  AWS EC2 t2.micro               │
│  1 vCPU, 1 GB RAM               │
│  Express (1 proceso)            │
│  ├── Auth module                │
│  ├── Catalog module             │
│  ├── Streaming module           │
│  └── Payments module            │
└─────────────────────────────────┘
```

### Cuándo Escalar Verticalmente

| Métrica | Threshold | Acción |
|---------|-----------|--------|
| CPU sostenida > 80% | Por más de 1 hora, consistentemente | t2.micro → t3.small (2 vCPU, 2 GB RAM) |
| OOM killer activado | Proceso muere por falta de memoria | t2.micro → t3.small |
| Response time p95 > 2s | No es la DB, es la app | t3.small → t3.medium (2 vCPU, 4 GB RAM) |
| ffmpeg processing bloquea requests | CPU saturada con uploads | t3.medium → t3.large (2 vCPU, 8 GB RAM) |

### Costos de Escalado EC2

| Instancia | vCPU | RAM | Costo/mes (us-east-1) | Cuándo |
|-----------|------|-----|----------------------|--------|
| t2.micro | 1 | 1 GB | ~$8.50 | MVP (free tier 12 meses) |
| t3.small | 2 | 2 GB | ~$15.20 | Cuando CPU > 80% sostenido |
| t3.medium | 2 | 4 GB | ~$30.40 | Cuando RAM es cuello de botella |
| t3.large | 2 | 8 GB | ~$60.80 | Cuando ffmpeg satura |

**Nota**: El free tier de AWS cubre 750 horas/mes de t2.micro por 12 meses. Después del free tier, el costo es el mismo (~$8.50/mes).

---

## 14.3 Escalado de Base de Datos (Supabase)

### Estado Actual (MVP): Supabase Free

```
Supabase Free
├── 500 MB database
├── 2 GB file storage
├── 50,000 monthly active users
├── 60 conexiones directas
└── PgBouncer incluido (200 conexiones)
```

### Cuándo Escalar

| Métrica | Threshold | Acción |
|---------|-----------|--------|
| DB size > 400 MB | 80% del límite free | Supabase Free → Supabase Pro ($25/mes) |
| Conexiones > 150 | PgBouncer saturado | Supabase Pro (400 conexiones directas, 10K con PgBouncer) |
| Backups point-in-time necesarios | Para compliance de pagos | Supabase Pro los incluye |
| Necesidad de read replicas | Read/write ratio > 10:1 | Supabase Pro permite read replicas ($15/mes c/u) |

### Supabase Pro ($25/mes)

| Feature | Free | Pro |
|---------|------|-----|
| Database size | 500 MB | 8 GB |
| File storage | 2 GB | 100 GB |
| Monthly active users | 50,000 | Unlimited |
| Direct connections | 60 | 400 |
| PgBouncer connections | 200 | 10,000 |
| Backups | 7 días | Point-in-time recovery |
| Support | Community | Email |

---

## 14.4 Escalado de Storage (Cloudflare R2)

### Estado Actual (MVP): R2 Free Tier

```
Cloudflare R2
├── 10 GB storage (free)
├── Egress gratuito (sin costo de transferencia)
├── S3-compatible API
└── Clase A operations: 1M/mes free
```

### Cuándo Escalar

| Métrica | Threshold | Acción |
|---------|-----------|--------|
| Storage > 10 GB | Límite free superado | R2 pay-as-you-go: $0.015/GB/mes |
| Operations > 1M/mes | Límite free de Class A | $4.50 por millón de operaciones |

### Costos R2

| Storage | Costo/mes |
|---------|-----------|
| 10 GB (free) | $0 |
| 50 GB | $0.60 |
| 100 GB | $1.35 |
| 500 GB | $7.35 |
| 1 TB | $14.85 |

**Ventaja clave**: R2 tiene egress gratuito. A diferencia de S3 ($0.09/GB), no pagamos por las descargas de audio. Esto es crítico para un marketplace de beats.

---

## 14.5 Escalado de Pagos (MercadoPago)

### Estado Actual

```
MercadoPago
├── Sin costo fijo mensual
├── Comisión por transacción (~5%)
├── Split de pagos disponible
└── Webhooks para notificaciones
```

### Cómo Escala

MercadoPago escala automáticamente — no hay infraestructura que gestionar. El costo es proporcional al revenue:

| Venta | Comisión (~5%) | Plataforma (15%) | Productor (80%) |
|-------|---------------|------------------|-----------------|
| $10 | $0.50 | $1.43 | $8.07 |
| $29.99 | $1.50 | $4.27 | $24.22 |
| $99.99 | $5.00 | $14.25 | $80.74 |

**No hay acción de escalado necesaria**. MercadoPago absorbe cualquier volumen. El único límite es la comisión, que es proporcional y predecible.

---

## 14.6 Cuándo Introducir Procesamiento Async

### Trigger Actual (MVP): Llamadas Directas en Monolito

```
Payments ──direct──► Catalog (markBeatAsSold)
Payments ──direct──► Auth    (getUserById)
Streaming ──direct──► ffmpeg (process audio)
```

### Cuándo Cambiar a Colas

| Métrica | Threshold | Acción |
|---------|-----------|--------|
| Webhook processing time (p95) | > 5 segundos consistentemente | Cola para procesamiento async de webhooks |
| Cross-module call failures | > 5% de requests fallidos por timeout | Cola con retry automático |
| Email delivery latency | > 30 segundos desde pago hasta email | Cola de emails |
| ffmpeg processing bloquea uploads | CPU > 80% por encoding | Cola de procesamiento de audio |

### Qué Usar: BullMQ + PostgreSQL

| Opción | Cuándo | Pros | Cons |
|--------|--------|------|------|
| **BullMQ + PostgreSQL** | < 50K jobs/día, v1.5 | Sin dependencia externa, usa la DB que ya tenemos, persistencia nativa | Limitado por throughput de PostgreSQL |
| **RabbitMQ** (CloudAMQP free) | 50K-500K jobs/día, v2 | Persistencia, dead letter queues, retry policies | Infraestructura adicional, ~$10/mes |

### Recomendación

```
v1 (MVP):     Llamadas directas en monolito
v1.5 (cuando duela):  BullMQ con PostgreSQL como backend
v2 (si BullMQ no alcanza):   RabbitMQ (CloudAMQP)
```

**Por qué BullMQ + PostgreSQL primero**:
- Ya tenemos PostgreSQL (Supabase), no agregamos dependencias
- BullMQ soporta PostgreSQL como storage backend
- Persistencia nativa: los jobs sobreviven reinicios
- Retry policies, delayed jobs, job priorities incluidos
- Setup: 1 tabla + 1 dependencia (`bullmq`)

### Eventos para Cola (prioridad de migración)

| Evento | Prioridad | Razón |
|--------|-----------|-------|
| `sale.completed` → enviar email | Alta | No bloquea el flujo del usuario, puede ser async |
| `sale.completed` → notificar Catalog | Media | Catalog puede esperar, no es crítico |
| `audio.uploaded` → procesar con ffmpeg | Alta | Ya es async en MVP (202 Accepted), pero la cola mejora confiabilidad |
| `beat.published` → notificar followers | Media | Para v2 con follows |
| `user.registered` → enviar welcome email | Baja | En MVP ya es async (no bloquea response) |

---

## 14.7 Cuándo Agregar Tiempo Real

### Trigger Actual (MVP): No hay comunicación en tiempo real

### Cuándo Introducir

| Caso de Uso | Trigger | Alternativa MVP |
|-------------|---------|-----------------|
| Notificaciones en tiempo real (nueva venta) | > 20 productores activos simultáneos | Email + polling cada 30s en frontend |
| Chat comprador ↔ productor | > 50 productores piden chat activamente | Email "contactar productor" en perfil |
| Live play count updates | > 1,000 plays simultáneos | Polling cada 60s |

### Implementación Recomendada

```
v1.5 (cuando duela):  Server-Sent Events (SSE) — más simple que WebSockets
v2 (si SSE no alcanza):  WebSockets (ws package en Express)
```

**Por qué SSE antes que WebSockets**:
- SSE es unidireccional (server → client), que es exactamente lo que necesitamos para notificaciones
- SSE funciona sobre HTTP (no requiere puerto adicional ni configuración especial en EC2)
- SSE tiene reconexión automática nativa
- WebSockets requiere manejo de conexión, heartbeat, reconexión manual
- Para chat bidireccional sí necesitamos WebSockets, pero eso es v2

---

## 14.8 Cuándo Separar Módulos

### Trigger Actual (MVP): Monolito Modular (1 proceso, 4 módulos)

```
Express App (1 proceso)
├── src/modules/auth/
├── src/modules/catalog/
├── src/modules/streaming/
└── src/modules/payments/

1 DB compartida (Supabase, schemas separados)
```

### Cuándo Separar

| Módulo | Trigger | Indicador |
|--------|---------|-----------|
| **Streaming** | ffmpeg processing bloquea la app | CPU del módulo > 80% mientras otros módulos están ociosos |
| **Catalog** | > 10,000 beats en catálogo | Queries de búsqueda > 500ms consistentemente |
| **Payments** | > 1,000 transacciones/mes | Necesidad de backups independientes, compliance PCI |
| **Auth** | > 50,000 usuarios | Login queries > 200ms, necesidad de read replicas |

### Estrategia de Separación

```
Paso 1: Extraer módulo a proceso independiente (v2)
Paso 2: Usar Supabase schema separado como DB propia
Paso 3: Configurar Prisma del módulo para apuntar a su schema
Paso 4: Migrar datos con pg_dump/pg_restore (schema por schema)
Paso 5: Actualizar DATABASE_URL del módulo extraído
Paso 6: Verificar que todo funciona
Paso 7: Eliminar schema viejo de la DB compartida
```

**Tiempo estimado**: 2-4 horas por módulo (con downtime de < 5 minutos si se hace bien).

### Por qué Schemas Separados Facilitan la Migración

Como cada módulo ya tiene su schema aislado:

```sql
-- Exportar solo el schema de Catalog
pg_dump -d mingarecords -n catalog -f catalog_backup.sql

-- Importar en nueva DB
psql -d catalog_db -f catalog_backup.sql
```

No hay que filtrar tablas ni resolver dependencias. El schema es una unidad de migración natural.

### Criterio de Extracción

Un módulo se extrae a proceso independiente cuando **TODAS** estas condiciones se cumplen:

1. Tiene > 20 endpoints o > 5,000 líneas de código
2. Tiene 2+ responsabilidades claramente separadas
3. Una responsabilidad tiene requerimientos de escalabilidad distintos a la otra
4. El equipo (2 devs) puede mantener el proceso adicional sin burnout
5. Hay revenue que justifica el costo operacional adicional

---

## 14.9 Proyecciones de Costo

### Fase 1: MVP (Gratis)

| Servicio | Plan | Costo/mes |
|----------|------|-----------|
| AWS EC2 t2.micro | Free tier (12 meses) | $0 |
| Supabase | Free | $0 |
| Cloudflare R2 | Free tier (10 GB) | $0 |
| MercadoPago | Sin costo fijo | $0 (comisión por venta) |
| Sentry | Free (5K events) | $0 |
| **Total** | | **$0** |

### Fase 2: Crecimiento (~$35/mes)

| Servicio | Plan | Costo/mes |
|----------|------|-----------|
| AWS EC2 t3.small | Pay-as-you-go | ~$15 |
| Supabase | Pro | $25 |
| Cloudflare R2 | Pay-as-you-go (50 GB) | ~$0.60 |
| MercadoPago | Sin costo fijo | $0 (comisión por venta) |
| Sentry | Free | $0 |
| **Total** | | **~$40/mes** |

**Trigger para esta fase**: DB > 400 MB o CPU > 80% sostenido.

### Fase 3: Escala (~$100/mes)

| Servicio | Plan | Costo/mes |
|----------|------|-----------|
| AWS EC2 t3.medium | Pay-as-you-go | ~$30 |
| Supabase | Pro + read replica | $40 |
| Cloudflare R2 | Pay-as-you-go (500 GB) | ~$7.35 |
| CloudAMQP | RabbitMQ (Little Lemur) | ~$10 |
| MercadoPago | Sin costo fijo | $0 (comisión por venta) |
| Sentry | Team | $26 |
| **Total** | | **~$113/mes** |

**Trigger para esta fase**: > 50K jobs/día, > 10K beats, necesidad de chat en tiempo real.

---

## 14.10 Riesgos Futuros y Mitigación

### Riesgo 1: Audio Storage Crece Exponencialmente

| Escenario | Impacto | Mitigación |
|-----------|---------|------------|
| 10,000 beats × 50MB WAV = 500GB | R2: 490GB × $0.015 = $7.35/mes | Bajo costo. Considerar compresión FLAC (50% menos). |
| 100,000 beats × 50MB = 5TB | R2: 5,000GB × $0.015 = $75/mes | Evaluar lifecycle: eliminar previews de beats sin plays en 6 meses. |

### Riesgo 2: Streaming de Audio Satura EC2

| Escenario | Impacto | Mitigación |
|-----------|---------|------------|
| 50,000 plays/día × 720KB = 36GB/día | R2 egress: $0 (gratuito). EC2 no sirve archivos directamente. | R2 absorbe todo el tráfico de descarga. EC2 solo sirve URLs firmadas. |
| 500,000 plays/día = 360GB/día | R2 egress: $0. Sin impacto en costo. | Si latency es problema, agregar CloudFront (free tier 1TB/mes). |

### Riesgo 3: MercadoPago Fees Comen el Revenue

| Escenario | Impacto | Mitigación |
|-----------|---------|------------|
| Beat $29.99 → MercadoPago ~$1.50 (~5%) | Plataforma gana $4.50 (15%). Productor $24.22 (80%). | Sostenible. Fees proporcionales al revenue. |
| Beat $5 → MercadoPago ~$0.25 (5%) | Fee proporcional. Margen bajo. | Precio mínimo de $10 para beats. |

### Riesgo 4: Vendor Lock-in

| Proveedor | Lock-in Risk | Mitigación |
|-----------|-------------|------------|
| Supabase | Medio (PostgreSQL estándar) | Usar solo features PostgreSQL estándar. No usar Supabase Auth, Realtime, ni Edge Functions. |
| AWS EC2 | Bajo (Docker containers) | Docker images son portables a cualquier plataforma. |
| Cloudflare R2 | Bajo (S3-compatible) | aws-sdk funciona con R2 y S3. Solo cambiar endpoint URL. |
| MercadoPago | Alto (API específica) | No hay alternativa real con misma cobertura en LATAM. El puerto `PaymentGateway` está aislado en el domain; cambiar a PayU solo requiere nuevo adaptador. |

### Riesgo 5: Complejidad Operacional

| Escenario | Impacto | Mitigación |
|-----------|---------|------------|
| 1 monolito → 4 procesos (v2) | 2 devs manteniendo 4 procesos con deploys independientes | Automatizar TODO. Si hay un proceso manual, es un bug. |
| 4 procesos → 8 procesos (v3) | Imposible para 2 devs | Consolidar procesos relacionados. O contratar más devs. |

---

## 14.11 Roadmap Simplificado

```
FASE ACTUAL (MVP — Semana 1)
├── 1 monolito modular (4 módulos en 1 proceso Express)
├── 1 DB compartida (schemas separados, 1 PrismaClient)
├── Llamadas directas entre módulos
├── AWS EC2 t2.micro (free tier)
├── Supabase Free
├── Cloudflare R2 Free (10 GB)
└── MercadoPago (sin costo fijo)

FASE 1.5 (cuando duela — ~6 meses)
├── BullMQ + PostgreSQL para eventos async
├── SSE para notificaciones en tiempo real
├── EC2 t3.small si CPU > 80% sostenido (~$15/mes)
├── Supabase Pro si DB > 400 MB ($25/mes)
└── R2 pay-as-you-go si storage > 10 GB ($0.015/GB)

FASE 2 (v2 — ~12 meses)
├── Extraer Streaming a proceso independiente (ffmpeg)
├── WebSockets para chat comprador ↔ productor
├── RabbitMQ si BullMQ no alcanza (~$10/mes)
├── DBs separadas para módulos con > 10GB
├── MercadoPago Connect para payouts automáticos
└── EC2 t3.medium si RAM es cuello de botella (~$30/mes)
```

---

## 14.12 Auditoría Crítica del SDD Completo

### Inconsistencias Detectadas

| # | Inconsistencia | Archivos Afectados | Resolución |
|---|----------------|-------------------|------------|
| 1 | File 06 usa RS256 en el middleware JWT, pero File 10 decide HS256 para MVP | 06-api-contracts.md vs 10-security.md | **Resuelto**: Usar HS256 en MVP (File 10 es la decisión final). File 06 debe actualizarse para reflejar HS256. |
| 2 | File 04 estima costos con Railway/Upstash/BunnyCDN pero el stack actual es AWS/Supabase/R2 | 04-infrastructure.md vs este archivo | **Resuelto**: Este archivo refleja el stack actual. File 04 debe actualizarse. |

### Servicios Innecesarios en MVP

| Módulo | Veredicto | Razón |
|--------|-----------|-------|
| User Module | ✅ Correcto postergar a v2 | En MVP son 3 endpoints de perfil en Auth. No justifica módulo propio. |
| Notification Module | ✅ Correcto postergar a v2 | 3 tipos de email transaccional. Resend directo desde cada módulo es suficiente. |
| API Gateway dedicado (Kong/Tyk) | ✅ Correcto no usar en MVP | Express routing nativo es suficiente para 4 módulos en 1 proceso. |

### Posibles Cuellos de Botella

| Cuello de Botella | Servicio | Impacto | Mitigación |
|-------------------|----------|---------|------------|
| ffmpeg processing | Streaming | Si 5 usuarios suben audio simultáneamente, ffmpeg satura CPU en t2.micro | Cola de procesamiento (v1.5). En MVP, máximo 1-2 uploads simultáneos. |
| Full-text search | Catalog | PostgreSQL tsvector puede ser lento con > 50,000 beats | Índice GIN ya configurado. Si crece, considerar Meilisearch (open source, self-hosted en EC2). |
| DB connection pool | Todos | 4 módulos × 8 conexiones = 32. Supabase free = 60 directas, 200 con PgBouncer | PgBouncer configurado. Holgura del 84%. |
| MercadoPago webhook retries | Payments | Si nuestro endpoint está caído, MercadoPago reintenta | Idempotencia por event_id implementada. No hay riesgo de doble cobro. |

### Riesgos de Costos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Audio storage excede 10GB R2 | Media (a los 6-12 meses) | $7.35/mes adicional | Bajo impacto. R2 es barato. |
| EC2 free tier se agota (12 meses) | Baja (largo plazo) | $8.50/mes | Es el costo base esperado después del año gratis. |
| Supabase excede 500MB | Baja (no en MVP) | $25/mes (Pro tier) | Mitigar con limpieza de datos de test. |
| Sentry excede 5K events | Baja (con filtro de validation errors) | $26/mes (Team tier) | Filtrar errores esperados en `beforeSend`. |

### Problemas de Mantenibilidad

| Problema | Impacto | Recomendación |
|----------|---------|---------------|
| Monolito crece | Express app puede volverse difícil de navegar | Mantener módulos aislados. Si un archivo > 500 líneas, separar. |
| Prisma schemas separados | Migraciones deben correrse por schema | Script `migrate-all.sh` que corre migraciones en orden. Automatizar en CI. |

### Recomendaciones de Simplificación

| Recomendación | Ahorro | Impacto |
|---------------|--------|---------|
| **No implementar circuit breaker en MVP** | -50 líneas × 4 módulos | Con 1 proceso y 2 devs, si un módulo falla, se nota. El circuit breaker se implementa cuando se extraen a procesos independientes. |
| **No usar Redis para rate limiting en MVP** | -1 dependencia | Rate limiting simple en memoria con sliding window. Se migra a BullMQ/Redis cuando hay múltiples instancias. |
| **No implementar refresh token rotation en MVP** | -1 día de desarrollo | Refresh tokens simples (sin rotation) son suficientes para MVP. Agregar rotation en v1.1. |

### Riesgos Técnicos Prioritarios

| # | Riesgo | Severidad | Acción Inmediata |
|---|--------|-----------|-----------------|
| 1 | **ffmpeg en Docker**: la imagen con ffmpeg pesa ~180MB y puede tener issues en Alpine | Alta | Validar Dockerfile de Streaming con ffmpeg en local antes de CI. Considerar Debian slim si Alpine da problemas. |
| 2 | **MercadoPago webhook testing**: requiere URL pública para recibir webhooks | Alta | Usar MercadoPago CLI o ngrok para desarrollo local. |
| 3 | **Prisma multi-schema**: Supabase + Prisma con múltiples schemas puede tener edge cases | Media | Testear `prisma migrate dev` con los 4 schemas en día 1 de setup. Si falla, usar 4 instancias de PrismaClient. |
| 4 | **Monorepo + Docker build**: build context de Docker puede ser lento | Media | Usar `.dockerignore` agresivo. Build context debe ser < 50MB. |
| 5 | **Audio watermarking con ffmpeg**: puede ser complejo de implementar correctamente | Media | Dejar como P2. Preview con fade out y reducción de volumen (-8dB) es suficiente para MVP. |
| 6 | **EC2 t2.micro CPU credits**: t2.micro usa CPU credits, se pueden agotar | Alta | Monitorear CPU credit balance. Si llega a 0, migrar a t3.small (no usa credits, unlimited mode). |
