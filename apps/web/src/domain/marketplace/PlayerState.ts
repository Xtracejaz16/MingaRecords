import type { Beat } from './Beat';
import type { PlayerStatus } from './PlayerStatus';

export interface PlayerState {
  currentBeat: Beat | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  status: PlayerStatus;
}
