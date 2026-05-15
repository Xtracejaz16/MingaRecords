import type { Beat } from '../marketplace/Beat';
import type { CartItem } from './CartItem';
import type { LicenseType } from './LicenseType';

/**
 * Maps a marketplace Beat into a CartItem for the cart flow.
 *
 * This is a pure domain helper — no side effects, no store access.
 * Used by IntercambioPage for preview and by SelectLicenseUseCase for mutation.
 *
 * @param beat - The marketplace beat to convert
 * @param licenseType - The license plan selected by the user
 * @returns A CartItem with the beat's fields and the supplied licenseType
 */
export function buildCartItem(beat: Beat, licenseType: LicenseType): CartItem {
  return {
    id: `item-${beat.id}`,
    beatId: beat.id,
    beatTitle: beat.title,
    producerName: beat.artist,
    coverUrl: beat.coverUrl,
    price: beat.price,
    licenseType,
    quantity: 1,
  };
}
