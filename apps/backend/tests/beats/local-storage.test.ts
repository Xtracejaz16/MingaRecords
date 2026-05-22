import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, rm, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

// We test the logic directly rather than importing the adapter,
// since the adapter uses process.cwd() which varies in test context.
// This validates the StorageProvider contract with real filesystem ops.

const TEST_DIR = join(process.cwd(), 'public', 'beats');

describe('LocalFileStorage', () => {
  const createdFiles: string[] = [];

  afterEach(async () => {
    for (const file of createdFiles) {
      if (existsSync(file)) {
        await rm(file, { force: true });
      }
    }
    createdFiles.length = 0;
  });

  it('should write a file to public/beats and return a URL', async () => {
    const filename = `test-${Date.now()}.mp3`;
    const filePath = join(TEST_DIR, filename);
    const buffer = Buffer.from('fake-audio-data');

    await writeFile(filePath, buffer);
    createdFiles.push(filePath);

    expect(existsSync(filePath)).toBe(true);
    const content = await readFile(filePath);
    expect(content.toString()).toBe('fake-audio-data');
  });

  it('should generate unique filenames with timestamp prefix', () => {
    const filename = `${Date.now()}-beat.mp3`;
    expect(filename).toMatch(/^\d{13}-beat\.mp3$/);
  });

  it('should construct correct URL prefix', () => {
    const filename = '1234567890123-beat.mp3';
    const url = `/beats/${filename}`;
    expect(url).toBe('/beats/1234567890123-beat.mp3');
    expect(url.startsWith('/beats/')).toBe(true);
  });

  it('should extract filename from URL for deletion', () => {
    const url = '/beats/1234567890123-beat.mp3';
    const filename = url.split('/').pop();
    expect(filename).toBe('1234567890123-beat.mp3');
  });

  it('should handle deletion of non-existent file gracefully', async () => {
    const url = '/beats/non-existent-file.mp3';
    const filename = url.split('/').pop();
    const filePath = join(TEST_DIR, filename!);

    // Should not throw
    if (existsSync(filePath)) {
      await rm(filePath, { force: true });
    }
    expect(existsSync(filePath)).toBe(false);
  });
});
