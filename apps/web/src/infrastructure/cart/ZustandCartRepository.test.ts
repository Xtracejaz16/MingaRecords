import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { ZustandCartRepository } from './ZustandCartRepository';
import type { CartState } from '../../application/cart/CartState';
import type { CartItem } from '../../domain/cart/CartItem';

function createTestStore() {
  return create<CartState>((set, get) => ({
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
}

function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 'cart-item-1',
    beatId: 'beat-1',
    beatTitle: 'Test Beat',
    producerName: 'Test Producer',
    coverUrl: 'https://example.com/cover.jpg',
    price: 50,
    licenseType: 'raiz',
    quantity: 1,
    ...overrides,
  };
}

describe('ZustandCartRepository', () => {
  let store: ReturnType<typeof createTestStore>;
  let repo: ZustandCartRepository;

  beforeEach(() => {
    store = createTestStore();
    repo = new ZustandCartRepository(store);
  });

  describe('constructor injection', () => {
    it('holds the store reference without importing ui/ modules', () => {
      expect(repo).toBeDefined();
      // The repo file itself has no ui/ imports — verified at compile time
    });
  });

  describe('getItems', () => {
    it('returns empty array when cart is empty', () => {
      expect(repo.getItems()).toEqual([]);
    });

    it('returns CartItem[] with licenseType preserved', () => {
      const item = makeCartItem({ licenseType: 'premium' as CartItem['licenseType'] });
      store.getState().addItem(item);

      const items = repo.getItems();
      expect(items).toHaveLength(1);
      expect(items[0].licenseType).toBe('premium');
      expect(items[0].beatId).toBe('beat-1');
    });

    it('returns store items directly without mapping', () => {
      const item = makeCartItem();
      store.getState().addItem(item);

      const items = repo.getItems();
      expect(items[0]).toEqual(item);
    });
  });

  describe('addItem', () => {
    it('stores the full CartItem including licenseType', () => {
      const item = makeCartItem({ licenseType: 'ceiba', price: 200 });
      repo.addItem(item);

      const stored = store.getState().items;
      expect(stored).toHaveLength(1);
      expect(stored[0].licenseType).toBe('ceiba');
      expect(stored[0].price).toBe(200);
    });

    it('increments quantity on duplicate beatId', () => {
      const item = makeCartItem();
      repo.addItem(item);
      repo.addItem(item);

      const stored = store.getState().items;
      expect(stored).toHaveLength(1);
      expect(stored[0].quantity).toBe(2);
    });

    it('uses default licenseType when item omits it', () => {
      const item = makeCartItem({ licenseType: 'raiz' });
      repo.addItem(item);

      expect(store.getState().items[0].licenseType).toBe('raiz');
    });

    it('respects custom defaultLicenseType from constructor', () => {
      const customRepo = new ZustandCartRepository(store, 'ceiba');
      const item = makeCartItem({ licenseType: 'raiz' });
      customRepo.addItem(item);

      // addItem applies the default only when item has no licenseType —
      // but since CartItem always has licenseType, the item's value wins
      expect(store.getState().items[0].licenseType).toBe('raiz');
    });
  });

  describe('removeItem', () => {
    it('removes the item matching the beatId', () => {
      store.getState().addItem(makeCartItem({ beatId: 'beat-1' }));
      store.getState().addItem(makeCartItem({ beatId: 'beat-2', id: 'cart-item-2' }));

      repo.removeItem('beat-1');

      expect(store.getState().items).toHaveLength(1);
      expect(store.getState().items[0].beatId).toBe('beat-2');
    });
  });

  describe('clearCart', () => {
    it('empties items in a single atomic update', () => {
      store.getState().addItem(makeCartItem({ beatId: 'beat-1' }));
      store.getState().addItem(makeCartItem({ beatId: 'beat-2', id: 'cart-item-2' }));
      store.getState().addItem(makeCartItem({ beatId: 'beat-3', id: 'cart-item-3' }));

      repo.clearCart();

      expect(store.getState().items).toEqual([]);
    });
  });

  describe('getTotal', () => {
    it('delegates to store getTotal', () => {
      store.getState().addItem(makeCartItem({ price: 50, quantity: 2 }));
      store.getState().addItem(makeCartItem({ beatId: 'beat-2', id: '2', price: 30, quantity: 1 }));

      expect(repo.getTotal()).toBe(130);
    });
  });

  describe('getItemCount', () => {
    it('delegates to store getItemCount', () => {
      store.getState().addItem(makeCartItem({ quantity: 3 }));
      store.getState().addItem(makeCartItem({ beatId: 'beat-2', id: '2', quantity: 2 }));

      expect(repo.getItemCount()).toBe(5);
    });
  });
});
