import { useCallback, useEffect, useRef } from 'react';
import { HTMLAudioPlayerAdapter } from '../../../infrastructure/marketplace/HTMLAudioPlayerAdapter';
import { PlayBeatUseCase } from '../../../application/marketplace/PlayBeatUseCase';
import { usePlayerStore } from '../store/playerStore';
import type { Beat } from '../../../domain/marketplace/Beat';
import type { AudioPlayerRepository } from '../../../domain/marketplace/AudioPlayerRepository';

// ── Singleton adapter ─────────────────────────────────────────────────────
// Tanto MarketplacePage como PersistentPlayer llaman a useAudioPlayer().
// Sin singleton, cada uno crea su propio <audio> — los controles de uno
// no afectan al otro. El adapter se crea una sola vez y se comparte.
let sharedAdapter: AudioPlayerRepository | null = null;
let eventsWired = false;

function getAdapter(): AudioPlayerRepository {
  if (!sharedAdapter) {
    sharedAdapter = new HTMLAudioPlayerAdapter();
  }
  return sharedAdapter;
}

export function useAudioPlayer() {
  const adapter = getAdapter();

  // Wire events UNA sola vez (no importa cuántas veces llame useAudioPlayer)
  if (!eventsWired) {
    eventsWired = true;

    adapter.onTimeUpdate((time) => {
      usePlayerStore.getState().setProgress(time);
    });

    adapter.onLoadedMetadata((duration) => {
      usePlayerStore.getState().setDuration(duration);
      usePlayerStore.getState().resumeBeat(); // ← isPlaying = true
    });

    adapter.onEnded(() => {
      usePlayerStore.getState().pauseBeat();
      usePlayerStore.getState().setStatus('ended');
    });

    adapter.onError(() => {
      usePlayerStore.getState().setStatus('error');
    });
  }

  // useCase también singleton
  const useCaseRef = useRef<PlayBeatUseCase | null>(null);
  if (!useCaseRef.current) {
    useCaseRef.current = new PlayBeatUseCase(adapter);
  }

  const playBeat = async (beat: Beat) => {
    usePlayerStore.getState().setCurrentBeat(beat);
    usePlayerStore.getState().setStatus('loading');
    try {
      await useCaseRef.current!.execute(beat);
    } catch (error) {
      if (error instanceof Error && error.message === 'MISSING_AUDIO_URL') {
        return;
      }
      usePlayerStore.getState().setStatus('error');
    }
  };

  const pause = useCallback(() => {
    adapter.pause();
    usePlayerStore.getState().pauseBeat();
  }, []);

  const resume = useCallback(() => {
    adapter.play().catch(() => {
      usePlayerStore.getState().setStatus('error');
    });
    usePlayerStore.getState().resumeBeat();
  }, []);

  const seek = useCallback((time: number) => {
    adapter.seek(time);
  }, []);

  const setVolume = useCallback((value: number) => {
    adapter.setVolume(value);
    usePlayerStore.getState().setVolume(value);
  }, []);

  const toggleMute = useCallback(() => {
    adapter.toggleMute();
    usePlayerStore.getState().toggleMute();
  }, []);

  return {
    playBeat,
    pause,
    resume,
    seek,
    setVolume,
    toggleMute,
  };
}
