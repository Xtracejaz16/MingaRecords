// apps/backend/src/modules/beatmaker/beatmaker.types.ts

export interface UpdateBeatmakerProfileDto {
  profileImage?: string;
  genre?: string;
  artistName?: string;
}

export interface BeatmakerProfileResponse {
  id: string;
  alias: string;
  email: string;
  artistName: string | null;
  genre: string | null;
  profileImage: string | null;
  role: string;
}
