---
# ADR 003: Estrategia de Comunicación entre Servicios

- **Estado:** Aceptado
- **Fecha:** 27 de abril de 2026
- **Autores:** Sebastián Estrada y Yair Santiago Cetre

## 1. Contexto

MingaRecords opera bajo una Arquitectura de Microservicios (ADR 001) con estructura
Hexagonal (ADR 002). Los servicios de catálogo de beats, streaming de audio, pagos
y gestión de usuarios necesitan comunicarse entre sí. Se debe definir el protocolo,
el estilo de comunicación (síncrono o asíncrono) y el contrato que regirá estos intercambios.

## 2. Decisión

Se adopta **REST sobre HTTP/1.1** como protocolo de comunicación **síncrona** entre servicios,
con contratos definidos mediante **OpenAPI 3.0** (.yaml). El streaming de audio se maneja
mediante HTTP Range Requests nativos, sin protocolo adicional.

## 3. Alternativas descartadas

- **GraphQL:** Ofrece flexibilidad en las consultas del frontend, pero agrega una capa de
  complejidad (resolvers, schemas) que no justifica el tamaño actual del equipo (2 integrantes).
  Se podría considerar en una versión futura si el frontend requiere consultas muy variables.

- **gRPC:** Ideal para comunicación de alto rendimiento entre microservicios internos gracias
  a su serialización binaria con Protobuf (.proto). Se descarta porque requiere mayor
  configuración inicial y el equipo priorizó velocidad de desarrollo sobre optimización prematura.

- **SOAP:** Protocolo basado en XML ampliamente usado en sistemas bancarios. Se descarta por
  ser excesivamente verboso y estar orientado a sistemas empresariales legacy, lo cual no
  corresponde al perfil moderno de MingaRecords.

- **Comunicación asíncrona (colas de mensajes - Kafka/RabbitMQ):** Se descarta como estrategia
  principal por la complejidad de infraestructura que implica. Se deja como mejora futura para
  eventos como notificaciones de ventas o procesamiento de pagos en background.

## 4. Contratos de comunicación

Se utiliza **OpenAPI 3.0** (archivos `.yaml`) para documentar y versionar todos los endpoints
REST de cada microservicio. Cada servicio expone su contrato en `/docs/api/`.

Ejemplo de contrato para el servicio de catálogo:
- `GET /beats` → lista paginada de beats disponibles
- `GET /beats/{id}` → detalle de un beat
- `POST /beats` → subida de nuevo beat (solo beatmakers autenticados)

## 5. Buenas prácticas aplicadas

- **Versionado de APIs:** Todos los endpoints incluyen prefijo de versión (`/api/v1/`) para
  permitir cambios sin romper clientes existentes.
- **Manejo de errores estandarizado:** Respuestas de error siguen el formato RFC 7807
  (Problem Details), con campos `status`, `title` y `detail`.
- **Timeouts y reintentos:** Cada cliente define un timeout máximo de 5 segundos por llamada
  para evitar bloqueos en cadena entre servicios (circuit breaker pattern).
- **Autenticación centralizada:** Todas las rutas protegidas validan JWT en un middleware
  compartido antes de llegar al caso de uso (respetando la capa de infraestructura del ADR 002).

## 6. Consecuencias

**Positivas:**
- Curva de aprendizaje mínima: todo el equipo ya conoce REST.
- Los contratos OpenAPI permiten generar documentación automática (Swagger UI).
- Compatible directamente con la estructura de Puertos y Adaptadores definida en el ADR 002.

**Negativas:**
- REST síncrono puede generar latencia acumulada si varios servicios se encadenan
  en una sola petición del usuario.
- No es óptimo para eventos en tiempo real (ej: notificaciones de nueva venta).
  Esto se resolverá con WebSockets o colas en una iteración futura.