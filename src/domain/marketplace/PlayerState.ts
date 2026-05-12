import type { Beat } from './Beat';

export interface PlayerState {
  currentBeat: Beat | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
}
