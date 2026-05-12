import type { AuthSession } from '../../domain/auth/entities/auth';
import type { CartRepository } from '../../domain/cart/CartRepository';

export class ProceedToCheckoutUseCase {
  constructor(private readonly repo: CartRepository) {}

  execute(session: AuthSession | null): { success: boolean; total: number } {
    if (!session) {
      throw new Error('NOT_LOGGED_IN');
    }
    if (session.role !== 'artist') {
      throw new Error('NOT_ARTIST');
    }
    const total = this.repo.getTotal();
    this.repo.clearCart();
    return { success: true, total };
  }
}
