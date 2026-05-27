import { create } from 'zustand';
import type { Beat } from '../../../domain/marketplace/Beat';
import { PLAYER_STATUS, type PlayerStatus } from '../../../domain/marketplace/PlayerStatus';

export interface PlayerStoreState {
  currentBeat: Beat | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  status: PlayerStatus;
  playBeat: (beat: Beat) => void;
  pauseBeat: () => void;
  resumeBeat: () => void;
  setProgress: (progress: number) => void;
  setVolume: (volume: number) => void;
  setDuration: (duration: number) => void;
  setStatus: (status: PlayerStatus) => void;
  setCurrentBeat: (beat: Beat) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  toggleMute: () => void;
}

export const usePlayerStore = create<PlayerStoreState>((set) => ({
  currentBeat: null,
  isPlaying: false,
  progress: 0,
  duration: 0,
  volume: 66,
  isMuted: false,
  status: PLAYER_STATUS.IDLE,
  playBeat: (beat) =>
    set({
      currentBeat: beat,
      isPlaying: true,
      progress: 0,
      status: PLAYER_STATUS.LOADING,
    }),
  pauseBeat: () =>
    set({
      isPlaying: false,
      status: PLAYER_STATUS.PAUSED,
    }),
  resumeBeat: () =>
    set({
      isPlaying: true,
      status: PLAYER_STATUS.PLAYING,
    }),
  setProgress: (progress) => set({ progress }),
  setVolume: (volume) => set({ volume }),
  setDuration: (duration) => set({ duration }),
  setStatus: (status) => set({ status }),
  setCurrentBeat: (beat) => set({ currentBeat: beat }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
}));
