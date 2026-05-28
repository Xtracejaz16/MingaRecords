import { Router, Request, Response } from 'express';
import multer from 'multer';
// 1. Corregido el import: Usamos la ruta relativa correcta y el nombre exacto del archivo s3.adapter
import { S3Adapter } from './s3.adapter.js';
export const storageRouter = Router();
const service = new S3Adapter();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // Límite de 50MB
  },
});

// Enrutador principal de subidas
storageRouter.post('/upload/:beatId', upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  const userId = (req as any).user?.id as string;
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
// En lugar de req.params.key

  try {
    const result = await service.upload(req.file, req.params.beatId, userId);
    res.status(201).json(result);
  } catch (err: any) {
    const message = err instanceof Error ? err.message : '';
    if (message === 'INVALID_FILE_TYPE') {
      res.status(400).json({ error: 'Invalid file type. Use mp3, wav or flac.' });
      return;
    }
    if (message === 'FILE_TOO_LARGE') {
      res.status(400).json({ error: 'File exceeds 50MB limit.' });
      return;
    }
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Enrutador para obtener la URL de descarga
// Forzamos temporalmente req a 'any' para que acepte el comodín dinámico de Express sin quejas de tipos
storageRouter.get('/download/:key(*)', async (req: any, res: Response) => {
  try {
    const url = await service.getDownloadUrl(req.params.key);
    res.json({ url });
  } catch {
    res.status(500).json({ error: 'Could not generate download URL' });
  }
});

// Enrutador para eliminar un archivo
// Forzamos temporalmente req a 'any' para que acepte el comodín dinámico de Express sin quejas de tipos
storageRouter.delete('/:key(*)', async (req: any, res: Response) => {
  try {
    await service.delete(req.params.key);
    res.status(204).send();
  } catch {
    res.status(500).json({ error: 'Delete failed' });
  }
});