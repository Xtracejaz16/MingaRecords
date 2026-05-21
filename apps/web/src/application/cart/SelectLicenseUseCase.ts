import type { AuthSession } from '../../domain/auth/entities/auth';
import type { CartRepository } from '../../domain/cart/CartRepository';
import type { CartItem } from '../../domain/cart/CartItem';

export class SelectLicenseUseCase {
  private readonly repo: CartRepository;

  constructor(repo: CartRepository) {
    this.repo = repo;
  }

  execute(input: { item: CartItem; session: AuthSession | null }): void {
    if (!input.session) {
      throw new Error('NOT_LOGGED_IN');
    }
    if (input.session.role !== 'artist') {
      throw new Error('NOT_ARTIST');
    }
    this.repo.addItem(input.item);
  }
}
