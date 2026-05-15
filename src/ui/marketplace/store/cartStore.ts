import { create } from 'zustand';
import type { CartItem } from '../../../domain/cart/CartItem';

export interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (beatId: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (item) => {
    const { items } = get();
    const existing = items.find((i) => i.beatId === item.beatId);
    if (existing) {
      set({
        items: items.map((i) =>
          i.beatId === item.beatId ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      set({ items: [...items, item] });
    }
  },
  removeItem: (beatId) => {
    set({ items: get().items.filter((item) => item.beatId !== beatId) });
  },
  clearCart: () => {
    set({ items: [] });
  },
  getTotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}));
