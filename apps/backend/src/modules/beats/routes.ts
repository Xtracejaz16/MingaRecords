import { Router } from 'express';

const router = Router();

router.get('/', (_req, res) => { res.json({ message: 'Beats OK' }); });

export { router as beatsRouter };
export default router;
