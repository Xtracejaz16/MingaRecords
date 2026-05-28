import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAudioPlayer } from '../useAudioPlayer';
import { usePlayerStore } from '../../store/playerStore';

vi.mock('../../../../infrastructure/marketplace/HTMLAudioPlayerAdapter', () => {
  return {
    HTMLAudioPlayerAdapter: vi.fn().mockImplementation(() => ({
      load: vi.fn(),
      play: vi.fn().mockResolvedValue(undefined),
      pause: vi.fn(),
      seek: vi.fn(),
      setVolume: vi.fn(),
      toggleMute: vi.fn(),
      getCurrentTime: vi.fn().mockReturnValue(0),
      getDuration: vi.fn().mockReturnValue(100),
      onTimeUpdate: vi.fn(),
      onLoadedMetadata: vi.fn(),
      onEnded: vi.fn(),
      onError: vi.fn(),
      cleanup: vi.fn(),
    })),
  };
});

describe('useAudioPlayer', () => {
  beforeEach(() => {
    usePlayerStore.setState({
      currentBeat: null,
      isPlaying: false,
      progress: 0,
      duration: 0,
      volume: 66,
      isMuted: false,
      status: 'idle',
    });
  });

  it('returns playBeat, seek, setVolume, toggleMute', () => {
    const { result } = renderHook(() => useAudioPlayer());

    expect(result.current.playBeat).toBeInstanceOf(Function);
    expect(result.current.seek).toBeInstanceOf(Function);
    expect(result.current.setVolume).toBeInstanceOf(Function);
    expect(result.current.toggleMute).toBeInstanceOf(Function);
  });

  it('toggleMute updates store', () => {
    const { result } = renderHook(() => useAudioPlayer());

    act(() => {
      result.current.toggleMute();
    });

    expect(usePlayerStore.getState().isMuted).toBe(true);

    act(() => {
      result.current.toggleMute();
    });

    expect(usePlayerStore.getState().isMuted).toBe(false);
  });

  it('setVolume updates store', () => {
    const { result } = renderHook(() => useAudioPlayer());

    act(() => {
      result.current.setVolume(75);
    });

    expect(usePlayerStore.getState().volume).toBe(75);
  });
});
