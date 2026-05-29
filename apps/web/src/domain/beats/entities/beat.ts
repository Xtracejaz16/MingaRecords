export type BeatStatus =
  | 'draft'
  | 'pending_audio'
  | 'processing'
  | 'ready'
  | 'published'
  | 'sold'
  | 'archived'
  | 'deleted';

export interface Beat {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  priceCents: number;
  genre: string | null;
  bpm: number | null;
  key: string | null;
  tags: string[];
  audioUrl: string | null;
  coverUrl: string | null;
  previewUrl: string | null;
  streamUrl: string | null;
  playsCount: number;
  salesCount: number;
  status: BeatStatus;
  publishedAt: string | null;
  deletedAt: string | null;
  producerId: string;
  buyerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBeatInput {
  title: string;
  description?: string;
  priceCents: number;
  genre?: string;
  bpm?: number;
  key?: string;
  tags?: string[];
}

export interface UploadAudioInput {
  beatId: string;
  file: File;
}

export interface UploadCoverInput {
  beatId: string;
  file: File;
}
