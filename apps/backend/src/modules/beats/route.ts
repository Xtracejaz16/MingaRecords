import { Router } from 'express';
import type { Request, Response } from 'express';
import multer from 'multer';
import { requireAuth } from '@/shared/middleware/auth.js';
import { beatUpload } from './upload.js';
import {
  CreateBeatInputSchema,
  UpdateBeatInputSchema,
} from './types.js';
import {
  createBeat,
  getBeat,
  listCatalog,
  updateBeat,
  deleteBeat,
} from './service.js';
import { getStorageProvider } from './provider.js';
import { ZodError } from 'zod';

const router = Router();

// ─── POST /api/beats ─────────────────────────────────────────────

router.post('/', requireAuth, beatUpload, async (req: Request, res: Response) => {
  try {
    const files = req.files as { audio?: Express.Multer.File[]; cover?: Express.Multer.File[] };

    if (!files?.audio?.[0] || !files?.cover?.[0]) {
      res.status(400).json({
        error: 'MISSING_FILES',
        message: 'Both audio and cover files are required',
      });
      return;
    }

    const input = CreateBeatInputSchema.parse({
      title: req.body.title,
      description: req.body.description,
      price: req.body.price ? Number(req.body.price) : undefined,
    });

    const userId = (req as any).user.userId;

    const beat = await createBeat(
      input,
      {
        audio: files.audio[0].buffer,
        audioName: files.audio[0].originalname,
        cover: files.cover[0].buffer,
        coverName: files.cover[0].originalname,
      },
      userId,
      getStorageProvider(),
    );

    res.status(201).json(beat);
  } catch (error) {
    handleBeatsError(error, res);
  }
});

// ─── GET /api/beats ──────────────────────────────────────────────

router.get('/', async (_req: Request, res: Response) => {
  try {
    const skip = _req.query.skip ? Number(_req.query.skip) : 0;
    const take = _req.query.take ? Number(_req.query.take) : 20;

    const beats = await listCatalog({ skip, take });
    res.status(200).json(beats);
  } catch (error) {
    handleBeatsError(error, res);
  }
});

// ─── GET /api/beats/:id ─────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const beat = await getBeat(req.params.id);
    res.status(200).json(beat);
  } catch (error) {
    handleBeatsError(error, res);
  }
});

// ─── PUT /api/beats/:id ─────────────────────────────────────────

router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const input = UpdateBeatInputSchema.parse(req.body);
    const userId = (req as any).user.userId;

    const beat = await updateBeat(req.params.id, input, userId);
    res.status(200).json(beat);
  } catch (error) {
    handleBeatsError(error, res);
  }
});

// ─── DELETE /api/beats/:id ──────────────────────────────────────

router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    await deleteBeat(req.params.id, userId, getStorageProvider());
    res.status(204).send();
  } catch (error) {
    handleBeatsError(error, res);
  }
});

// ─── Error Handler ───────────────────────────────────────────────

function handleBeatsError(error: unknown, res: Response): void {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: error.errors.map((e) => e.message).join(', '),
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    res.status(400).json({
      error: 'UPLOAD_ERROR',
      message: error.message,
    });
    return;
  }

  if (error instanceof Error) {
    switch (error.name) {
      case 'BeatNotFoundError':
        res.status(404).json({ error: 'NOT_FOUND', message: error.message });
        return;
      case 'BeatForbiddenError':
        res.status(403).json({ error: 'FORBIDDEN', message: error.message });
        return;
      case 'INVALID_AUDIO_TYPE':
        res.status(400).json({ error: 'INVALID_AUDIO_TYPE', message: 'Audio must be MP3 or WAV' });
        return;
      case 'INVALID_COVER_TYPE':
        res.status(400).json({ error: 'INVALID_COVER_TYPE', message: 'Cover must be JPEG or PNG' });
        return;
    }
  }

  console.error('Unexpected beats error:', error);
  res.status(500).json({ error: 'SERVER_ERROR', message: 'Something went wrong' });
}

export { router as beatsRouter };
