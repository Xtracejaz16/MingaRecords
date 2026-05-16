# 14 — Escalabilidad Futura

> **Versión:** 1.0 — **Fecha:** 12 de mayo de 2026

---

## 14.1 Filosofía de Escalado

| Principio | Qué significa |
|-----------|---------------|
| **No escalar antes de que duela** | Si no hay problema de performance, no hay problema. Premature optimization is the root of all evil. |
| **Métricas sobre intuición** | No escalar porque "va a crecer". Escalar cuando las métricas lo exigen. |
| **Un cambio a la vez** | No migrar DB + introducir colas + separar servicios en la misma semana. Un cambio, medir, estabilizar, siguiente. |
| **Reversible siempre** | Cada cambio de infraestructura debe poder revertirse en < 1 hora. |

---

## 14.2 Cuándo Introducir Colas de Mensajes

### Trigger Actual (MVP): HTTP Síncrono

```
Payments ──HTTP──► Catalog (PATCH /beats/:id/sold)
Payments ──HTTP──► Auth    (GET /users/:id)
```

### Cuándo Cambiar a Colas

| Métrica | Threshold | Acción |
|---------|-----------|--------|
| Webhook processing time (p95) | > 5 segundos consistently | Introducir cola para procesamiento async de webhooks |
| Cross-service call failures | > 5% de requests fallidos por timeout | Cola con retry automático |
| Email delivery latency | > 30 segundos desde pago hasta email | Cola de emails |
| Concurrent webhook bursts | > 10 webhooks simultáneos (ej: Black Friday) | Cola para procesar secuencialmente |

### Qué Usar: Redis Pub/Sub vs RabbitMQ vs Kafka

| Opción | Cuándo | Pros | Cons |
|--------|--------|------|------|
| **Redis Pub/Sub** (Upstash) | < 10K mensajes/día, MVP+ | Ya tenemos Redis, setup mínimo, free tier | No persistencia, mensajes perdidos si Redis cae |
| **RabbitMQ** (CloudAMQP free) | 10K-100K mensajes/día, v2 | Persistencia, dead letter queues, retry policies | Infraestructura adicional, learning curve |
| **Kafka** (Confluent Cloud free) | > 100K mensajes/día, v3 | Throughput masivo, replay de eventos, partitions | Complejidad operacional alta, overkill para MingaRecords |

### Recomendación: Redis Pub/Sub primero

```
v1 (MVP):     HTTP síncrono directo
v1.5 (cuando duela):  Redis Pub/Sub (Upstash) para eventos async
v2 (si Redis no alcanza):   RabbitMQ (CloudAMQP)
v3 (si RabbitMQ no alcanza): Kafka (Confluent Cloud)
```

### Eventos para Cola (prioridad de migración)

| Evento | Prioridad de Migración | Razón |
|--------|----------------------|-------|
| `sale.completed` → enviar email | Alta | No bloquea el flujo del usuario, puede ser async |
| `sale.completed` → notificar Catalog | Media | Catalog puede esperar, no es crítico |
| `beat.published` → notificar followers | Media | Para v2 con follows |
| `audio.uploaded` → procesar con ffmpeg | Alta | Ya es async en MVP (202 Accepted), pero la cola mejora la confiabilidad |
| `user.registered` → enviar welcome email | Baja | En MVP ya es async (no bloquea response) |

---

## 14.3 Cuándo Usar WebSockets

### Trigger Actual (MVP): No hay comunicación en tiempo real

### Cuándo Introducir WebSockets

| Caso de Uso | Trigger | Alternativa MVP |
|-------------|---------|-----------------|
| Chat comprador ↔ productor | > 50 productores piden chat activamente | Email "contactar productor" en perfil |
| Notificaciones en tiempo real (nueva venta) | > 20 productores activos simultáneos | Email + polling cada 30s en frontend |
| Live play count updates | > 1,000 plays simultáneos | Polling cada 60s |
| Collaborative beat editing | Feature request específica | No en roadmap |

### Implementación Recomendada

```
v1.5 (cuando duela):  Server-Sent Events (SSE) — más simple que WebSockets
v2 (si SSE no alcanza):  WebSockets (ws package en Fastify)
v3 (si WebSocket scale no alcanza):  Ably/Pusher (managed real-time)
```

