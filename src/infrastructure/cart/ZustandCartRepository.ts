import type { StoreApi } from 'zustand';
import type { CartRepository } from '../../domain/cart/CartRepository';
import type { CartItem } from '../../domain/cart/CartItem';
import type { LicenseType } from '../../domain/cart/LicenseType';
import type { CartState } from '../../ui/marketplace/store/cartStore';

/**
 * CartRepository implementation backed by a Zustand store.
 *
 * The store is injected via constructor — this class has NO direct import
 * from the UI layer, preserving the hexagonal dependency rule
 * (infrastructure must not import ui).
 */
export class ZustandCartRepository implements CartRepository {
  private readonly store: StoreApi<CartState>;
  private readonly defaultLicenseType: LicenseType;

  constructor(
    store: StoreApi<CartState>,
    defaultLicenseType: LicenseType = 'raiz',
  ) {
    this.store = store;
    this.defaultLicenseType = defaultLicenseType;
  }

  getItems(): CartItem[] {
    return this.store.getState().items;
  }

  addItem(item: CartItem): void {
    const resolved: CartItem = {
      ...item,
      licenseType: item.licenseType ?? this.defaultLicenseType,
    };
    this.store.getState().addItem(resolved);
  }

  removeItem(beatId: string): void {
    this.store.getState().removeItem(beatId);
  }

  clearCart(): void {
    this.store.getState().clearCart();
  }

  getTotal(): number {
    return this.store.getState().getTotal();
  }

  getItemCount(): number {
    return this.store.getState().getItemCount();
  }
}