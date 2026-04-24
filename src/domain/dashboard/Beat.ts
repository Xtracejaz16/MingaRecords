export const BEAT_STATUS = {
  PUBLIC: 'public',
  DRAFT: 'draft',
} as const;

export type BeatStatus = (typeof BEAT_STATUS)[keyof typeof BEAT_STATUS];

export interface Beat {
  id: string;
  title: string;
  genre: string;
  status: BeatStatus;
  priceCOP: number;
  coverUrl: string;
}
