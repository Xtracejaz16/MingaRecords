import { Router } from 'express';
export const storageRouter = Router();
storageRouter.get('/', (req, res) => { res.json({ message: "Storage OK" }); });