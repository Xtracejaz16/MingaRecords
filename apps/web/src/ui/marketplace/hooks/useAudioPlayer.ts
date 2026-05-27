import { useEffect } from 'react';
import { HTMLAudioPlayerAdapter } from '../../../infrastructure/marketplace/HTMLAudioPlayerAdapter';
import { PlayBeatUseCase } from '../../../application/marketplace/PlayBeatUseCase';
import { usePlayerStore } from '../store/playerStore';
import type { Beat } from '../../../domain/marketplace/Beat';

// Singleton: shared adapter instance across all components
const adapter = new HTMLAudioPlayerAdapter();
const useCase = new PlayBeatUseCase(adapter);

export function useAudioPlayer() {

  const setProgress = usePlayerStore((s) => s.setProgress);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const setStatus = usePlayerStore((s) => s.setStatus);
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying);
  const pauseBeat = usePlayerStore((s) => s.pauseBeat);

  // Wire audio events to store
  useEffect(() => {
    adapter.onTimeUpdate((time) => {
      setProgress(time);
    });

    adapter.onLoadedMetadata((duration) => {
      setDuration(duration);
      setIsPlaying(true);
      setStatus('playing');
    });

    adapter.onEnded(() => {
      setIsPlaying(false);
      pauseBeat();
      setStatus('ended');
    });

    adapter.onError(() => {
      setStatus('error');
    });

    return () => {
      adapter.cleanup();
    };
  }, [setProgress, setDuration, setStatus, setIsPlaying, pauseBeat]);

  const setCurrentBeat = usePlayerStore((s) => s.setCurrentBeat);

  const playBeat = async (beat: Beat) => {
    setCurrentBeat(beat);
    setStatus('loading');
    try {
      await useCase.execute(beat);
    } catch (error) {
      if (error instanceof Error && error.message === 'MISSING_AUDIO_URL') {
        return;
      }
      setStatus('error');
    }
  };

  const pause = () => {
    adapter.pause();
    usePlayerStore.getState().pauseBeat();
  };

  const resume = () => {
    adapter.play().catch(() => {
      usePlayerStore.getState().setStatus('error');
    });
    usePlayerStore.getState().resumeBeat();
  };

  const seek = (time: number) => {
    adapter.seek(time);
  };

  const setVolume = (value: number) => {
    adapter.setVolume(value);
    usePlayerStore.getState().setVolume(value);
  };

  const toggleMute = () => {
    adapter.toggleMute();
    usePlayerStore.getState().toggleMute();
  };

  return {
    playBeat,
    pause,
    resume,
    seek,
    setVolume,
    toggleMute,
  };
}
