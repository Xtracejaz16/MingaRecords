import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { router } from './routes/index.js';

export const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

app.use(express.json());

app.use('/api', router);

export default app;
