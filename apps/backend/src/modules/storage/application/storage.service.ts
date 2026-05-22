import type { StoragePort, UploadResult } from '../domain/storage.types'

export class StorageService {
  constructor(private readonly storage: StoragePort) {}

  async uploadBeatFile(
    file: Express.Multer.File,
    beatId: string,
    userId: string
  ): Promise<UploadResult> {
    const allowed = ['audio/mpeg', 'audio/wav', 'audio/flac']
    if (!allowed.includes(file.mimetype)) {
      throw new Error('INVALID_FILE_TYPE')
    }
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('FILE_TOO_LARGE')
    }
    return this.storage.upload(file, beatId, userId)
  }

  async getDownloadUrl(key: string): Promise<string> {
    return this.storage.getDownloadUrl(key)
  }

  async deleteBeatFile(key: string): Promise<void> {
    return this.storage.delete(key)
  }
}