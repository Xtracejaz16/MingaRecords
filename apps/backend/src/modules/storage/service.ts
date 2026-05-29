import type { StoragePort, UploadResult } from './types.js';

const ALLOWED_MIME_TYPES = ['audio/mpeg', 'audio/wav', 'audio/flac'];
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

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

  async uploadCover(
    file: Express.Multer.File,
    beatId: string,
    userId: string,
  ): Promise<UploadResult> {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new Error('INVALID_FILE_TYPE');
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error('FILE_TOO_LARGE');
    }
    return this.storage.upload(file, beatId, userId);
  }

  async deleteBeatFile(key: string): Promise<void> {
    return this.storage.delete(key);
  }
}
