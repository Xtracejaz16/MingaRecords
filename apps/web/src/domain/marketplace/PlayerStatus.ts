export const PLAYER_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  PLAYING: 'playing',
  PAUSED: 'paused',
  ENDED: 'ended',
  ERROR: 'error',
} as const;

export type PlayerStatus = (typeof PLAYER_STATUS)[keyof typeof PLAYER_STATUS];
