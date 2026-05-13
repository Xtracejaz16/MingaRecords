# 01 — Visión General, Objetivos y Alcance MVP

> **Versión:** 1.1 — **Fecha:** 12 de mayo de 2026 — **Autores:** Sebastián Estrada, Yair Santiago Cetre

---

## 1.1 Visión del Producto

MingaRecords es la plataforma donde los beatmakers **monetizan su música directamente**, sin intermediarios innecesarios. Un productor puede subir un beat, un artista puede escucharlo y comprar una licencia, todo en minutos. Queremos que sea tan simple como Instagram para publicar y tan rápido como MercadoLibre para comprar.

La plataforma resuelve tres problemas reales del ecosistema de beatmaking:
1. **Visibilidad**: los productores no tienen dónde mostrar sus beats a artistas compradores potenciales.
2. **Monetización**: vender beats por WhatsApp/DM es inseguro, informal y no escala.
3. **Descubrimiento**: los artistas que buscan beats no saben dónde encontrar productores de calidad con precios claros.

---

## 1.2 Objetivos del Producto (MVP)

| # | Objetivo | Criterio de éxito |
|---|----------|-------------------|
| OBJ-1 | Un beatmaker puede subir un beat con metadata (título, género, precio, licencia) | Subida funcional con preview automático en < 30 seg |
| OBJ-2 | Un comprador puede navegar el catálogo, filtrar por género y precio | Búsqueda y filtro con < 500ms de respuesta |
| OBJ-3 | Un comprador puede escuchar un preview de 30 segundos antes de comprar | Streaming de preview en < 2 seg desde click |
| OBJ-4 | Un comprador puede pagar y recibir su licencia automáticamente | Pago procesado en < 10 seg, entrega de licencia inmediata |
| OBJ-5 | Un productor ve sus ganancias y estadísticas básicas en un dashboard | Dashboard con datos reales actualizados cada 24h |
| OBJ-6 | Cada productor tiene un perfil público con sus beats listados | Perfil accesible por URL única |

---

## 1.3 Restricciones Duras

Estas restricciones NO son negociables para esta fase del proyecto:

| Restricción | Detalle | Impacto en decisiones |
|------------|---------|----------------------|
| **2 developers** | Solo Yair y Sebastián codifican | Elimina cualquier herramienta que requiera > 1 día de setup |
| **Costo operativo ~$0 en MVP** | Infraestructura gratuita o freemium hasta que haya revenue | Determina proveedores: Supabase free, Railway/Render free, BunnyCDN free tier |
| **Time-to-market < 3 meses** | MVP funcional en 12 semanas | Prioriza features core, elimina "nice to have" sin piedad |
| **TypeScript full-stack** | Frontend y backend en TS | Reduce cambio de contexto entre capas, reutiliza tipos compartidos |
| **Hexagonal en backend** | ADR 002 ya aceptado | Cada microservicio sigue /domain → /application → /infrastructure |
| **REST + OpenAPI** | ADR 003 ya aceptado | Comunicación síncrona con contratos .yaml |
| **Microservicios controlados** | ADR 001 aceptado pero con moderación | Máximo 4 servicios en MVP; no partimos servicios hasta que duela |

---

## 1.4 Alcance MVP — Lo que SÍ incluimos

### Servicios MVP (4 servicios)
1. **Auth Service** — Registro, login, JWT, roles (producer/artist), perfil básico de usuario
2. **Catalog Service** — CRUD de beats, búsqueda, filtrado, perfiles públicos, dashboard básico
3. **Streaming Service** — Subida de audio WAV/MP3, generación de preview 30s, streaming HTTP Range Requests
4. **Payments Service** — Checkout, procesamiento de pago (Stripe), entrega de licencia, historial de transacciones

> **Nota**: En el MVP, `user-service` y `notification-service` NO se implementan como servicios separados. La lógica de perfil de usuario vive en Auth Service, y los emails transaccionales se envían directamente desde cada servicio vía Resend. Ver [05-microservices.md](./05-microservices.md) para su justificación como extracción futura (v2).

### Funcionalidades MVP
- Registro como productor (subir beats) o artista (comprar beats)
- Catálogo público con filtros (género, precio, BPM, key) y búsqueda por texto
- Página de detalle de beat con reproductor de preview 30s
- Perfil público de productor con todos sus beats
- Dashboard de productor con: beats subidos, plays totales, ganancias, ventas recientes
- Checkout con Stripe
- Entrega automática de licencia post-pago
- Panel de ganancias con historial de transacciones

### NO incluimos en MVP (v2+)
- Chat en tiempo real comprador ↔ productor
- Subastas / ofertas por beats
- Playlists / colecciones de beats
- Colaboraciones entre productores
- Analytics avanzados (mapas de calor, fuentes de tráfico)
- App móvil nativa
- Notificaciones push (web o mobile)
- Procesamiento de audio avanzado (stem separation, mastering automático)
- Programa de afiliados / referidos
- **User Service** como microservicio independiente (el perfil de usuario se maneja dentro de Auth Service en MVP)
- **Notification Service** como microservicio independiente (emails se envían directo con Resend desde cada servicio)

---

