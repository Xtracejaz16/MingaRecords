Estrategia de branching: Elegimos GitHub Flow por el pequeño tamaño del equipo (2 integrantes) y la frecuencia esperada de despliegues (actualizaciones rápidas para features de ventas). Esto simplifica el flujo con una rama main protegida y features temporales, sin necesidad de develop o releases paralelas

PR26: Scaffold base — Backend monolito Express + TypeScript
- Estructura: apps/backend/src/{config,modules,shared,routes,app.ts,server.ts}
- Módulos: users, beats, storage, orders (auth ya existe con lógica real)
- No lógica: solo scaffold para compilar y levantar el servidor

Cómo probar localmente:
1. Instalar dependencias: pnpm install
2. Ejecutar en modo dev: pnpm --filter @mingarecords/backend dev
3. Probar endpoint: GET http://localhost:3000/api/health → { "status": "ok" }
