import { describe, it, expect } from 'vitest';
import type { StorageProvider } from '@/modules/beats/storage.js';

describe('StorageProvider interface', () => {
  it('should define uploadFile that accepts buffer and returns URL', () => {
    // Type-level test: if this compiles, the interface is correct
    const mockProvider: StorageProvider = {
      async uploadFile(buffer, filename, mimetype) {
        return `/beats/${filename}`;
      },
      async deleteFile(url) {},
    };

    expect(typeof mockProvider.uploadFile).toBe('function');
    expect(typeof mockProvider.deleteFile).toBe('function');
  });

  it('should define uploadFile signature with correct parameters', async () => {
    const calls: Array<{ buffer: Buffer; filename: string; mimetype: string }> = [];
    const mockProvider: StorageProvider = {
      async uploadFile(buffer, filename, mimetype) {
        calls.push({ buffer, filename, mimetype });
        return `/beats/${filename}`;
      },
      async deleteFile(url) {},
    };

    const buffer = Buffer.from('audio-data');
    const result = await mockProvider.uploadFile(buffer, 'beat.mp3', 'audio/mpeg');

    expect(result).toBe('/beats/beat.mp3');
    expect(calls).toHaveLength(1);
    expect(calls[0].buffer).toBe(buffer);
    expect(calls[0].filename).toBe('beat.mp3');
    expect(calls[0].mimetype).toBe('audio/mpeg');
  });

  it('should define deleteFile that accepts a URL string', async () => {
    const deletedUrls: string[] = [];
    const mockProvider: StorageProvider = {
      async uploadFile(buffer, filename, mimetype) {
        return `/beats/${filename}`;
      },
      async deleteFile(url) {
        deletedUrls.push(url);
      },
    };

    await mockProvider.deleteFile('/beats/old-beat.mp3');
    expect(deletedUrls).toEqual(['/beats/old-beat.mp3']);
  });
});
