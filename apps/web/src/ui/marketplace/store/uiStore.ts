import { create } from 'zustand';

export interface UIState {
  selectedGenre: string | null;
  searchQuery: string;
  favorites: string[];
  setSelectedGenre: (genre: string | null) => void;
  setSearchQuery: (query: string) => void;
  toggleFavorite: (beatId: string) => void;
  isFavorite: (beatId: string) => boolean;
}

export const useUIStore = create<UIState>((set, get) => ({
  selectedGenre: null,
  searchQuery: '',
  favorites: [],
  setSelectedGenre: (genre) => set({ selectedGenre: genre }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleFavorite: (beatId) => {
    const { favorites } = get();
    if (favorites.includes(beatId)) {
      set({ favorites: favorites.filter((id) => id !== beatId) });
    } else {
      set({ favorites: [...favorites, beatId] });
    }
  },
  isFavorite: (beatId) => get().favorites.includes(beatId),
}));
