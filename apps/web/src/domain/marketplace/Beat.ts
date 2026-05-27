export interface Beat {
  id: string;
  title: string;
  artist: string;
  genre: string;
  genreColor: string;
  price: number;
  coverUrl: string;
  isFavorite?: boolean;
  audioUrl: string;
}
