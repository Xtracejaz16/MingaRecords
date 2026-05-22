
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
 import { env } from '../../../../config/env';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado o formato inválido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verificamos el token usando el secreto que validamos con Zod
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    
    // Asignamos el usuario decodificado a req.user (gracias a nuestro tipo global)
    req.user = decoded; 
    
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
};