import type { CartItem } from '../../domain/cart/CartItem';
import type { Beat } from '../../domain/marketplace/Beat';

/**
 * Contract for the cart Zustand store.
 *
 * Extracted from `ui/marketplace/store/cartStore` so that
 * infrastructure adapters can depend on `application/` instead of `ui/`,
 * preserving the hexagonal dependency rule.
 */
export interface CartState {
  items: CartItem[];
  selectedBeat: Beat | null;
  addItem: (item: CartItem) => void;
  removeItem: (beatId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  setSelectedBeat: (beat: Beat | null) => void;
}
