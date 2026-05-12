import type { CartRepository } from '../../domain/cart/CartRepository';
import type { CartItem } from '../../domain/cart/CartItem';
import type { Beat } from '../../domain/marketplace/Beat';
import { useCartStore } from '../../ui/marketplace/store/cartStore';

export class ZustandCartRepository implements CartRepository {
  getItems(): CartItem[] {
    const storeItems = useCartStore.getState().items;
    return storeItems.map((storeItem, index) => ({
      id: `cart-item-${index}`,
      beatId: storeItem.beat.id,
      beatTitle: storeItem.beat.title,
      producerName: storeItem.beat.artist,
      coverUrl: storeItem.beat.coverUrl,
      price: storeItem.beat.price,
      licenseType: 'raiz' as const,
      quantity: storeItem.quantity,
    }));
  }

  addItem(item: CartItem): void {
    const beat: Beat = {
      id: item.beatId,
      title: item.beatTitle,
      artist: item.producerName,
      genre: '',
      genreColor: '',
      price: item.price,
      coverUrl: item.coverUrl,
    };
    useCartStore.getState().addItem(beat);
  }

  removeItem(beatId: string): void {
    useCartStore.getState().removeItem(beatId);
  }

  clearCart(): void {
    const state = useCartStore.getState();
    state.items.forEach((item) => {
      state.removeItem(item.beat.id);
    });
  }

  getTotal(): number {
    return useCartStore.getState().getTotal();
  }

  getItemCount(): number {
    return useCartStore.getState().getItemCount();
  }
}
