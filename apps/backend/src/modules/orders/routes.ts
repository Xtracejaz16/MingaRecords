import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => { res.json({ message: 'Orders OK' }); });

export { router as ordersRouter };
export default router;