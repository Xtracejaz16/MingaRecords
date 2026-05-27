import { describe, it, expect, vi } from 'vitest';
import { StorageService } from '../../src/modules/storage/service.js';

const mockAdapter = {
  upload: vi.fn().mockResolvedValue({ key: 'beats/u1/b1/file.mp3', url: 'https://cdn/file.mp3' }),
  getDownloadUrl: vi.fn().mockResolvedValue('https://signed-url.com/file.mp3'),
  delete: vi.fn().mockResolvedValue(undefined),
};

const service = new StorageService(mockAdapter);

describe('StorageService', () => {
  it('should upload valid mp3', async () => {
    const file = { mimetype: 'audio/mpeg', size: 1024, originalname: 'beat.mp3', buffer: Buffer.from('') } as any;
    const result = await service.uploadBeatFile(file, 'beat-1', 'user-1');
    expect(result.key).toContain('beats');
  });

  it('should reject invalid file type', async () => {
    const file = { mimetype: 'image/png', size: 1024, originalname: 'img.png', buffer: Buffer.from('') } as any;
    await expect(service.uploadBeatFile(file, 'beat-1', 'user-1')).rejects.toThrow('INVALID_FILE_TYPE');
  });

  it('should reject file over 50MB', async () => {
    const file = { mimetype: 'audio/mpeg', size: 51 * 1024 * 1024, originalname: 'big.mp3', buffer: Buffer.from('') } as any;
    await expect(service.uploadBeatFile(file, 'beat-1', 'user-1')).rejects.toThrow('FILE_TOO_LARGE');
  });

  it('should return signed download url', async () => {
    const url = await service.getDownloadUrl('beats/u1/b1/file.mp3');
    expect(url).toContain('https://');
  });
});
