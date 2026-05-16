# 11 — Observabilidad

> **Versión:** 1.0 — **Fecha:** 12 de mayo de 2026

---

## 11.1 Principios de Observabilidad para 2 Developers

| Principio | Qué significa |
|-----------|---------------|
| **Señal sobre ruido** | No alertar de todo. Solo alertar de lo que requiere acción inmediata. |
| **Correlation IDs** | Cada request tiene un ID único que se propaga entre servicios. Sin esto, debuggear un error cross-service es imposible. |
| **Logs estructurados** | JSON, no texto libre. Si no podés hacer `grep` por campo, no sirve. |
| **Métricas de negocio** | No solo CPU y RAM. Beats vendidos, plays, revenue, conversion rate. |
| **Free tier first** | Sentry (5K events/mes), Railway logs (incluido), Supabase logs (incluido). |

---

## 11.2 Logging

### Formato: JSON Estructurado

```typescript
// packages/shared/src/middleware/request-logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined,
  formatters: {
    level: (label) => ({ level: label.toUpperCase() }),
  },
  base: {
    service: process.env.SERVICE_NAME,
    version: process.env.npm_package_version || 'dev',
    environment: process.env.NODE_ENV,
  },
});
```

### Log por Request

```json
{
  "level": "INFO",
  "time": "2026-05-12T15:30:00.123Z",
  "service": "catalog",
  "version": "1.0.0",
  "environment": "production",
  "correlationId": "corr-abc123def456",
  "reqId": "req-789xyz",
  "method": "GET",
  "url": "/api/v1/beats?genre=trap&page=1",
  "statusCode": 200,
  "responseTime": 45,
  "userId": "user-k8x2m4p1",
  "userAgent": "Mozilla/5.0 ...",
  "ip": "192.168.1.1"
}
```

### Log por Error

```json
{
  "level": "ERROR",
  "time": "2026-05-12T15:30:01.456Z",
  "service": "payments",
  "correlationId": "corr-def456ghi789",
  "reqId": "req-456abc",
  "method": "POST",
  "url": "/api/v1/webhooks/stripe",
  "statusCode": 500,
  "error": {
    "type": "StripeSignatureVerificationError",
    "message": "No signatures found matching the expected signature",
    "stack": "Error: No signatures found...\n    at webhookHandler..."
  },
  "userId": null,
  "ip": "54.187.174.169"
}
```

### Niveles de Log por Entorno

| Entorno | Nivel | Razón |
|---------|-------|-------|
| Desarrollo | `debug` | Ver todo para debuggear |
| Staging | `info` | Comportamiento normal + warnings |
| Producción | `warn` | Solo warnings y errores (reduce costos de log storage) |

### Qué Loguear

| Evento | Nivel | Campos adicionales |
|--------|-------|-------------------|
| Request recibido | `debug` | method, url, correlationId |
| Request completado | `info` | method, url, statusCode, responseTime |
| Error manejado | `warn` | error type, message, url |
| Error no manejado | `error` | error type, message, stack, url |
| Login exitoso | `info` | userId, ip |
| Login fallido | `warn` | email (no password!), ip, reason |
| Pago completado | `info` | transactionId, amountCents, beatId |
| Pago fallido | `warn` | transactionId, error, beatId |
| Upload iniciado | `info` | beatId, fileSize, mimeType |
| Upload fallido | `error` | beatId, error, fileSize |
| Webhook recibido | `info` | eventType, eventId |
| Webhook fallido | `error` | eventType, eventId, error |

### Qué NUNCA Loguear

| Dato | Razón |
|------|-------|
| Passwords (ni en hash) | Seguridad básica |
| JWT tokens completos | Podrían ser reutilizados si los logs se filtran |
| Números de tarjeta de crédito | PCI DSS. Stripe los maneja, nosotros nunca los vemos |
| Datos completos de transacciones | Solo loguear IDs y status, no montos ni datos del comprador |
| Headers Authorization | Contiene el JWT |
| Query params con tokens | Ej: `/auth/verify?token=abc123` |

---

## 11.3 Correlation IDs

### Cómo Funciona

