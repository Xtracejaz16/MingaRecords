import { beforeEach, describe, expect, it } from 'vitest';
import type { CartItem } from '../../../domain/cart/CartItem';
import type { CartRepository } from '../../../domain/cart/CartRepository';
import { SelectLicenseUseCase } from '../SelectLicenseUseCase';

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

describe('SelectLicenseUseCase', () => {
  let repo: CartRepository;
  let useCase: SelectLicenseUseCase;

  beforeEach(() => {
    repo = createRepository();
    useCase = new SelectLicenseUseCase(repo);
  });

  it('throws NOT_LOGGED_IN when session is null', () => {
    expect(() => useCase.execute({ item: sampleItem, session: null })).toThrowError('NOT_LOGGED_IN');
    expect(repo.getItems()).toEqual([]);
  });

  it('throws NOT_ARTIST when session role is producer', () => {
    const session = {
      id: '1',
      email: 'prod@minga.com',
      alias: 'Productor',
      role: 'producer' as const,
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };

    expect(() => useCase.execute({ item: sampleItem, session })).toThrowError('NOT_ARTIST');
    expect(repo.getItems()).toEqual([]);
  });

  it('calls repo.addItem when session role is artist', () => {
    const session = {
      id: '2',
      email: 'artist@minga.com',
      alias: 'Artista',
      role: 'artist' as const,
      emailVerified: false,
      createdAt: new Date().toISOString(),
    };

    useCase.execute({ item: sampleItem, session });

    const items = repo.getItems();
    expect(items).toHaveLength(1);
    expect(items[0].beatId).toBe('beat-001');
  });
});
