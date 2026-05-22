// apps/backend/src/modules/storage/application/storage.service.ts
import type { StoragePort, UploadResult } from '../domain/storage.types'

export class StorageService {
  constructor(private readonly storage: StoragePort) {}

  async uploadBeatFile(
    file: Express.Multer.File,
    beatId: string,
    userId: string
  ): Promise<UploadResult> {
    // fileFilter en multer.config.ts ya rechazó tipos inválidos
    // el límite de 50MB también lo maneja multer con limits.fileSize
    return this.storage.upload(file, beatId, userId)
  }

  async getDownloadUrl(key: string): Promise<string> {
    return this.storage.getDownloadUrl(key)
  }

  async deleteBeatFile(key: string): Promise<void> {
    return this.storage.delete(key)
  }
}