```
CLIENTE                    CLOUDFLARE WORKER              AUTH SERVICE              CATALOG SERVICE
  │                              │                            │                          │
  │  X-Correlation-ID: corr-abc  │                            │                          │
  │─────────────────────────────►│                            │                          │
  │                              │  X-Correlation-ID: corr-abc│                          │
  │                              │───────────────────────────►│                          │
  │                              │                            │  X-Correlation-ID: corr-abc│
  │                              │                            │──────────────────────────►│
  │                              │                            │                          │
  │                              │  TODOS los logs incluyen correlationId: corr-abc       │
  │                              │  Para buscar: grep "corr-abc" en todos los servicios   │
```

### Implementación

```typescript
// packages/shared/src/middleware/correlation-id.ts
import type { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'node:crypto';

export async function correlationIdMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  // Usar el correlationId del cliente si existe, sino generar uno nuevo
  const correlationId =
    request.headers['x-correlation-id'] as string || randomUUID();

  // Adjuntar al request para que los handlers lo lean
  request.headers['x-correlation-id'] = correlationId;

  // Incluir en la respuesta
  reply.header('x-correlation-id', correlationId);

  // Incluir en todos los logs de este request
  request.log = request.log.child({ correlationId });
}
```

---

## 11.4 Métricas

### Métricas de Infraestructura (Railway — incluidas)

| Métrica | Alerta si | Razón |
|---------|-----------|-------|
| CPU usage | > 80% por 5 min | Servicio sobrecargado |
| Memory usage | > 85% por 5 min | Posible memory leak |
| Request count | Drop > 50% vs promedio 1h | Servicio caído |
| Response time (p95) | > 2s por 5 min | Degradación de performance |

### Métricas de Negocio (custom — trackear en logs)

| Métrica | Cómo trackear | Por qué importa |
|---------|---------------|-----------------|
| Beats subidos | Log info con `event: "beat.created"` | Crecimiento del catálogo |
| Plays totales | Log info con `event: "beat.played"`, beatId | Engagement |
| Ventas completadas | Log info con `event: "sale.completed"`, amountCents | Revenue |
| Checkout abandonado | Log warn con `event: "checkout.abandoned"` | UX problem |
| Usuarios registrados | Log info con `event: "user.registered"`, role | Growth |
| Login fallidos | Log warn con `event: "login.failed"`, reason | Security |
| Uploads fallidos | Log error con `event: "upload.failed"`, reason | UX problem |

### Dashboard de Métricas (Railway)

Railway incluye métricas básicas de CPU, RAM y requests. Para métricas de negocio, usar logs como fuente:

```bash
# Ejemplo: contar ventas del día en Railway logs
grep 'event: "sale.completed"' | jq -r '.amountCents' | paste -sd+ | bc
```

Para v2, considerar un dashboard más robusto (Grafana Cloud free tier) si los logs de Railway no son suficientes.

---

## 11.5 Tracing Distribuido

### Estrategia MVP: Correlation IDs (suficiente para 4 servicios)

No necesitamos Jaeger/Zipkin en MVP. Con correlation IDs + logs estructurados, podemos trazar un request completo:

```bash
# Buscar un request completo por correlationId
grep "corr-abc123" railway-logs-auth.json railway-logs-catalog.json railway-logs-streaming.json railway-logs-payments.json
```

### v2: OpenTelemetry (cuando tengamos 6+ servicios)

Cuando la cantidad de servicios haga que grep por correlationId sea impráctico:

- OpenTelemetry SDK en cada servicio
- Exporter a Grafana Cloud (free tier: 50GB traces/mes)
- Visualización de traces en Grafana Tempo

---

## 11.6 Health Checks

### Endpoint por Servicio

```
GET /health → 200 OK
```

```typescript
// Cada servicio implemente su propio health check
fastify.get('/health', async () => {
  const checks: Record<string, string> = {};

  // Check DB
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'connected';
  } catch {
    checks.database = 'disconnected';
  }

  // Check Redis (si aplica)
  try {
    await redis.ping();
    checks.cache = 'connected';
  } catch {
    checks.cache = 'disconnected';
  }

  // Determinar status
  const allHealthy = Object.values(checks).every((v) => v === 'connected');
  const statusCode = allHealthy ? 200 : 503;

  return {
    status: allHealthy ? 'ok' : 'degraded',
    service: process.env.SERVICE_NAME,
    version: process.env.npm_package_version || 'dev',
    uptime: process.uptime(),
    checks,
  };
});
```

### Railway Health Check Config

```json
// railway.json (por servicio)
{
  "healthcheckPath": "/health",
  "healthcheckTimeout": 5000,
  "restartPolicyType": "on_failure",
  "restartPolicyMaxRetries": 3
}
```

