import type { CartRepository } from '../../domain/cart/CartRepository';
import type { CartItem } from '../../domain/cart/CartItem';

export class GetCartUseCase {
  constructor(private readonly repo: CartRepository) {}

  execute(): CartItem[] {
    return this.repo.getItems();
  }
}