**Por qué SSE antes que WebSockets**:
- SSE es unidireccional (server → client), que es exactamente lo que necesitamos para notificaciones
- SSE funciona sobre HTTP (no requiere puerto adicional)
- SSE tiene reconexión automática nativa
- WebSockets requiere manejo de conexión, heartbeat, reconexión manual
- Para chat bidireccional sí necesitamos WebSockets, pero eso es v2

---

## 14.4 Cuándo Separar Bases de Datos

### Trigger Actual (MVP): Una DB compartida con schemas separados

```
PostgreSQL (Supabase)
├── schema: auth
├── schema: catalog
├── schema: streaming
└── schema: payments
```

### Cuándo Separar

| Servicio | Trigger | Indicador |
|----------|---------|-----------|
| **Catalog** | > 10,000 beats en catálogo | Queries de búsqueda > 500ms consistentemente |
| **Payments** | > 1,000 transacciones/mes | Necesidad de backups independientes, compliance |
| **Streaming** | > 100,000 archivos de audio | Tabla audio_files crece más allá de 1GB |
| **Auth** | > 50,000 usuarios | Login queries > 200ms, necesidad de read replicas |

### Estrategia de Separación

```
Paso 1: Crear nueva DB (Railway PostgreSQL, $10/mes)
Paso 2: Configurar Prisma para apuntar a la nueva DB
Paso 3: Migrar datos con pg_dump/pg_restore (schema por schema)
Paso 4: Actualizar DATABASE_URL del servicio
Paso 5: Verificar que todo funciona
Paso 6: Eliminar schema viejo de la DB compartida
```

**Tiempo estimado**: 2-4 horas por servicio (con downtime de < 5 minutos si se hace bien).

### Por qué Schemas Separados Facilitan la Migración

Como cada servicio ya tiene su schema aislado:

```sql
-- Exportar solo el schema de Catalog
pg_dump -d mingarecords -n catalog -f catalog_backup.sql

-- Importar en nueva DB
psql -d catalog_db -f catalog_backup.sql
```

No hay que filtrar tablas ni resolver dependencias. El schema es una unidad de migración natural.

---

## 14.5 Cuándo Migrar Infraestructura

### De Freemium a Paid

| Proveedor | Trigger | Plan Siguiente | Costo |
|-----------|---------|----------------|-------|
| **Supabase** | > 350 MB DB usada | Supabase Pro | $25/mes |
| **Railway** | Crédito $5 agotado | Pay-as-you-go | $5-20/servicio/mes |
| **Upstash Redis** | > 7K requests/día | Upstash Pro | $10/mes |
| **Resend** | > 70 emails/día | Resend Pro | $20/mes |
| **Cloudflare R2** | > 7 GB storage | R2 pay-as-you-go | $0.015/GB |
| **BunnyCDN** | Trial de 14 días termina | Pay-as-you-go | ~$0.22/mes (MVP) |
| **Vercel** | > 70 GB bandwidth | Vercel Pro | $20/mes |
| **Sentry** | > 3,500 events/mes | Sentry Team | $26/mes |

### Cuándo Migrar de Proveedor

| Proveedor Actual | Trigger | Alternativa | Razón |
|-----------------|---------|-------------|-------|
| Supabase → Railway PG | Supabase Pro ($25) más caro que Railway PG ($10) | Railway PostgreSQL | Mismo PostgreSQL, menor costo |
| Railway → AWS/GCP | > 10 servicios, necesidad de VPC, compliance | AWS ECS o GCP Cloud Run | Infraestructura enterprise |
| Cloudflare R2 → AWS S3 | Necesidad de features S3-specific (lifecycle policies avanzadas) | AWS S3 | R2 es S3-compatible, migración trivial |
| BunnyCDN → CloudFront | Necesidad de features CloudFront-specific (Lambda@Edge) | CloudFront | Solo si las features justifican el costo 8.5× mayor |

---

## 14.6 Cuándo Dividir Servicios

### Servicios Actuales → Posibles Divisiones

