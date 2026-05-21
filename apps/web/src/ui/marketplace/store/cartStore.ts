import { create } from 'zustand';
import type { CartState } from '../../../application/cart/CartState';

// Re-export for backward compatibility during migration
export type { CartState } from '../../../application/cart/CartState';

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  selectedBeat: null,
  setSelectedBeat: (beat) => set({ selectedBeat: beat }),
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
