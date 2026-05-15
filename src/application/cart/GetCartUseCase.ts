import type { CartRepository } from '../../domain/cart/CartRepository';
import type { CartItem } from '../../domain/cart/CartItem';

export class GetCartUseCase {
  private readonly repo: CartRepository;

  constructor(repo: CartRepository) {
    this.repo = repo;
  }

  execute(): CartItem[] {
    return this.repo.getItems();
  }
}