| Servicio Actual | Posible División | Trigger |
|-----------------|-----------------|---------|
| **Auth** (auth + perfiles) | Auth Service + User Service | > 15 endpoints en Auth, o features sociales (follow, likes) |
| **Catalog** (beats + búsqueda + dashboard) | Catalog Service + Search Service | Búsqueda full-text consume > 50% de CPU del servicio |
| **Streaming** (upload + processing + delivery) | Upload Service + Processing Service + CDN Service | ffmpeg processing bloquea uploads |
| **Payments** (checkout + webhooks + licencias) | Payments Service + Licensing Service | Licencias se vuelven complejas (múltiples tipos, términos personalizados) |

### Criterio de División

Un servicio se divide cuando **TODAS** estas condiciones se cumplen:

1. Tiene > 20 endpoints o > 5,000 líneas de código
2. Tiene 2+ responsabilidades claramente separadas
3. Una responsabilidad tiene requerimientos de escalabilidad distintos a la otra
4. El equipo puede mantener el servicio adicional sin burnout

---

## 14.7 Riesgos Futuros y Mitigación

### Riesgo 1: Audio Storage Crece Exponencialmente

| Escenario | Impacto | Mitigación |
|-----------|---------|------------|
| 10,000 beats × 50MB WAV = 500GB | R2 free tier = 10GB. Costo: 490GB × $0.015 = $7.35/mes | Bajo costo, pero monitorear. Considerar compresión FLAC (50% menos). |
| 100,000 beats × 50MB = 5TB | Costo: 5,000GB × $0.015 = $75/mes | Evaluar políticas de lifecycle: eliminar previews de beats sin plays en 6 meses. |

### Riesgo 2: Streaming de Audio Satura la Infraestructura

| Escenario | Impacto | Mitigación |
|-----------|---------|------------|
| 50,000 plays/día × 720KB = 36GB/día | BunnyCDN: $5.40/mes. R2 egress: $0. | CDN absorbe la mayoría del tráfico. R2 solo sirve misses de cache. |
| 500,000 plays/día = 360GB/día | BunnyCDN: $54/mes. | Evaluar BunnyCDN Volume pricing ($0.005/GB). Costo: $18/mes. |

### Riesgo 3: Stripe Fees Comen el Revenue

| Escenario | Impacto | Mitigación |
|-----------|---------|------------|
| Beat $29.99 → Stripe $1.17 (3.9%) | Plataforma gana $4.50 (15%). Productor $24.32. | Sostenible. Stripe fees son proporcionales al revenue. |
| Beat $5 → Stripe $0.45 (9%) | Fee fijo de $0.30 impacta más en beats baratos. | Precio mínimo de $10 para beats. O fee fijo + % para beats baratos. |

### Riesgo 4: Vendor Lock-in

| Proveedor | Lock-in Risk | Mitigación |
|-----------|-------------|------------|
| Supabase | Medio (PostgreSQL estándar) | Usar solo features PostgreSQL estándar. No usar Supabase Auth, Realtime, ni Edge Functions. |
| Railway | Bajo (Docker containers) | Docker images son portables a cualquier plataforma. |
| Cloudflare R2 | Bajo (S3-compatible) | aws-sdk funciona con R2 y S3. Solo cambiar endpoint URL. |
| Upstash Redis | Bajo (Redis protocol) | Cualquier Redis-compatible funciona. |
| Resend | Medio (API específica) | Abstracción de email service en un puerto del domain. Swap fácil. |
| Stripe | Alto (API específica) | No hay alternativa real. Stripe es el estándar. PayPal como backup. |

### Riesgo 5: Complejidad Operacional Crece con los Servicios

| Escenario | Impacto | Mitigación |
|-----------|---------|------------|
| 4 servicios → 6 servicios (v2) | 2 devs manteniendo 6 servicios con deploys independientes | Automatizar TODO. Si hay un proceso manual, es un bug. |
| 6 servicios → 10 servicios (v3) | Imposible para 2 devs | Considerar consolidar servicios relacionados. O contratar más devs. |

---

## 14.8 Roadmap de Escalabilidad

