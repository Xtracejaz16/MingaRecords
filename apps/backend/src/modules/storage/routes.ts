// apps/backend/src/modules/storage/routes.ts
import { Router, Request, Response } from 'express'
import { S3Adapter } from './infrastructure/s3.adapter'
import { StorageService } from './application/storage.service'
import { upload } from './infrastructure/multer.config'  // ← usa el tuyo

export const storageRouter = Router()

const service = new StorageService(new S3Adapter())

storageRouter.post(
  '/upload/:beatId',
  upload.single('file'),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' })
      return
    }

    const userId = (req as any).user?.id as string
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    try {
      const result = await service.uploadBeatFile(
        req.file,
        String(req.params.beatId),
        userId
      )
      res.status(201).json(result)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : ''
      if (message === 'INVALID_FILE_TYPE') {
        res.status(400).json({ error: 'Invalid file type. Use mp3, wav or flac.' })
        return
      }
      if (message === 'FILE_TOO_LARGE') {
        res.status(400).json({ error: 'File exceeds 50MB limit.' })
        return
      }
      res.status(500).json({ error: 'Upload failed' })
    }
  }
)

storageRouter.get(
  '/download/:key(*)',
  async (req: Request, res: Response) => {
    try {
      const url = await service.getDownloadUrl((req.params as any).key)
      res.json({ url })
    } catch {
      res.status(500).json({ error: 'Could not generate download URL' })
    }
  }
)

storageRouter.delete(
  '/:key(*)',
  async (req: Request, res: Response) => {
    try {
      await service.deleteBeatFile((req.params as any).key)
      res.status(204).send()
    } catch {
      res.status(500).json({ error: 'Delete failed' })
    }
  }
)