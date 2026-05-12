import { useMemo } from 'react';
import { useCartStore } from '../../marketplace/store/cartStore';
import { ZustandCartRepository } from '../../../infrastructure/cart/ZustandCartRepository';
import { SelectLicenseUseCase } from '../../../application/cart/SelectLicenseUseCase';
import { ProceedToCheckoutUseCase } from '../../../application/cart/ProceedToCheckoutUseCase';
import type { AuthSession } from '../../../domain/auth/entities/auth';
import type { CartItem } from '../../../domain/cart/CartItem';

export function useCart() {
  const repo = useMemo(() => new ZustandCartRepository(), []);
  const selectLicense = useMemo(() => new SelectLicenseUseCase(repo), [repo]);
  const checkout = useMemo(() => new ProceedToCheckoutUseCase(repo), [repo]);

  const storeItems = useCartStore((state) => state.items);
  const itemCount = useCartStore((state) => state.getItemCount());
  const total = useCartStore((state) => state.getTotal());

  const items: CartItem[] = useMemo(
    () =>
      storeItems.map((storeItem, index) => ({
        id: `cart-item-${index}`,
        beatId: storeItem.beat.id,
        beatTitle: storeItem.beat.title,
        producerName: storeItem.beat.artist,
        coverUrl: storeItem.beat.coverUrl,
        price: storeItem.beat.price,
        licenseType: 'raiz' as const,
        quantity: storeItem.quantity,
      })),
    [storeItems]
  );

  return {
    items,
    itemCount,
    total,
    selectLicense: (item: CartItem, session: AuthSession | null) => {
      selectLicense.execute({ item, session });
    },
    checkout: (session: AuthSession | null) => {
      return checkout.execute(session);
    },
  };
}
