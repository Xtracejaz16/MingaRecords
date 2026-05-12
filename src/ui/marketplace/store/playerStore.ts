import { create } from 'zustand';
import type { Beat } from '../../../domain/marketplace/Beat';

export interface PlayerState {
  currentBeat: Beat | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  playBeat: (beat: Beat) => void;
  pauseBeat: () => void;
  resumeBeat: () => void;
  setProgress: (progress: number) => void;
  setVolume: (volume: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  currentBeat: null,
  isPlaying: false,
  progress: 0,
  duration: 202, // 3:22 in seconds
  volume: 66,
  playBeat: (beat) => set({ currentBeat: beat, isPlaying: true, progress: 0 }),
  pauseBeat: () => set({ isPlaying: false }),
  resumeBeat: () => set({ isPlaying: true }),
  setProgress: (progress) => set({ progress }),
  setVolume: (volume) => set({ volume }),
}));
