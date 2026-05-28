// apps/backend/src/index.ts
// Entry point — arranca el servidor HTTP
import "dotenv/config"; // <--- Esta debe ser la línea 1
// ... resto de tu código
import { app } from './app.js';
import { env } from '@/config/env.js';

const server = app.listen(env.port, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${env.port}`);
  console.log(`📡 Entorno: ${env.isProduction ? 'producción' : 'desarrollo'}`);
});

// Graceful shutdown: cierra el servidor elegantemente al recibir SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('\n👋 Cerrando servidor gracefully...');
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});

// Graceful shutdown: cierra el servidor elegantemente al recibir SIGTERM (Docker/systemd)
process.on('SIGTERM', () => {
  console.log('\n👋 Cerrando servidor gracefully (SIGTERM)...');
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});
