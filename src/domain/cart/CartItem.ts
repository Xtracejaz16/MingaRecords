import type { LicenseType } from './LicenseType';

export interface CartItem {
  id: string;
  beatId: string;
  beatTitle: string;
  producerName: string;
  coverUrl: string;
  price: number;
  licenseType: LicenseType;
  quantity: number;
}
