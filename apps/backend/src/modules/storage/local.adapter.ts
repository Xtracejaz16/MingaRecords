import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '@/config/env.js';
import type { StoragePort, UploadResult } from './types.js';

export class LocalStorageAdapter implements StoragePort {
  private basePath = env.uploadsDir;
  private baseUrl = '/uploads';

  async upload(file: Express.Multer.File, beatId: string, userId: string): Promise<UploadResult> {
    const relativeDir = `beats/${userId}/${beatId}`;
    const dir = path.join(this.basePath, relativeDir);
    await fs.mkdir(dir, { recursive: true });

    const filename = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(dir, filename);
    await fs.writeFile(filePath, file.buffer);

    const key = `${relativeDir}/${filename}`;
    const url = `${this.baseUrl}/${key}`;
    return { key, url };
  }

  async getDownloadUrl(key: string): Promise<string> {
    const filePath = path.join(this.basePath, key);
    try {
      await fs.access(filePath);
    } catch {
      throw new Error('FILE_NOT_FOUND');
    }
    return `${this.baseUrl}/${key}`;
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.basePath, key);
    await fs.unlink(filePath);

    // Remove empty parent dirs
    let dir = path.dirname(filePath);
    while (dir !== this.basePath) {
      const files = await fs.readdir(dir);
      if (files.length === 0) {
        await fs.rmdir(dir);
        dir = path.dirname(dir);
      } else {
        break;
      }
    }
  }
}
