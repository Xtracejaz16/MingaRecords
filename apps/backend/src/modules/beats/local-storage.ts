import { writeFile, unlink, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type { StorageProvider } from './storage.js';

const BEATS_DIR = join(process.cwd(), 'public', 'beats');
const URL_PREFIX = '/beats';

export const localFileStorage: StorageProvider = {
  async uploadFile(buffer: Buffer, filename: string, mimetype: string): Promise<string> {
    if (!existsSync(BEATS_DIR)) {
      await mkdir(BEATS_DIR, { recursive: true });
    }

    const uniqueName = `${Date.now()}-${filename}`;
    const filePath = join(BEATS_DIR, uniqueName);

    await writeFile(filePath, buffer);

    return `${URL_PREFIX}/${uniqueName}`;
  },

  async deleteFile(url: string): Promise<void> {
    // Extract filename from URL: /beats/12345-beat.mp3 → 12345-beat.mp3
    const filename = url.split('/').pop();
    if (!filename) return;

    const filePath = join(BEATS_DIR, filename);

    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  },
};
