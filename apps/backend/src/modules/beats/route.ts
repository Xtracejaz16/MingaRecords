import { Router } from 'express';
import type { Request, Response } from 'express';
import { requireAuth } from '@/shared/middleware/auth.js';
import {
  CreateBeatInputSchema,
  UpdateBeatInputSchema,
  ListBeatsQuerySchema,
} from './types.js';
import {
  createBeat,
  getBeat,
  listCatalog,
  updateBeat,
  deleteBeat,
  getProducerBeats,
  getProducerProfile,
  getGenres,
  getDashboard,
} from './service.js';
import { ZodError } from 'zod';

const router = Router();

// --- RFC 7807 Error Response Builder ---

function rfc7807Error(
  type: string,
  title: string,
  status: number,
  detail: string,
  instance: string,
) {
  return { type, title, status, detail, instance };
}

// ─── POST /api/beats ─────────────────────────────────────────────

router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'BEATMAKER') {
      res.status(403).json(
        rfc7807Error(
          'https://mingarecords.com/errors/forbidden',
          'Rol insuficiente',
          403,
          'Solo los beatmakers pueden crear beats',
          req.originalUrl,
        ),
      );
      return;
    }

    const input = CreateBeatInputSchema.parse(req.body);
    const beat = await createBeat(input, user.userId);

    res.status(201).json(beat);
  } catch (error) {
    handleBeatsError(error, res, req);
  }
});

// ─── GET /api/beats ──────────────────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  try {
    const query = ListBeatsQuerySchema.parse(req.query);
    const result = await listCatalog(query);
    res.status(200).json(result);
  } catch (error) {
    handleBeatsError(error, res, req);
  }
});

// ─── GET /api/genres ─────────────────────────────────────────────
// NOTE: Must be BEFORE /:id to avoid matching "genres" as an id

router.get('/genres', async (_req: Request, res: Response) => {
  try {
    const genres = await getGenres();
    res.status(200).json(genres);
  } catch (error) {
    handleBeatsError(error, res, _req);
  }
});

// ─── GET /api/dashboard ─────────────────────────────────────────
// NOTE: Must be BEFORE /:id to avoid matching "dashboard" as an id

router.get('/dashboard', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== 'BEATMAKER') {
      res.status(403).json(
        rfc7807Error(
          'https://mingarecords.com/errors/forbidden',
          'Rol insuficiente',
          403,
          'Solo los beatmakers pueden acceder al dashboard',
          req.originalUrl,
        ),
      );
      return;
    }

    const stats = await getDashboard(user.userId);
    res.status(200).json(stats);
  } catch (error) {
    handleBeatsError(error, res, req);
  }
});

// ─── GET /api/producers/:id ─────────────────────────────────────
// NOTE: Must be BEFORE /:id to avoid matching "producers" as an id

router.get('/producers/:id', async (req: Request, res: Response) => {
  try {
    const profile = await getProducerProfile(req.params.id);
    res.status(200).json(profile);
  } catch (error) {
    handleBeatsError(error, res, req);
  }
});

// ─── GET /api/producers/:id/beats ───────────────────────────────

router.get('/producers/:id/beats', async (req: Request, res: Response) => {
  try {
    const skip = req.query.skip ? Number(req.query.skip) : 0;
    const take = req.query.take ? Number(req.query.take) : 20;
    const beats = await getProducerBeats(req.params.id, { skip, take });
    res.status(200).json(beats);
  } catch (error) {
    handleBeatsError(error, res, req);
  }
});

// ─── GET /api/beats/:id ─────────────────────────────────────────
// NOTE: AFTER all /fixed-path routes to avoid matching them as :id

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const beat = await getBeat(req.params.id);
    res.status(200).json(beat);
  } catch (error) {
    handleBeatsError(error, res, req);
  }
});

// ─── PATCH /api/beats/:id ────────────────────────────────────────

router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const input = UpdateBeatInputSchema.parse(req.body);
    const userId = (req as any).user.userId;

    const beat = await updateBeat(req.params.id, input, userId);
    res.status(200).json(beat);
  } catch (error) {
    handleBeatsError(error, res, req);
  }
});

// ─── DELETE /api/beats/:id ──────────────────────────────────────

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    await deleteBeat(req.params.id, userId);
    res.status(204).send();
  } catch (error) {
    handleBeatsError(error, res, req);
  }
});

// ─── Error Handler ───────────────────────────────────────────────

function handleBeatsError(error: unknown, res: Response, req: Request): void {
  if (error instanceof ZodError) {
    res.status(400).json(
      rfc7807Error(
        'https://mingarecords.com/errors/validation',
        'Error de validación',
        400,
        error.errors.map((e) => e.message).join(', '),
        req.originalUrl,
      ),
    );
    return;
  }

  if (error instanceof Error) {
    switch (error.name) {
      case 'BeatNotFoundError':
        res.status(404).json(
          rfc7807Error(
            'https://mingarecords.com/errors/not-found',
            'Beat no encontrado',
            404,
            error.message,
            req.originalUrl,
          ),
        );
        return;
      case 'BeatForbiddenError':
        res.status(403).json(
          rfc7807Error(
            'https://mingarecords.com/errors/forbidden',
            'Acceso denegado',
            403,
            error.message,
            req.originalUrl,
          ),
        );
        return;
      case 'InvalidStatusTransitionError':
        res.status(422).json(
          rfc7807Error(
            'https://mingarecords.com/errors/invalid-transition',
            'Transición de estado inválida',
            422,
            error.message,
            req.originalUrl,
          ),
        );
        return;
      case 'ProducerRoleRequiredError':
        res.status(403).json(
          rfc7807Error(
            'https://mingarecords.com/errors/forbidden',
            'Rol de productor requerido',
            403,
            error.message,
            req.originalUrl,
          ),
        );
        return;
    }
  }

  console.error('Unexpected beats error:', error);
  res.status(500).json(
    rfc7807Error(
      'https://mingarecords.com/errors/server-error',
      'Error interno',
      500,
      'Something went wrong',
      req.originalUrl,
    ),
  );
}

export { router as beatsRouter };
