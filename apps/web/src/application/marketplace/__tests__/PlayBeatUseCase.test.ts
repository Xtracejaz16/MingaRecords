import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AudioPlayerRepository } from '../../../domain/marketplace/AudioPlayerRepository';
import type { Beat } from '../../../domain/marketplace/Beat';
import { PlayBeatUseCase } from '../PlayBeatUseCase';

function createMockAudioRepo(): AudioPlayerRepository {
  return {
    load: vi.fn(),
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
    toggleMute: vi.fn(),
    getCurrentTime: vi.fn().mockReturnValue(0),
    getDuration: vi.fn().mockReturnValue(0),
    onTimeUpdate: vi.fn(),
    onLoadedMetadata: vi.fn(),
    onEnded: vi.fn(),
    onError: vi.fn(),
    cleanup: vi.fn(),
  };
}

const sampleBeat: Beat = {
  id: 'beat-1',
  title: 'Test Beat',
  artist: 'Test Artist',
  genre: 'CUMBIA',
  genreColor: '#C8860A',
  price: 29_999,
  coverUrl: '',
  audioUrl: 'https://example.com/audio.mp3',
};

describe('PlayBeatUseCase', () => {
  let audioRepo: AudioPlayerRepository;
  let useCase: PlayBeatUseCase;

  beforeEach(() => {
    audioRepo = createMockAudioRepo();
    useCase = new PlayBeatUseCase(audioRepo);
  });

  it('throws MISSING_AUDIO_URL when audioUrl is empty', async () => {
    const beatWithoutUrl: Beat = { ...sampleBeat, audioUrl: '' };
    await expect(useCase.execute(beatWithoutUrl)).rejects.toThrow('MISSING_AUDIO_URL');
  });

  it('calls load then play in order', async () => {
    await useCase.execute(sampleBeat);

    expect(audioRepo.load).toHaveBeenCalledWith(sampleBeat.audioUrl);
    expect(audioRepo.play).toHaveBeenCalled();

    // load must be called before play
    const loadOrder = vi.mocked(audioRepo.load).mock.invocationCallOrder[0];
    const playOrder = vi.mocked(audioRepo.play).mock.invocationCallOrder[0];
    expect(loadOrder).toBeLessThan(playOrder);
  });
});
