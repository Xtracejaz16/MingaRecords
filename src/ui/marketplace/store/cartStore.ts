import { create } from 'zustand';
import type { Beat } from '../../../domain/marketplace/Beat';

interface CartItem {
  beat: Beat;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  addItem: (beat: Beat) => void;
  removeItem: (beatId: string) => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (beat) => {
    const { items } = get();
    const existing = items.find((item) => item.beat.id === beat.id);
    if (existing) {
      set({
        items: items.map((item) =>
          item.beat.id === beat.id ? { ...item, quantity: item.quantity + 1 } : item
        ),
      });
    } else {
      set({ items: [...items, { beat, quantity: 1 }] });
    }
  },
  removeItem: (beatId) => {
    set({ items: get().items.filter((item) => item.beat.id !== beatId) });
  },
  getTotal: () => get().items.reduce((sum, item) => sum + item.beat.price * item.quantity, 0),
  getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}));
