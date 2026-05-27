import { useEffect, useRef } from 'react';
import { HTMLAudioPlayerAdapter } from '../../../infrastructure/marketplace/HTMLAudioPlayerAdapter';
import { PlayBeatUseCase } from '../../../application/marketplace/PlayBeatUseCase';
import { usePlayerStore } from '../store/playerStore';
import type { Beat } from '../../../domain/marketplace/Beat';
import type { AudioPlayerRepository } from '../../../domain/marketplace/AudioPlayerRepository';

function createAudioPlayer(): AudioPlayerRepository {
  return new HTMLAudioPlayerAdapter();
}

export function useAudioPlayer() {
  const adapterRef = useRef<AudioPlayerRepository | null>(null);
  const useCaseRef = useRef<PlayBeatUseCase | null>(null);

  const setProgress = usePlayerStore((s) => s.setProgress);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const setStatus = usePlayerStore((s) => s.setStatus);
  const pauseBeat = usePlayerStore((s) => s.pauseBeat);

  // Initialize adapter and use case once
  if (!adapterRef.current) {
    adapterRef.current = createAudioPlayer();
    useCaseRef.current = new PlayBeatUseCase(adapterRef.current);
  }

  const adapter = adapterRef.current;
  const useCase = useCaseRef.current;

  // Wire audio events to store
  useEffect(() => {
    adapter.onTimeUpdate((time) => {
      setProgress(time);
    });

    adapter.onLoadedMetadata((duration) => {
      setDuration(duration);
      setStatus('playing');
    });

    adapter.onEnded(() => {
      pauseBeat();
      setStatus('ended');
    });

    adapter.onError(() => {
      setStatus('error');
    });

    return () => {
      adapter.cleanup();
    };
  }, [adapter, setProgress, setDuration, setStatus, pauseBeat]);

  const playBeat = async (beat: Beat) => {
    try {
      await useCase.execute(beat);
    } catch (error) {
      if (error instanceof Error && error.message === 'MISSING_AUDIO_URL') {
        return;
      }
      setStatus('error');
    }
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
    seek,
    setVolume,
    toggleMute,
  };
}
