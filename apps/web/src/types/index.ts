// MINGA RECORDS TypeScript Types

export interface Beat {
  id: string;
  title: string;
  genre: string;
  price: number;
  imageUrl: string;
}

export interface Producer {
  id: string;
  name: string;
  region: string;
  imageUrl: string;
  rotationSpeed?: number;
  rotationDirection?: 'normal' | 'reverse';
}

export interface PricingTier {
  id: 'semilla' | 'raiz' | 'ceiba';
  name: string;
  price: number;
  description: string;
  features: string[];
  featured?: boolean;
}

export interface Stat {
  value: string;
  label: string;
}

export interface FlowItem {
  icon: 'star' | 'music';
  title: string;
  description: string;
}

// Theme colors (for reference)
export const THEME_COLORS = {
  obsidian: '#0F0A00',
  muiscaGold: '#C8860A',
  taironaTerracotta: '#8B2500',
  koguiCream: '#F2E8D0',
  zenuCopper: '#B5651D',
  emberaNavy: '#1A2340',
  wayuuJade: '#1A7A6E',
} as const;

// Fonts
export const FONTS = {
  cinzel: 'Cinzel, serif',
  crimson: 'Crimson Pro, serif',
} as const;