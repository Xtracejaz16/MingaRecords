import { useCallback } from 'react';
import { HTMLAudioPlayerAdapter } from '../../../infrastructure/marketplace/HTMLAudioPlayerAdapter';
import { PlayBeatUseCase } from '../../../application/marketplace/PlayBeatUseCase';
import { usePlayerStore } from '../store/playerStore';
import type { Beat } from '../../../domain/marketplace/Beat';
import type { AudioPlayerRepository } from '../../../domain/marketplace/AudioPlayerRepository';

// ── Singleton adapter ─────────────────────────────────────────────────────
// Tanto MarketplacePage como PersistentPlayer llaman a useAudioPlayer().
// Sin singleton, cada uno crea su propio <audio> — los controles de uno
// no afectan al otro. El adapter se crea una sola vez y los eventos se
// conectan durante la inicialización, no durante el render del hook.
let sharedAdapter: AudioPlayerRepository | null = null;

function getAdapter(): AudioPlayerRepository {
  if (!sharedAdapter) {
    sharedAdapter = new HTMLAudioPlayerAdapter();

    // Wire events UNA sola vez (al crear el singleton)
    sharedAdapter.onTimeUpdate((time) => {
      usePlayerStore.getState().setProgress(time);
    });

    sharedAdapter.onLoadedMetadata((duration) => {
      usePlayerStore.getState().setDuration(duration);
      usePlayerStore.getState().resumeBeat(); // ← isPlaying = true
    });

    sharedAdapter.onEnded(() => {
      usePlayerStore.getState().pauseBeat();
      usePlayerStore.getState().setStatus('ended');
    });

    sharedAdapter.onError(() => {
      usePlayerStore.getState().setStatus('error');
    });
  }
  return sharedAdapter;
}

let sharedUseCase: PlayBeatUseCase | null = null;

function getUseCase(): PlayBeatUseCase {
  if (!sharedUseCase) {
    sharedUseCase = new PlayBeatUseCase(getAdapter());
  }
  return sharedUseCase;
}

export function useAudioPlayer() {
  const playBeat = async (beat: Beat) => {
    usePlayerStore.getState().setCurrentBeat(beat);
    usePlayerStore.getState().setStatus('loading');
    try {
      await getUseCase().execute(beat);
    } catch (error) {
      if (error instanceof Error && error.message === 'MISSING_AUDIO_URL') {
        return;
      }
      usePlayerStore.getState().setStatus('error');
    }
  };

  const pause = useCallback(() => {
    getAdapter().pause();
    usePlayerStore.getState().pauseBeat();
  }, []);

  const resume = useCallback(() => {
    getAdapter().play().catch(() => {
      usePlayerStore.getState().setStatus('error');
    });
    usePlayerStore.getState().resumeBeat();
  }, []);

  const seek = useCallback((time: number) => {
    getAdapter().seek(time);
  }, []);

  const setVolume = useCallback((value: number) => {
    getAdapter().setVolume(value);
    usePlayerStore.getState().setVolume(value);
  }, []);

  const toggleMute = useCallback(() => {
    getAdapter().toggleMute();
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
