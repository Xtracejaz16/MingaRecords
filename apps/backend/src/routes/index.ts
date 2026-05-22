import { Router } from 'express';

export const router = Router();

router.get('/health', (_, res) => {
  res.json({
    status: 'ok',
  });
});
