import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// Enrutador global existente del proyecto
import { router } from './routes';

// === TUS NUEVOS MÓDULOS DEL SCAFFOLD ===
import { beatsRouter } from './modules/beats/routes';
import { ordersRouter } from './modules/orders/routes';
import { storageRouter } from './modules/storage/routes';
import { usersRouter } from './modules/users/routes';

export const app = express();

// === MIDDLEWARES GLOBALES ===
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// === ENRUTADOR BASE DEL PROYECTO ===
app.use('/api', router);

// === REGISTRO DE TUS NUEVAS RUTAS ===
app.use('/api/beats', beatsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/storage', storageRouter);
app.use('/api/users', usersRouter);