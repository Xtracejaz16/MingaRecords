import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HTMLAudioPlayerAdapter } from '../HTMLAudioPlayerAdapter';

// Store event listeners so we can trigger them in tests
const eventListeners: Record<string, Function> = {};

// Mock HTMLAudioElement
const mockAudio = {
  src: '',
  volume: 1,
  muted: false,
  currentTime: 0,
  duration: 100,
  preload: '',
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  load: vi.fn(),
  addEventListener: vi.fn((event: string, handler: Function) => {
    eventListeners[event] = handler;
  }),
  removeEventListener: vi.fn(),
};

vi.stubGlobal('Audio', vi.fn(() => mockAudio));

describe('HTMLAudioPlayerAdapter', () => {
  let adapter: HTMLAudioPlayerAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAudio.src = '';
    mockAudio.volume = 1;
    mockAudio.muted = false;
    mockAudio.currentTime = 0;
    mockAudio.duration = 100;
    // Clear stored event listeners between tests
    Object.keys(eventListeners).forEach((key) => delete eventListeners[key]);
    adapter = new HTMLAudioPlayerAdapter();
  });

  it('seek clamps to bounds', () => {
    mockAudio.duration = 100;
    adapter.seek(-10);
    expect(mockAudio.currentTime).toBe(0);

    adapter.seek(150);
    expect(mockAudio.currentTime).toBe(100);

    adapter.seek(50);
    expect(mockAudio.currentTime).toBe(50);
  });

  it('setVolume maps 0-100 to 0.0-1.0', () => {
    adapter.setVolume(0);
    expect(mockAudio.volume).toBe(0);

    adapter.setVolume(50);
    expect(mockAudio.volume).toBe(0.5);

    adapter.setVolume(100);
    expect(mockAudio.volume).toBe(1);

    adapter.setVolume(150);
    expect(mockAudio.volume).toBe(1);

    adapter.setVolume(-10);
    expect(mockAudio.volume).toBe(0);
  });

  it('queues seek when duration is NaN and applies on loadedmetadata', () => {
    // Register for loadedmetadata so the adapter sets up its listener
    adapter.onLoadedMetadata(vi.fn());

    mockAudio.duration = NaN;
    adapter.seek(50);
    // currentTime should remain unchanged because duration is NaN
    expect(mockAudio.currentTime).toBe(0);

    // Set valid duration and simulate loadedmetadata event
    mockAudio.duration = 100;
    eventListeners['loadedmetadata']();

    // pendingSeek should have been applied: currentTime should be 50
    expect(mockAudio.currentTime).toBe(50);
  });

  it('replaces pending seek on subsequent calls before metadata loads', () => {
    adapter.onLoadedMetadata(vi.fn());

    mockAudio.duration = NaN;
    adapter.seek(10);
    adapter.seek(80); // Should replace the first seek
    expect(mockAudio.currentTime).toBe(0);

    mockAudio.duration = 100;
    eventListeners['loadedmetadata']();

    // Only the last seek value (80) should be applied
    expect(mockAudio.currentTime).toBe(80);
  });

  it('cleanup removes listeners', () => {
    adapter.cleanup();

    expect(mockAudio.removeEventListener).toHaveBeenCalledWith('timeupdate', expect.any(Function));
    expect(mockAudio.removeEventListener).toHaveBeenCalledWith('loadedmetadata', expect.any(Function));
    expect(mockAudio.removeEventListener).toHaveBeenCalledWith('ended', expect.any(Function));
    expect(mockAudio.removeEventListener).toHaveBeenCalledWith('error', expect.any(Function));
  });
});
