import { Router } from 'express';
export const ordersRouter = Router();
ordersRouter.get('/', (req, res) => { res.json({ message: "Orders OK" }); });