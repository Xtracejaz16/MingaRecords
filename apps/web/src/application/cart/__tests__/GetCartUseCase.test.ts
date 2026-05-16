import { beforeEach, describe, expect, it } from 'vitest';
import type { CartItem } from '../../../domain/cart/CartItem';
import type { CartRepository } from '../../../domain/cart/CartRepository';
import { GetCartUseCase } from '../GetCartUseCase';

function createRepository(initialItems: CartItem[] = []): CartRepository {
  const items = [...initialItems];

  return {
    getItems: () => [...items],
    addItem: (item) => {
      const existing = items.find((i) => i.beatId === item.beatId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        items.push({ ...item });
      }
    },
    removeItem: (beatId) => {
      const index = items.findIndex((i) => i.beatId === beatId);
      if (index !== -1) items.splice(index, 1);
    },
    clearCart: () => {
      items.length = 0;
    },
    getTotal: () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    getItemCount: () => items.reduce((sum, i) => sum + i.quantity, 0),
  };
}

const sampleItem: CartItem = {
  id: 'cart-1',
  beatId: 'beat-001',
  beatTitle: 'Noche de Luna',
  producerName: 'DJ Kogui',
  coverUrl: '/covers/luna.jpg',
  price: 29,
  licenseType: 'semilla',
  quantity: 1,
};

const sampleItemB: CartItem = {
  id: 'cart-2',
  beatId: 'beat-002',
  beatTitle: 'Ritmo Selvático',
  producerName: 'DJ Wayuu',
  coverUrl: '/covers/selva.jpg',
  price: 99,
  licenseType: 'raiz',
  quantity: 2,
};

describe('GetCartUseCase', () => {
  let repo: CartRepository;
  let useCase: GetCartUseCase;

  beforeEach(() => {
    repo = createRepository();
    useCase = new GetCartUseCase(repo);
  });

  it('returns an empty array when the cart is empty', () => {
    const result = useCase.execute();

    expect(result).toEqual([]);
  });

  it('returns all items from the repository', () => {
    repo = createRepository([sampleItem, sampleItemB]);
    useCase = new GetCartUseCase(repo);

    const result = useCase.execute();

    expect(result).toHaveLength(2);
    expect(result[0].beatId).toBe('beat-001');
    expect(result[1].beatId).toBe('beat-002');
  });
});
