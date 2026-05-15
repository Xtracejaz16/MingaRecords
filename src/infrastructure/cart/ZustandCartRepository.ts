import { create } from 'zustand';
import type { CartRepository } from '../../domain/cart/CartRepository';
import type { CartItem } from '../../domain/cart/CartItem';

type InternalState = {
  items: CartItem[];
  setItems: (items: CartItem[]) => void;
};

const useInternalStore = create<InternalState>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
}));

export class ZustandCartRepository implements CartRepository {
  getItems(): CartItem[] {
    return useInternalStore.getState().items.slice();
  }

  addItem(item: CartItem): void {
    const state = useInternalStore.getState();
    const existing = state.items.find((i) => i.id === item.id);
    if (existing) {
      useInternalStore.setState({
        items: state.items.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i)),
      });
    } else {
      useInternalStore.setState({ items: [...state.items, item] });
    }
  }

  removeItem(beatId: string): void {
    const state = useInternalStore.getState();
    useInternalStore.setState({ items: state.items.filter((i) => i.beatId !== beatId) });
  }

  clearCart(): void {
    useInternalStore.setState({ items: [] });
  }

  getTotal(): number {
    return useInternalStore.getState().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  getItemCount(): number {
    return useInternalStore.getState().items.reduce((sum, item) => sum + item.quantity, 0);
  }
}

export function createZustandCartRepository() {
  return new ZustandCartRepository();
}
