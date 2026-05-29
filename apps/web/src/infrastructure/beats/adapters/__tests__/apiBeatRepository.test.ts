import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Need to mock localStorage for access token
const storage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage[key] ?? null,
  setItem: (key: string, value: string) => { storage[key] = value; },
  removeItem: (key: string) => { delete storage[key]; },
});

// This import must happen after mocks
const { ApiBeatRepository } = await import('../apiBeatRepository.js');

describe('ApiBeatRepository', () => {
  let repo: ApiBeatRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repo = new ApiBeatRepository();
  });

  describe('getBeats', () => {
    it('should fetch beats list and return data array', async () => {
      const mockResponse = {
        data: [{ id: '1', title: 'Test Beat', status: 'published' }],
        pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 },
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await repo.getBeats({});
      expect(result).toEqual(mockResponse);
      expect(mockFetch.mock.calls[0][0]).toContain('/api/v1/beats');
    });

    it('should throw on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      await expect(repo.getBeats({})).rejects.toThrow('Server error');
    });
  });

  describe('createBeat', () => {
    it('should POST beat metadata and return the created beat', async () => {
      const input = { title: 'New Beat', priceCents: 999, genre: 'Hip Hop' };
      const created: Record<string, unknown> = { id: '1', ...input, status: 'draft' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(created),
      });

      const result = await repo.createBeat(input);
      expect(result.id).toBe('1');
      expect(result.title).toBe('New Beat');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/beats'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
        }),
      );
    });
  });

  describe('deleteBeat', () => {
    it('should DELETE a beat by id', async () => {
      mockFetch.mockResolvedValueOnce({ ok: true });

      await expect(repo.deleteBeat('beat-1')).resolves.toBeUndefined();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/beats/beat-1'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
  });

  describe('uploadAudio', () => {
    it('should POST audio file as FormData', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ key: 'audio-key', url: '/url.mp3' }),
      });

      const file = new File([''], 'beat.mp3', { type: 'audio/mpeg' });
      const result = await repo.uploadAudio('beat-1', file);
      expect(result.key).toBe('audio-key');

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toContain('/api/v1/storage/upload/beat-1');
      expect(callArgs[1].method).toBe('POST');
      expect(callArgs[1].body).toBeInstanceOf(FormData);
    });
  });

  describe('uploadCover', () => {
    it('should POST cover image as FormData', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ key: 'cover-key', url: '/cover.jpg' }),
      });

      const file = new File([''], 'cover.jpg', { type: 'image/jpeg' });
      const result = await repo.uploadCover('beat-1', file);
      expect(result.key).toBe('cover-key');

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toContain('/api/v1/storage/cover/beat-1');
      expect(callArgs[1].body).toBeInstanceOf(FormData);
    });
  });
});
