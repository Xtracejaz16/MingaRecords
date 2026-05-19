# 11 — Observabilidad

> **Versión:** 2.0 — **Fecha:** 19 de mayo de 2026

---

## 11.1 Principios para el MVP de 1 Semana

Somos 2 developers, 1 proceso, 1 deploy en EC2 t2.micro, presupuesto $0. No necesitamos observabilidad de empresa.

| Principio | Qué significa |
|-----------|---------------|
| **Simple es suficiente** | `console.log` con timestamps anda perfecto para el MVP |
| **Un solo health check** | Un endpoint que verifique la DB alcanza |
| **Errores visibles** | Middleware de Express que loguee y devuelva RFC 7807 |
| **Eventos de negocio** | Líneas de log para ventas, registros, etc. |

### Qué NO necesitamos ahora

- ~~Pino / logging estructurado JSON~~
- ~~Correlation IDs~~ (un solo proceso, no hay cross-service)
- ~~Distributed tracing / OpenTelemetry~~
- ~~Sentry~~ (opcional, se puede agregar después)
- ~~Dashboards de métricas / Grafana~~
- ~~Alerting strategies~~
- ~~Health checks por servicio~~ (es un monolito)

---

## 11.2 Logging

### Estrategia: `console.log` con timestamps

Para un MVP de 1 semana, `console.log` con timestamps es suficiente. No hace falta Pino, Winston ni nada similar.

```typescript
// src/shared/logger.ts
export function log(level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const payload = data ? ` ${JSON.stringify(data)}` : '';
  console[level](`[${timestamp}] ${level.toUpperCase()}: ${message}${payload}`);
}
```

### Uso

```typescript
import { log } from './shared/logger';

log('info', 'Server started', { port: 3000 });
log('info', 'User registered', { userId: 'abc123' });
log('warn', 'Login failed', { email: 'user@example.com', reason: 'invalid_password' });
log('error', 'Database connection failed', { error: err.message });
```

### Qué Loguear

| Evento | Nivel | Ejemplo |
|--------|-------|---------|
| Server started | `info` | Puerto, entorno |
| Request importante | `info` | Method, path (no todos, solo los clave) |
| Venta completada | `info` | transactionId, amount |
| Usuario registrado | `info` | userId, role |
| Login fallido | `warn` | email (no password!), reason |
| Error de DB | `error` | message |
| Error no manejado | `error` | message, stack |
| Webhook recibido | `info` | eventType |

### Qué NUNCA Loguear

| Dato | Razón |
|------|-------|
| Passwords | Seguridad básica |
| JWT tokens | Podrían ser reutilizados |
| Headers Authorization | Contiene el JWT |
| Query params con tokens | Ej: `/auth/verify?token=abc123` |

---

## 11.3 Health Check

Un solo endpoint que verifica la conexión a la base de datos.

```typescript
// src/modules/health/health.route.ts
import { Router } from 'express';
import { prisma } from '../../shared/database';

const router = Router();

router.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', uptime: process.uptime() });
  } catch {
    res.status(503).json({ status: 'degraded', uptime: process.uptime() });
  }
});

export default router;
```

### Respuestas

| Status | Código | Significado |
|--------|--------|-------------|
| `ok` | 200 | Todo funciona |
| `degraded` | 503 | La DB no responde |

### Uso en AWS EC2

Configurar un health check básico en el load balancer o un cron simple:

```bash
# Verificar cada 30 segundos
curl -f http://localhost:3000/health || echo "UNHEALTHY" >> /var/log/minga-health.log
```

---

## 11.4 Error Handling Middleware

Un middleware global de Express que loguea el error y devuelve una respuesta RFC 7807.

```typescript
// src/shared/error-handler.ts
import type { Request, Response, NextFunction } from 'express';
import { log } from './logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  log('error', err.message, { stack: err.stack, path: req.path, method: req.method });

  // Errores conocidos (validation, auth)
  if (err.name === 'ZodError' || err.name === 'ValidationError') {
    res.status(400).json({
      type: 'validation-error',
      title: 'Datos inválidos',
      status: 400,
    });
    return;
  }

  // Error genérico
  res.status(500).json({
    type: 'internal-error',
    title: 'Error interno',
    status: 500,
  });
}
```

### Registro en la app

```typescript
// src/app.ts
import express from 'express';
import { errorHandler } from './shared/error-handler';

const app = express();

// ... routes ...

// El middleware de error va SIEMPRE al final
app.use(errorHandler);
```

---

## 11.5 Eventos de Negocio

Loguear eventos clave del negocio como líneas simples. Esto permite hacer grep en los logs de producción si hace falta.

```typescript
import { log } from './shared/logger';

// Venta completada
log('info', 'sale.completed', {
  transactionId: payment.id,
  amount: payment.amount,
  beatId: beat.id,
  userId: user.id,
});

// Usuario registrado
log('info', 'user.registered', {
  userId: user.id,
  role: user.role,
});

// Beat subido
log('info', 'beat.created', {
  beatId: beat.id,
  userId: user.id,
  genre: beat.genre,
});

// Webhook de MercadoPago recibido
log('info', 'webhook.received', {
  eventType: event.type,
  eventId: event.id,
});
```

### Consultar logs en EC2

```bash
# Ventas del día
grep 'sale.completed' /var/log/minga-app.log

# Errores
grep 'ERROR' /var/log/minga-app.log

# Usuarios registrados hoy
grep 'user.registered' /var/log/minga-app.log
```

---

## 11.6 Monitoreo Básico en AWS EC2

En EC2 t2.micro, lo único que importa es que la instancia no se muera.

| Métrica | Dónde verla | Alerta si |
|---------|-------------|-----------|
| CPU | CloudWatch (incluido) | > 80% sostenido |
| Memoria | CloudWatch agent | > 85% |
| Disco | CloudWatch agent | > 90% |
| Uptime | `/health` endpoint | No responde |

### CloudWatch (Free Tier)

AWS incluye 10 métricas custom gratis. Con eso alcanza para monitorear CPU, memoria y disco de una sola instancia.

```bash
# Instalar CloudWatch agent en EC2
sudo yum install amazon-cloudwatch-agent
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a start
```

---

## 11.7 Qué NO Preocuparse Ahora

| Concepto | Por qué no ahora |
|----------|-----------------|
| Distributed tracing | Un solo proceso, no hay cross-service |
| Correlation IDs | No hay múltiples servicios que correlacionar |
| Sentry | Se puede agregar en 5 minutos después, no es crítico |
| Dashboards de métricas | CloudWatch básico alcanza |
| Alerting complejo | Email de CloudWatch si la instancia se muere |
| Logging estructurado JSON | `console.log` con timestamps es suficiente |

### Sentry (Opcional)

Si querés agregarlo después, son 5 minutos:

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

Free tier: 5,000 events/mes. No es prioritario para el MVP.

---

## 11.8 Resumen

| Capa | Herramienta | Costo |
|------|-------------|-------|
| Logs | `console.log` con timestamps | $0 |
| Health check | `GET /health` | $0 |
| Errores | Express error middleware + RFC 7807 | $0 |
| Eventos de negocio | Líneas de log con grep | $0 |
| Monitoreo EC2 | CloudWatch (free tier) | $0 |

### Setup en 5 Minutos

1. Crear `logger.ts` con `console.log` + timestamps
2. Agregar `GET /health` que verifique DB
3. Agregar `errorHandler` middleware al final de `app.ts`
4. Loguear eventos de negocio clave (venta, registro, webhook)
5. Configurar CloudWatch básico en EC2

Total: ~5 minutos, $0 costo.
