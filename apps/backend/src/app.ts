// apps/backend/src/app.ts
// Express app bootstrap — organiza middlewares, routers y manejo de errores

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { env } from '@/config/env.js';
import { beatsRouter } from '@/modules/beats/route.js';
import { authRouter } from '@/modules/auth/route.js';
import { storageRouter } from '@/modules/storage/routes.js';

const app = express();

// cors permite que el frontend (localhost:5173) hable con el backend
app.use(cors({
  origin: env.isProduction
    ? 'https://mingarecords.com'
    : 'http://localhost:5173',
  credentials: true,
}));

// express.json lee el body de las peticiones en formato JSON
app.use(express.json());

// cookie-parser lee las cookies del header y las pone en req.cookies
app.use(cookieParser());

// Auth API routes
app.use('/api/v1/auth', authRouter);

// Beats API routes
app.use('/api/v1/beats', beatsRouter);

// Storage API routes
app.use('/api/v1/storage', storageRouter);

// Ruta de salud — útil para monitoreo
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler global — atrapa errores no manejados y evita que el servidor se caiga
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'SERVER_ERROR', message: 'Algo salió mal' });
});

export { app };
