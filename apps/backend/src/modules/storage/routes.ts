import { Router, type Request, type Response } from 'express';
import { env } from '@/config/env.js';
import { requireAuth } from '@/shared/middleware/auth.js';
import { markAudioReady } from '@/modules/beats/service.js';
import { S3Adapter } from './s3.adapter.js';
import { LocalStorageAdapter } from './local.adapter.js';
import { StorageService } from './service.js';
import { upload } from './multer.config.js';

export const storageRouter = Router();

// Factory: elige adaptador según el entorno
const adapter = env.storageDriver === 's3' ? new S3Adapter() : new LocalStorageAdapter();
const service = new StorageService(adapter);

storageRouter.post('/upload/:beatId', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) { res.status(400).json({ error: 'No file uploaded' }); return; }
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
  try {
    const result = await service.uploadBeatFile(req.file, String(req.params.beatId), userId);

    // Marcar el beat como 'ready' con la URL del audio
    await markAudioReady(String(req.params.beatId), {
      audioUrl: result.url,
    });

    res.status(201).json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '';
    if (message === 'INVALID_FILE_TYPE') { res.status(400).json({ error: 'Invalid file type. Use mp3, wav or flac.' }); return; }
    if (message === 'FILE_TOO_LARGE') { res.status(400).json({ error: 'File exceeds 50MB limit.' }); return; }
    console.error('Upload failed:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

storageRouter.get('/download/:key(*)', async (req: Request, res: Response) => {
  try {
    const url = await service.getDownloadUrl(req.params.key);
    res.json({ url });
  } catch {
    res.status(500).json({ error: 'Could not generate download URL' });
  }
});

storageRouter.delete('/:key(*)', async (req: Request, res: Response) => {
  try {
    await service.deleteBeatFile(req.params.key);
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Delete failed' });
  }
});
