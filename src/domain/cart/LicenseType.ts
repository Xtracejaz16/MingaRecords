export type LicenseType = 'semilla' | 'raiz' | 'ceiba';

export const LICENSE_CONFIG: Record<
  LicenseType,
  {
    name: string;
    price: number;
    accentToken: 'neutral' | 'muiscaGold' | 'wayuuJade';
    features: string[];
    buttonLabel: string;
    recommended: boolean;
  }
> = {
  semilla: {
    name: 'SEMILLA',
    price: 29,
    accentToken: 'neutral',
    features: ['MP3 Lease', '10,000 Streams'],
    buttonLabel: 'SELECCIONAR',
    recommended: false,
  },
  raiz: {
    name: 'RAÍZ',
    price: 99,
    accentToken: 'muiscaGold',
    features: ['WAV + Trackouts', 'Unlimited Streams'],
    buttonLabel: 'SELECCIONAR',
    recommended: true,
  },
  ceiba: {
    name: 'CEIBA',
    price: 499,
    accentToken: 'wayuuJade',
    features: ['Exclusive Rights', 'Full Ownership'],
    buttonLabel: 'SELECCIONAR',
    recommended: false,
  },
} as const;