```
FASE ACTUAL (MVP)
├── 4 microservicios
├── 1 DB compartida (schemas separados)
├── HTTP síncrono
├── Freemium infra
└── Logging + Sentry básico

FASE 1.5 (cuando duela — ~6 meses)
├── Redis Pub/Sub para eventos async
├── SSE para notificaciones en tiempo real
├── Supabase Pro ($25/mes) si DB crece
├── Upstash Pro ($10/mes) si Redis crece
└── Grafana Cloud free tier para dashboards

FASE 2 (v2 — ~12 meses)
├── 6 microservicios (user-service, notification-service)
├── RabbitMQ (CloudAMQP) si Redis Pub/Sub no alcanza
├── WebSockets para chat
├── DBs separadas para servicios con > 10GB
├── Stripe Connect para payouts automáticos
└── Sentry Team ($26/mes)

FASE 3 (v3 — ~24 meses)
├── 8-10 microservicios (si justificado)
├── Kafka si > 100K mensajes/día
├── DB read replicas para Catalog
├── CDN multi-región
├── PWA con offline support
└── Considerar migrar a AWS/GCP si > 10 servicios
```

---

## 14.9 Auditoría Crítica del SDD Completo

### Inconsistencias Detectadas

| # | Inconsistencia | Archivos Afectados | Resolución |
|---|----------------|-------------------|------------|
| 1 | File 06 usa RS256 en el middleware JWT, pero File 10 decide HS256 para MVP | 06-api-contracts.md vs 10-security.md | **Resuelto**: Usar HS256 en MVP (File 10 es la decisión final). File 06 debe actualizarse para reflejar HS256. |
| 2 | File 04 estima ~$18/mes pero File 12 dice ~$17/mes | 04-infrastructure.md vs 12-roadmap.md | Diferencia de $1 por redondeo. No crítico, pero File 12 debe decir ~$18. |
| 3 | File 02 dice Payments es serverless, File 04 dice $2/mes serverless, pero File 09 deploya Payments como Docker container en Railway | 02-system-architecture.md vs 04-infrastructure.md vs 09-devops-cicd.md | **Resuelto**: Payments corre como Docker en Railway con escala a cero (Railway soporta scale-to-zero). No es "serverless" en el sentido de AWS Lambda, pero escala a cero. |

### Servicios Innecesarios en MVP

| Servicio | Veredicto | Razón |
|----------|-----------|-------|
| User Service | ✅ Correcto postergar a v2 | En MVP son 3 endpoints de perfil en Auth. No justifica servicio propio. |
| Notification Service | ✅ Correcto postergar a v2 | 3 tipos de email transaccional. Resend directo desde cada servicio es suficiente. |
| API Gateway dedicado (Kong/Tyk) | ✅ Correcto no usar en MVP | Cloudflare Workers como proxy simple es suficiente para 4 servicios. |

### Posibles Cuellos de Botella

| Cuello de Botella | Servicio | Impacto | Mitigación |
|-------------------|----------|---------|------------|
| ffmpeg processing | Streaming | Si 5 usuarios suben audio simultáneamente, ffmpeg satura CPU | Cola de procesamiento (v1.5). En MVP, máximo 1-2 uploads simultáneos. |
| Full-text search | Catalog | PostgreSQL tsvector puede ser lento con > 50,000 beats | índice GIN ya configurado. Si crece, considerar Meilisearch (open source, self-hosted). |
| DB connection pool | Todos | 4 servicios × 8 conexiones = 32. Supabase free = 60 directas, 200 con PgBouncer | PgBouncer configurado. Holgura del 84%. |
| Stripe webhook retries | Payments | Si nuestro endpoint está caído, Stripe reintenta por 72h | Idempotencia por event_id implementada. No hay riesgo de doble cobro. |

### Riesgos de Costos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| Audio storage excede 10GB R2 | Media (a los 6-12 meses) | $7.35/mes adicional | Bajo impacto. R2 es barato. |
| CDN bandwidth excede trial BunnyCDN | Alta (día 15) | $0.22/mes | Bajo impacto. Pay-as-you-go es barato. |
| Railway crédito $5 se agota | Media (mes 1) | $15-20/mes | Es el costo base esperado. No es un riesgo, es el presupuesto. |
| Supabase excede 500MB | Baja (no en MVP) | $25/mes (Pro tier) | Mitigar con limpieza de datos de test. |
| Sentry excede 5K events | Baja (con filtro de validation errors) | $26/mes (Team tier) | Filtrar errores esperados en `beforeSend`. |

