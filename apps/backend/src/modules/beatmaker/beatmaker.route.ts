// apps/backend/src/modules/beatmaker/beatmaker.route.ts

import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '@/shared/middleware/auth.js';
import type { AuthenticatedRequest } from '@/modules/auth/types.js';
import { updateBeatmakerProfile } from './beatmaker.service.js';

const router = Router();

router.put('/perfil', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'UNAUTHORIZED', message: 'Usuario no autenticado' });
      return;
    }

    const { profileImage, genre, artistName } = req.body;

    const result = await updateBeatmakerProfile(userId, { profileImage, genre, artistName });

    res.status(200).json(result);
  } catch (error) {
    handleBeatmakerError(error, res);
  }
});

function handleBeatmakerError(error: unknown, res: Response): void {
  if (error instanceof Error) {
    switch (error.message) {
      case 'NO_FIELDS_TO_UPDATE':
        res.status(400).json({
          error: 'NO_FIELDS_TO_UPDATE',
          message: 'No se enviaron campos para actualizar',
        });
        return;
      case 'USER_NOT_FOUND':
        res.status(404).json({
          error: 'USER_NOT_FOUND',
          message: 'Usuario no encontrado',
        });
        return;
      default:
        if (error.message.endsWith('too long (max 500 characters)')) {
          res.status(400).json({
            error: 'FIELD_TOO_LONG',
            message: error.message,
          });
          return;
        }
        break;
    }
  }

  if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    if (prismaError.code === 'P2025') {
      res.status(404).json({
        error: 'USER_NOT_FOUND',
        message: 'Usuario no encontrado',
      });
      return;
    }
  }

  console.error('Unexpected beatmaker error:', error);
  res.status(500).json({
    error: 'SERVER_ERROR',
    message: 'Error interno del servidor',
  });
}

export { router as beatmakerRouter };
