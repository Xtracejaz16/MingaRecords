import { Router } from 'express';
export const beatsRouter = Router();
beatsRouter.get('/', (req, res) => { res.json({ message: "Beats OK" }); });