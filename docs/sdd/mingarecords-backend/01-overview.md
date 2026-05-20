# 01 — Visión General, Objetivos y Alcance MVP

> **Versión:** 2.0 — **Fecha:** 19 de mayo de 2026 — **Autores:** Sebastián Estrada, Yair Santiago Cetre

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
| **Costo operativo $0 en MVP** | Infraestructura gratuita o freemium hasta que haya revenue | Determina proveedores: Supabase free, AWS free tier, Cloudflare R2 |
| **Time-to-market < 1 semana** | MVP funcional en 7 días | Prioriza features core, elimina "nice to have" sin piedad |
| **TypeScript full-stack** | Frontend y backend en TS | Reduce cambio de contexto entre capas, reutiliza tipos compartidos |
| **Express.js** | Framework backend | Experiencia previa del equipo, time-to-market > optimización prematura |
| **MercadoPago** | Única pasarela de pagos | Disponible en LATAM con sandbox completo |
| **Organización modular** | Código separado por dominio | Cada módulo tiene su responsabilidad clara sin overengineering |
| **REST API** | Comunicación síncrona HTTP | Simple, conocido, sin contratos formales en MVP |
| **Monolito modular** | 1 proceso Express con módulos separados | Un solo deploy, un solo proceso, sin complejidad distribuida |

---

## 1.4 Alcance MVP — Lo que SÍ incluimos

### Backend: Monolito Modular (1 proceso Express)

Un solo proceso Express con módulos organizados por dominio. La comunicación entre módulos es por llamadas directas a funciones (sin HTTP interno).

```
apps/backend/
├── src/modules/
│   ├── auth/         → Registro, login, JWT, roles, perfil básico
│   ├── beats/        → CRUD beats, búsqueda, filtros, perfiles, dashboard
│   ├── storage/      → Subida audio, preview, R2, streaming
│   └── payments/     → Checkout MercadoPago, webhooks, licencias
├── src/shared/       → Middleware, tipos, utils compartidos
└── src/app.ts        → Express app (registra todos los módulos)
```

**Por qué monolito:** 2 devs, 1 semana de deadline, $0 presupuesto. Un solo proceso, un solo deploy. Simple.

### Funcionalidades MVP
- Registro como productor (subir beats) o artista (comprar beats)
- Catálogo público con filtros (género, precio, BPM, key) y búsqueda por texto
- Página de detalle de beat con reproductor de preview 30s
- Perfil público de productor con todos sus beats
- Dashboard de productor con: beats subidos, plays totales, ganancias, ventas recientes
- Checkout con MercadoPago
- Entrega automática de licencia post-pago
- Panel de ganancias con historial de transacciones

### NO incluimos en MVP
- Chat en tiempo real comprador ↔ productor
- Subastas / ofertas por beats
- Playlists / colecciones de beats
- Colaboraciones entre productores
- Analytics avanzados
- App móvil nativa
- Notificaciones push
- Procesamiento de audio avanzado (stem separation, mastering automático)
- Programa de afiliados / referidos

---

## 1.5 Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|------------|
| **Deadline de 1 semana**: no alcanzamos a terminar todo | Alta | Alto | Scope mínimo viable. Si algo no entra, se corta sin piedad. |
| **Costo de audio storage**: archivos WAV pesan 50MB+ c/u, el free tier se agota rápido | Media | Alto | MP3 320kbps como formato principal; Cloudflare R2 (10GB free) |
| **Fraude en pagos**: chargebacks, tarjetas robadas, licencias entregadas sin pago real | Media | Alto | MercadoPago maneja el riesgo; licencia SOLO tras webhook con status=approved confirmado |
| **Abuso de previews**: descarga no autorizada del preview de 30s | Media | Medio | HTTP Range Requests que no permiten descarga completa; rate limiting por IP |
| **Fatiga del equipo**: 2 devs, 1 semana, burnout | Alta | Alto | Turnos claros, scope acotado, sin perfeccionismo. Funcional > perfecto. |

---

## 1.6 Principios Arquitectónicos

| # | Principio | Qué significa en la práctica |
|---|-----------|------------------------------|
| P1 | **Simplicidad extrema** | Si algo se puede hacer con 1 archivo en vez de 3, se hace con 1. No abstraemos hasta que el dolor de no abstraer sea mayor que el de abstraer. |
| P2 | **Costo $0 hasta revenue** | Todo proveedor debe tener un free tier que cubra MVP. |
| P3 | **DX primero** | El backend debe correr con 1 comando: `pnpm dev`. Si necesitás 5 terminales, está mal diseñado. |
| P4 | **Fail fast, fail loud** | Un pago que falla debe avisar al usuario en < 3 segundos. Nada de "algo salió mal". |
| P5 | **Seguridad por defecto** | JWT con expiración corta (1h), refresh tokens httpOnly, archivos validados server-side, rate limiting en endpoints públicos. |

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

## 1.8 Roadmap

```
SEMANA 1 — MVP
────────────────────────────────────
Día 1-2:  Auth + Perfiles básicos
Día 2-3:  Catálogo + CRUD beats
Día 3-4:  Streaming + R2 + previews
Día 4-5:  MercadoPago + Webhooks + Licencias
Día 5-6:  Dashboard + Integración frontend
Día 6-7:  Testing + Deploy en AWS Free Tier
```

**Criterio de éxito**: Un productor puede subir un beat, un artista puede escucharlo y comprarlo con MercadoPago, y el productor ve la venta en su dashboard. Eso es todo.

---

## 1.9 Convenciones de este Documento

- **MUST / DEBE**: requisito obligatorio.
- **SHOULD / DEBERÍA**: recomendación fuerte, solo se ignora con justificación explícita.
- **MAY / PUEDE**: opcional, a discreción del equipo.
- Los diagramas de arquitectura son en **texto ASCII** para máxima portabilidad y versionado en git.
- Las decisiones se justifican con tradeoffs explícitos: "Elegimos X sobre Y porque Z, aunque perdemos W".
