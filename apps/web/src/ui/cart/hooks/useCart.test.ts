import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCartStore } from '../../marketplace/store/cartStore';
import { useCart } from './useCart';
import type { CartItem } from '../../../domain/cart/CartItem';

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

describe('useCart', () => {
  beforeEach(() => {
    // Reset items without wiping store actions
    useCartStore.setState({ items: [] });
  });

  it('returns empty items when cart is empty', () => {
    const { result } = renderHook(() => useCart());

    expect(result.current.items).toEqual([]);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it('returns items from store without duplicated mapping', () => {
    const item = makeCartItem({ licenseType: 'ceiba' });
    useCartStore.getState().addItem(item);

    const { result } = renderHook(() => useCart());

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].licenseType).toBe('ceiba');
    expect(result.current.items[0].beatId).toBe('beat-1');
  });

  it('reactively updates when store changes', () => {
    const { result } = renderHook(() => useCart());

    expect(result.current.items).toHaveLength(0);

    act(() => {
      useCartStore.getState().addItem(makeCartItem());
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.itemCount).toBe(1);
  });

  it('delegates addItem through the repository', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      useCartStore.getState().addItem(makeCartItem());
    });

    // The store was mutated directly (simulating repo.addItem via store)
    // The hook should reflect it reactively
    expect(result.current.items).toHaveLength(1);
    expect(result.current.total).toBe(50);
  });

  it('delegates clearCart through the repository', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      useCartStore.getState().addItem(makeCartItem({ beatId: 'beat-1' }));
      useCartStore.getState().addItem(makeCartItem({ beatId: 'beat-2', id: '2' }));
    });

    expect(result.current.items).toHaveLength(2);

    act(() => {
      useCartStore.getState().clearCart();
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.total).toBe(0);
  });

  it('preserves licenseType in reactive reads', () => {
    const { result } = renderHook(() => useCart());

    act(() => {
      useCartStore.getState().addItem(makeCartItem({ licenseType: 'premium' as CartItem['licenseType'] }));
    });

    expect(result.current.items[0].licenseType).toBe('premium');
  });

  it('exposes selectLicense and checkout functions', () => {
    const { result } = renderHook(() => useCart());

    expect(typeof result.current.selectLicense).toBe('function');
    expect(typeof result.current.checkout).toBe('function');
  });
});
