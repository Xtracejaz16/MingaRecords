import { useMemo } from 'react';
import { createZustandCartRepository } from '../../../infrastructure/cart/ZustandCartRepository';
import { GetCartUseCase } from '../../../application/cart/GetCartUseCase';
import type { CartRepository } from '../../../domain/cart/CartRepository';
import type { CartItem } from '../../../domain/cart/CartItem';

export function useCart(repository?: CartRepository) {
  const createdRepo = useMemo(() => createZustandCartRepository(), []);
  const repo = repository ?? createdRepo;
  const repoMemo = useMemo(() => repo, [repo]);
  const getCart = useMemo(() => new GetCartUseCase(repoMemo), [repoMemo]);

  return {
    getItems: () => getCart.execute(),
    addItem: (item: CartItem) => repo.addItem(item),
    removeItem: (id: string) => repo.removeItem(id),
    getTotal: () => repo.getTotal(),
  };
}