### Endpoints de Health por Servicio

| Servicio | Endpoint | Checks Internos |
|----------|----------|-----------------|
| Auth | `GET /health` | DB (auth schema) |
| Catalog | `GET /health` | DB (catalog schema), Redis |
| Streaming | `GET /health` | DB (streaming schema), R2 connectivity |
| Payments | `GET /health` | DB (payments schema), Stripe API |

---

## 11.7 Error Tracking — Sentry

### Setup

```typescript
// En cada servicio, al inicio de index.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  beforeSend(event) {
    // No enviar errores de validación (son esperados)
    if (event.exception?.values?.[0]?.type === 'ZodError') {
      return null;
    }
    // No enviar errores de auth fallida (son esperados)
    if (event.message?.includes('Credenciales inválidas')) {
      return null;
    }
    return event;
  },
});
```

### Qué Enviar a Sentry

| Tipo de Error | Enviar? | Razón |
|---------------|---------|-------|
| Error no manejado (500) | ✅ Sí | Bug en el código |
| DB connection failed | ✅ Sí | Infraestructura |
| Stripe webhook signature failed | ⚠️ Solo en producción | Podría ser ataque o config error |
| Zod validation error | ❌ No | Esperado, no es bug |
| Login fallido (credenciales incorrectas) | ❌ No | Esperado |
| Rate limit exceeded | ❌ No | Esperado |
| ffmpeg processing failed | ✅ Sí | Bug o archivo corrupto |
| R2 upload failed | ✅ Sí | Infraestructura |

### Free Tier de Sentry

| Recurso | Free | Uso MVP |
|---------|------|---------|
| Events/mes | 5,000 | ~500-1,000 (filtrando validation errors) |
| Team members | 1 | 2 devs (compartir cuenta) |
| Data retention | 30 días | Suficiente |
| Projects | Ilimitados | 1 proyecto "mingarecords-backend" |

---

## 11.8 Alerting Strategy

### Qué Alertar (requiere acción inmediata)

| Alerta | Canal | Umbral | Acción |
|--------|-------|--------|--------|
| Servicio caído (health check fails 3x) | Email + SMS | 3 fallos consecutivos | Investigar y redeployar |
| Error rate > 10% en 5 min | Email | 10% de requests con 5xx | Revertir deploy o hotfix |
| DB connection pool agotado | Email | > 90% de conexiones usadas | Aumentar pool o investigar leak |
| Stripe webhooks no procesados | Email | > 5 webhooks pendientes > 1h | Verificar webhook endpoint |

### Qué NO Alertar (ruido)

| Evento | Por qué no alertar |
|--------|-------------------|
| Login fallido individual | Es normal, los usuarios se equivocan |
| Rate limit hit individual | Un usuario haciendo muchas requests no es incidente |
| Upload fallido individual | El usuario puede reintentar |
| Cache miss | Es el comportamiento normal de cache-aside |
| Slow query individual | Si es consistente, se ve en métricas |

### Implementación de Alertas

Railway incluye alertas básicas por email. Para alertas más sofisticadas:

```
Railway native alerts → Email (incluido)
Sentry alerts → Email (free tier)
Custom alerts → Resend email (via script en cada servicio)
```

Para v2, considerar BetterStack (free tier) o Grafana Cloud alerts.

---

## 11.9 Resumen de Observabilidad MVP

| Capa | Herramienta | Costo | Qué cubre |
|------|-------------|-------|-----------|
| Logs | Railway logs + Pino JSON | Incluido | Todos los logs de los 4 servicios |
| Métricas | Railway dashboard | Incluido | CPU, RAM, requests por servicio |
| Health Checks | Endpoint `/health` + Railway | Incluido | Disponibilidad de cada servicio |
| Error Tracking | Sentry (free tier) | $0 | Errores no manejados, bugs |
| Correlation IDs | Header `x-correlation-id` | $0 | Tracing de requests entre servicios |
| Métricas de Negocio | Logs estructurados (grep) | $0 | Beats, plays, ventas, revenue |

### Setup en 15 Minutos

1. Instalar `@sentry/node` en cada servicio
2. Configurar `Sentry.init()` con DSN
3. Agregar correlation ID middleware en cada servicio
4. Configurar Pino logger con formato JSON
5. Configurar health check endpoint en cada servicio
6. Activar Railway health check en cada servicio
7. Configurar alertas de email en Railway

Total: ~15 minutos de setup, $0 costo.
