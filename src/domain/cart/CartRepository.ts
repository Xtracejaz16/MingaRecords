import type { CartItem } from './CartItem';

export interface CartRepository {
  getItems(): CartItem[];
  addItem(item: CartItem): void;
  removeItem(beatId: string): void;
  clearCart(): void;
  getTotal(): number;
  getItemCount(): number;
}
