import { useMemo } from 'react';
import { createZustandCartRepository } from '../../../infrastructure/cart/ZustandCartRepository';
import { GetCartUseCase } from '../../../application/cart/GetCartUseCase';
import type { CartRepository } from '../../../domain/cart/CartRepository';

export function useCart(repository?: CartRepository) {
  const repo = repository ?? useMemo(() => createZustandCartRepository(), []);
  const getCart = useMemo(() => new GetCartUseCase(repo), [repo]);

  return {
    getItems: () => getCart.execute(),
    addItem: (item: any) => repo.addItem(item),
    removeItem: (id: string) => repo.removeItem(id),
    getTotal: () => repo.getTotal(),
  };
}
