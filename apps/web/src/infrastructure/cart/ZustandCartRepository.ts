import type { StoreApi } from 'zustand';
import type { CartRepository } from '../../domain/cart/CartRepository';
import type { CartItem } from '../../domain/cart/CartItem';
import type { LicenseType } from '../../domain/cart/LicenseType';
import type { CartState } from '../../application/cart/CartState';

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

  /** Returns all cart items as CartItem[]. No mapping — store holds CartItem directly. */
  getItems(): CartItem[] {
    return this.store.getState().items;
  }

  /** Adds a CartItem to the cart. If the beatId already exists, quantity is incremented. */
  addItem(item: CartItem): void {
    const resolved: CartItem = {
      ...item,
      licenseType: item.licenseType ?? this.defaultLicenseType,
    };
    this.store.getState().addItem(resolved);
  }

  /** Removes the cart entry matching the given beatId. */
  removeItem(beatId: string): void {
    this.store.getState().removeItem(beatId);
  }

  /** Empties the cart in a single atomic Zustand update. */
  clearCart(): void {
    this.store.getState().clearCart();
  }

  /** Returns the monetary total of all items in the cart. */
  getTotal(): number {
    return this.store.getState().getTotal();
  }

  /** Returns the sum of all item quantities. */
  getItemCount(): number {
    return this.store.getState().getItemCount();
  }
}
