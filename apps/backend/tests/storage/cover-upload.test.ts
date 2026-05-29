import { describe, it, expect, vi } from 'vitest';
import { StorageService } from '../../src/modules/storage/service.js';

const mockAdapter = {
  upload: vi.fn().mockResolvedValue({ key: 'covers/u1/b1/cover.jpg', url: '/uploads/covers/u1/b1/cover.jpg' }),
  getDownloadUrl: vi.fn().mockResolvedValue('https://signed-url.com/cover.jpg'),
  delete: vi.fn().mockResolvedValue(undefined),
};

const service = new StorageService(mockAdapter);

describe('StorageService — uploadCover', () => {
  it('should upload valid JPEG cover', async () => {
    const file = { mimetype: 'image/jpeg', size: 1024 * 1024, originalname: 'cover.jpg', buffer: Buffer.from('') } as any;
    const result = await service.uploadCover(file, 'beat-1', 'user-1');
    expect(result.key).toContain('covers');
    expect(result.url).toContain('/uploads/covers/');
  });

  it('should upload valid PNG cover', async () => {
    const file = { mimetype: 'image/png', size: 2 * 1024 * 1024, originalname: 'cover.png', buffer: Buffer.from('') } as any;
    const result = await service.uploadCover(file, 'beat-1', 'user-1');
    expect(result.key).toContain('covers');
  });

  it('should upload valid WebP cover', async () => {
    const file = { mimetype: 'image/webp', size: 512 * 1024, originalname: 'cover.webp', buffer: Buffer.from('') } as any;
    const result = await service.uploadCover(file, 'beat-1', 'user-1');
    expect(result.key).toContain('covers');
  });

  it('should upload valid GIF cover', async () => {
    const file = { mimetype: 'image/gif', size: 500 * 1024, originalname: 'cover.gif', buffer: Buffer.from('') } as any;
    const result = await service.uploadCover(file, 'beat-1', 'user-1');
    expect(result.key).toContain('covers');
  });

  it('should reject audio files for cover upload', async () => {
    const file = { mimetype: 'audio/mpeg', size: 1024, originalname: 'beat.mp3', buffer: Buffer.from('') } as any;
    await expect(service.uploadCover(file, 'beat-1', 'user-1')).rejects.toThrow('INVALID_FILE_TYPE');
  });

  it('should reject files over 10MB', async () => {
    const file = { mimetype: 'image/jpeg', size: 11 * 1024 * 1024, originalname: 'huge.jpg', buffer: Buffer.from('') } as any;
    await expect(service.uploadCover(file, 'beat-1', 'user-1')).rejects.toThrow('FILE_TOO_LARGE');
  });

  it('should reject unknown image types', async () => {
    const file = { mimetype: 'image/bmp', size: 1024, originalname: 'cover.bmp', buffer: Buffer.from('') } as any;
    await expect(service.uploadCover(file, 'beat-1', 'user-1')).rejects.toThrow('INVALID_FILE_TYPE');
  });
});