## 1.5 Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| **Fatiga por microservicios**: 2 devs manteniendo 4+ servicios con deploys independientes | Alta | Alto | Usamos Turborepo para unificar DX; deployments automatizados desde día 1; shared packages para código común |
| **Costo de audio storage**: archivos WAV pesan 50MB+ c/u, el free tier de cualquier CDN se agota rápido | Media | Alto | MP3 320kbps como formato principal; WAV solo para entrega de licencia premium; Cloudflare R2 (10GB free) + BunnyCDN |
| **Fraude en pagos**: chargebacks, tarjetas robadas, licencias entregadas sin pago real | Media | Alto | Stripe maneja el riesgo de fraude; licencia se entrega SOLO tras webhook `payment_intent.succeeded` confirmado con verificación de firma |
| **Abuso de previews**: descarga no autorizada del preview de 30s | Media | Medio | Marca de agua audible sutil + HTTP Range Requests que no permiten descarga completa; rate limiting por IP |
| **Vendor lock-in con Supabase**: si migramos a otro proveedor, las migraciones de datos son costosas | Baja | Medio | PostgreSQL estándar (no features pg-specific de Supabase); backups diarios; migraciones con Prisma (portable) |
| **Complejidad hexagonal excesiva**: tantas capas ralentizan el desarrollo en features simples | Media | Medio | Template por servicio que genera la estructura; solo aplicamos hexagonal completo a servicios con lógica de negocio real (Catalog, Payments); Auth y Streaming pueden simplificarse si no hay lógica compleja |
| **Acoplamiento Auth ↔ User**: en MVP, Auth maneja perfiles de usuario, lo cual mezcla responsabilidades | Baja | Bajo | El schema de perfiles está aislado en tablas separadas dentro del schema `auth`; la extracción a `user-service` en v2 es trivial (mover 2 tablas y 3 endpoints) |

---

## 1.6 Principios Arquitectónicos

Estos principios guían CADA decisión en este SDD. Si una decisión contradice un principio, se justifica explícitamente.

| # | Principio | Qué significa en la práctica |
|---|-----------|------------------------------|
| P1 | **Simplicidad extrema** | Si algo se puede hacer con 1 archivo en vez de 3, se hace con 1. No abstraemos hasta que el dolor de no abstraer sea mayor que el de abstraer. |
| P2 | **Costo $0 hasta revenue** | Todo proveedor debe tener un free tier que cubra MVP. Si un proveedor no tiene free tier, se busca alternativa. |
| P3 | **DX primero** | El monorepo debe correr con `pnpm dev` y levantar todo. Si necesitás 5 terminales, está mal diseñado. |
| P4 | **Domain-driven donde duela** | Solo aplicamos DDD táctico (aggregates, value objects, domain events) donde la lógica de negocio es compleja: Payments (licencias, estados de compra), Catalog (estados de beat). Auth es CRUD simple, no necesita DDD. |
| P5 | **Observabilidad desde día 0** | Si algo falla en producción, debemos saber en < 5 minutos qué falló, dónde y por qué. Sin logs estructurados no hay deploy. |
| P6 | **Fail fast, fail loud** | Un pago que falla debe avisar al usuario en < 3 segundos. Un upload fallido debe mostrar error claro. Nada de "algo salió mal". |
| P7 | **Seguridad por defecto** | JWT con expiración corta (1h), refresh tokens httpOnly, archivos validados server-side (no confiar en extensión), rate limiting en endpoints públicos. |
| P8 | **Extracción justificada** | No creamos un nuevo microservicio "por si acaso". Un servicio solo se extrae cuando: (a) tiene un equipo dedicado, O (b) tiene requerimientos de escalabilidad radicalmente distintos, O (c) su dominio es completamente independiente. |

---

## 1.7 Glosario de Dominio

| Término | Definición |
|---------|-----------|
| **Beat** | Pista de audio instrumental creada por un productor. Tiene metadata (título, género, BPM, key, tags) y un precio base. |
| **Productor (beatmaker)** | Usuario que crea y vende beats. Rol `producer`. |
| **Artista (comprador)** | Usuario que busca, escucha y compra beats. Rol `artist`. |
| **Licencia** | Derecho de uso sobre un beat. Define qué puede hacer el comprador (uso no exclusivo, distribución limitada, streaming permitido). |
| **Preview** | Fragmento de 30 segundos del beat, con marca de agua o fade, que se puede escuchar gratis antes de comprar. |
| **Plays** | Cantidad de reproducciones del preview de un beat. Métrica de popularidad. |
| **Venta** | Transacción completada: pago recibido + licencia entregada. |
| **Ganancia** | Monto neto que recibe el productor después de la comisión de la plataforma (15% en MVP). |
| **Dashboard** | Panel privado del productor con métricas de sus beats y ganancias. |

---

## 1.8 Roadmap de Servicios — MVP a v2

```
MVP (12 semanas)                      v2 (6 meses+)
─────────────────────────────────     ─────────────────────────
auth-service        ─────────────►    auth-service (solo auth)
  (auth + perfiles)                   user-service (perfiles,
                                       settings, follow, bio)

catalog-service     ─────────────►    catalog-service
streaming-service   ─────────────►    streaming-service
payments-service    ─────────────►    payments-service
                                      notification-service
                                        (push, email digests,
                                         in-app notifications)
```

**Criterio de extracción para v2**: Cuando Auth Service tenga > 15 endpoints o el perfil de usuario crezca a features sociales (follow, likes, actividad), extraemos `user-service`. Cuando necesitemos notificaciones push o más de 3 tipos de notificación, extraemos `notification-service`.

---

## 1.9 Convenciones de este Documento

- **MUST / DEBE**: requisito obligatorio.
- **SHOULD / DEBERÍA**: recomendación fuerte, solo se ignora con justificación explícita.
- **MAY / PUEDE**: opcional, a discreción del equipo.
- Los diagramas de arquitectura son en **texto ASCII** para máxima portabilidad y versionado en git.
- Las decisiones se justifican con tradeoffs explícitos: "Elegimos X sobre Y porque Z, aunque perdemos W".
