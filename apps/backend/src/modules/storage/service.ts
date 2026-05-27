import type { StoragePort, UploadResult } from './types.js';

const ALLOWED_MIME_TYPES = ['audio/mpeg', 'audio/wav', 'audio/flac'];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export class StorageService {
  constructor(private readonly storage: StoragePort) {}

  async uploadBeatFile(
    file: Express.Multer.File,
    beatId: string,
    userId: string,
  ): Promise<UploadResult> {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new Error('INVALID_FILE_TYPE');
    }
    if (file.size > MAX_SIZE) {
      throw new Error('FILE_TOO_LARGE');
    }
    return this.storage.upload(file, beatId, userId);
  }

  async getDownloadUrl(key: string): Promise<string> {
    return this.storage.getDownloadUrl(key);
  }

  async deleteBeatFile(key: string): Promise<void> {
    return this.storage.delete(key);
  }
}
