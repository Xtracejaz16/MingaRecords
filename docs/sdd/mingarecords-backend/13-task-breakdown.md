# 13 — Desglose de Tareas (MVP — 1 Semana)

> **Versión:** 2.0 — **Fecha:** 19 de mayo de 2026
> **Stack:** Express + TypeScript | Supabase (PostgreSQL) | Cloudflare R2 | MercadoPago
> **Arquitectura:** Modular Monolith (1 proceso, 1 deploy)
> **Equipo:** 2 devs (Yair / Sebas) | **Presupuesto:** $0 | **Deadline:** 7 días

---

## Convenciones de Estimación

| Tamaño | Rango |
|--------|-------|
| XS | 0.5 – 1 h |
| S | 1 – 2 h |
| M | 2 – 4 h |
| L | 4 – 6 h |

**Prioridades**:
- **P0**: Bloquea el MVP. Hacer YA.
- **P1**: Necesario para MVP. Hacer en el día asignado.
- **P2**: Si sobra tiempo. Backlog.

---

## EPIC 1: Setup (Día 1)

| ID | Task | Day | Est. (hours) | Owner | Dependencies |
|----|------|-----|--------------|-------|--------------|
| T01 | Scaffold Express app con TypeScript | 1 | 2h | Yair | — |
| T02 | Conexión Supabase + Prisma setup | 1 | 2h | Sebas | — |
| T03 | Auth: register + login + JWT | 1 | 4h | Yair | T01, T02 |
| T04 | Error handler middleware (RFC 7807) | 1 | 1h | Sebas | T01 |
| T05 | Auth guard middleware | 1 | 1h | Yair | T03, T04 |

---

## EPIC 2: Beats Module (Día 2)

| ID | Task | Day | Est. (hours) | Owner | Dependencies |
|----|------|-----|--------------|-------|--------------|
| T06 | Beats schema + Prisma models | 2 | 2h | Sebas | T02 |
| T07 | POST /beats — crear beat | 2 | 2h | Yair | T05, T06 |
| T08 | GET /beats — listado con paginación + filtros | 2 | 3h | Sebas | T06 |
| T09 | GET /beats/:id — detalle de beat | 2 | 1h | Yair | T06 |
| T10 | PATCH /beats/:id + DELETE /beats/:id | 2 | 2h | Sebas | T06, T07 |
| T11 | Búsqueda full-text (PostgreSQL tsvector) | 2 | 2h | Yair | T06 |

---

## EPIC 3: Storage Module (Día 3)

| ID | Task | Day | Est. (hours) | Owner | Dependencies |
|----|------|-----|--------------|-------|--------------|
| T12 | R2 storage adapter (aws-sdk S3 → R2 endpoint) | 3 | 2h | Sebas | — |
| T13 | POST /audio/upload — endpoint de subida | 3 | 2h | Yair | T05, T12 |
| T14 | Generación de preview con ffmpeg (30s) | 3 | 3h | Sebas | T12 |
| T15 | GET /audio/stream/:id — streaming con HTTP Range | 3 | 3h | Yair | T12 |
| T16 | Actualizar beat con URLs de audio | 3 | 1h | Sebas | T06, T14 |
| T17 | Validación de archivos (MIME, size, duration) | 3 | 1h | Yair | T13 |

---

## EPIC 4: Frontend Integration (Día 4)

| ID | Task | Day | Est. (hours) | Owner | Dependencies |
|----|------|-----|--------------|-------|--------------|
| T18 | Integración auth frontend (login/register) | 4 | 3h | Yair | T03 |
| T19 | Catálogo page con API integration | 4 | 3h | Sebas | T08 |
| T20 | Beat detail page con audio player | 4 | 4h | Yair | T09, T15 |
| T21 | Upload beat page | 4 | 3h | Sebas | T13 |
| T22 | Producer profile page | 4 | 2h | Yair | T09 |

---

## EPIC 5: Payments (Día 5)

| ID | Task | Day | Est. (hours) | Owner | Dependencies |
|----|------|-----|--------------|-------|--------------|
| T23 | MercadoPago SDK setup | 5 | 1h | Sebas | — |
| T24 | POST /payments/checkout — crear preferencia | 5 | 3h | Yair | T23 |
| T25 | POST /payments/webhook — handler de webhooks | 5 | 2h | Sebas | T23 |
| T26 | Verificación de webhook (signature validation) | 5 | 1h | Yair | T25 |
| T27 | Generación de licencia + entrega | 5 | 3h | Sebas | T26 |
| T28 | Registro de transacción en DB | 5 | 2h | Yair | T26 |

---

## EPIC 6: Polish (Día 6)

| ID | Task | Day | Est. (hours) | Owner | Dependencies |
|----|------|-----|--------------|-------|--------------|
| T29 | Rate limiting (in-memory) | 6 | 1h | Sebas | — |
| T30 | Validación de inputs con Zod | 6 | 2h | Yair | — |
| T31 | Configuración CORS | 6 | 0.5h | Sebas | — |
| T32 | Tests happy-path básicos | 6 | 3h | Yair + Sebas | T01–T28 |

---

## EPIC 7: Deploy (Día 7)

| ID | Task | Day | Est. (hours) | Owner | Dependencies |
|----|------|-----|--------------|-------|--------------|
| T33 | Setup AWS EC2 (t2.micro, Free Tier) | 7 | 2h | Yair | — |
| T34 | Deploy script (git pull + build + pm2) | 7 | 2h | Sebas | T33 |
| T35 | Smoke tests en producción | 7 | 2h | Yair + Sebas | T34 |
| T36 | Domain + SSL setup | 7 | 2h | Yair | T33 |

---

## Resumen por EPIC

| EPIC | Tareas | Horas estimadas | Día |
|------|--------|-----------------|-----|
| EPIC 1: Setup | 5 | 10h | Día 1 |
| EPIC 2: Beats Module | 6 | 12h | Día 2 |
| EPIC 3: Storage Module | 6 | 12h | Día 3 |
| EPIC 4: Frontend Integration | 5 | 15h | Día 4 |
| EPIC 5: Payments | 6 | 12h | Día 5 |
| EPIC 6: Polish | 4 | 6.5h | Día 6 |
| EPIC 7: Deploy | 4 | 8h | Día 7 |
| **TOTAL** | **36 tareas** | **~75.5h** | **7 días** |

### Capacidad del Equipo

- Horas productivas por dev por día: ~7h
- Horas totales por día (2 devs): ~14h
- Horas totales en 7 días: **~98h disponibles**
- Horas estimadas: **~75.5h**
- **Margen: ~22.5h (23%) para imprevistos**

### Distribución por Owner

| Owner | Tareas | Horas estimadas |
|-------|--------|-----------------|
| Yair | 18 | ~38h |
| Sebas | 15 | ~32h |
| Ambos | 3 | ~5.5h |
