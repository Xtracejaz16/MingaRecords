import { beforeEach, describe, expect, it } from 'vitest';
import type { CartItem } from '../../../domain/cart/CartItem';
import type { CartRepository } from '../../../domain/cart/CartRepository';
import { ProceedToCheckoutUseCase } from '../ProceedToCheckoutUseCase';

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
  quantity: 2,
};

describe('ProceedToCheckoutUseCase', () => {
  let repo: CartRepository;
  let useCase: ProceedToCheckoutUseCase;

  beforeEach(() => {
    repo = createRepository([sampleItem]);
    useCase = new ProceedToCheckoutUseCase(repo);
  });

  it('throws NOT_LOGGED_IN when session is null', () => {
    expect(() => useCase.execute(null)).toThrowError('NOT_LOGGED_IN');
    expect(repo.getItems()).toHaveLength(1);
  });

  it('throws NOT_ARTIST when session role is producer', () => {
    const session = {
      id: '1',
      identifier: 'prod@minga.com',
      alias: 'Productor',
      role: 'producer' as const,
      createdAt: new Date().toISOString(),
    };

    expect(() => useCase.execute(session)).toThrowError('NOT_ARTIST');
    expect(repo.getItems()).toHaveLength(1);
  });

  it('returns success with total and clears cart for artist', () => {
    const session = {
      id: '2',
      identifier: 'artist@minga.com',
      alias: 'Artista',
      role: 'artist' as const,
      createdAt: new Date().toISOString(),
    };

    const result = useCase.execute(session);

    expect(result).toEqual({ success: true, total: 58 });
    expect(repo.getItems()).toEqual([]);
  });
});
