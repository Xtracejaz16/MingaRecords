export type LicenseTypeValue = 'BASIC' | 'PREMIUM' | 'EXCLUSIVE';

export interface BeatLicense {
  id: string;
  type: LicenseTypeValue;
  priceCents: number;
  isActive: boolean;
  beatId: string;
  createdAt: string;
}

export const LICENSE_TYPE_INFO: Record<LicenseTypeValue, { displayName: string; description: string }> = {
  BASIC: { displayName: 'Básica', description: 'Uso no comercial, streams limitados' },
  PREMIUM: { displayName: 'Premium', description: 'Uso comercial, streams ilimitados' },
  EXCLUSIVE: { displayName: 'Exclusiva', description: 'Derechos exclusivos, propiedad total' },
};

export const PRICE_RANGES: Record<LicenseTypeValue, { minCents: number; maxCents: number }> = {
  BASIC: { minCents: 100, maxCents: 5000 },
  PREMIUM: { minCents: 2000, maxCents: 20000 },
  EXCLUSIVE: { minCents: 10000, maxCents: 200000 },
};

export function centsToDollars(cents: number): number {
  return cents / 100;
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function isPriceInRange(type: LicenseTypeValue, priceCents: number): boolean {
  const range = PRICE_RANGES[type];
  return priceCents >= range.minCents && priceCents <= range.maxCents;
}