### Problemas de Mantenibilidad

| Problema | Impacto | Recomendación |
|----------|---------|---------------|
| Monorepo con 6+ servicios | CI/CD se vuelve lento, `pnpm dev` levanta demasiados procesos | Turborepo ya filtra por cambios. Si CI > 15 min, considerar separar repos. |
| Shared package crece | `@mingarecords/shared` puede convertirse en un "god package" | Regla: si un código se usa en < 3 servicios, NO va en shared. Duplicar es mejor que acoplar. |
| 4 Dockerfiles casi idénticos | Mantenimiento redundante | Crear Dockerfile base compartido o usar Docker build args para parametrizar. |
| Prisma schemas separados | Migraciones deben correrse 4 veces | Script `migrate-all.sh` que corre migraciones en orden. Automatizar en CI. |

### Recomendaciones de Simplificación

| Recomendación | Ahorro | Impacto |
|---------------|--------|---------|
| **No usar Cloudflare Workers como gateway en MVP** | -1 componente | Usar CORS directo en cada servicio Fastify. Los 4 servicios pueden exponer sus URLs directamente. Cloudflare Workers agrega complejidad sin beneficio real con solo 4 servicios. |
| **No implementar circuit breaker manual en MVP** | -50 líneas × 4 servicios | Con 4 servicios y 2 devs, si un servicio cae, se nota. El circuit breaker se implementa cuando hay 6+ servicios. |
| **No usar Redis para rate limiting en MVP** | -1 dependencia (Upstash) | Rate limiting simple en memoria con sliding window por servicio. Se migra a Redis cuando hay múltiples instancias del mismo servicio. |
| **No implementar refresh token rotation en MVP** | -1 día de desarrollo | Refresh tokens simples (sin rotation) son suficientes para MVP. Agregar rotation en v1.1. |

### Recomendaciones de Evolución Futura

| Recomendación | Cuándo | Por qué |
|---------------|--------|---------|
| **Introducir GraphQL como capa sobre REST** | v2, si el frontend necesita datos de múltiples servicios en una sola llamada | Evita N+1 de llamadas HTTP desde el frontend. Apollo Federation puede orquestar los 4 servicios. |
| **Event sourcing para Payments** | v2, si hay disputas de pago o necesidad de auditoría completa | Cada cambio de estado de una transacción se registra como evento. Permite reconstruir el estado en cualquier punto del tiempo. |
| **CQRS para Catalog** | v2, si read/write ratio es > 10:1 | Separar queries (lecturas optimizadas) de commands (escrituras). Mejora performance de lectura sin afectar escrituras. |
| **Service mesh (Linkerd)** | v3, si hay 8+ servicios | mTLS automático, observabilidad built-in, load balancing inteligente. Overkill para < 6 servicios. |

### Riesgos Técnicos Prioritarios

| # | Riesgo | Severidad | Acción Inmediata |
|---|--------|-----------|-----------------|
| 1 | **ffmpeg en Docker**: la imagen con ffmpeg pesa ~180MB y puede tener issues en Alpine | Alta | Validar Dockerfile de Streaming con ffmpeg en local antes de CI. Considerar Debian slim si Alpine da problemas. |
| 2 | **Stripe webhook testing**: requiere URL pública para recibir webhooks | Alta | Usar Stripe CLI (`stripe listen --forward-to localhost:4004/webhooks/stripe`) en desarrollo. Ngrok para staging. |
| 3 | **Prisma multi-schema**: Supabase + Prisma con múltiples schemas puede tener edge cases | Media | Testear `prisma migrate dev` con los 4 schemas en día 1 de setup. Si falla, usar 4 instancias de PrismaClient. |
| 4 | **Monorepo Turborepo + Docker build**: build context de Docker en monorepo puede ser lento | Media | Usar `.dockerignore` agresivo. Build context debe ser < 50MB. |
| 5 | **Audio watermarking con ffmpeg**: puede ser complejo de implementar correctamente | Media | Dejar como P2. Preview con fade out y reducción de volumen (-8dB) es suficiente para MVP. |
