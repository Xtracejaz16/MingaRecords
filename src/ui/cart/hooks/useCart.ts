import { useMemo } from 'react';
import { useCartStore } from '../../marketplace/store/cartStore';
import { ZustandCartRepository } from '../../../infrastructure/cart/ZustandCartRepository';
import { SelectLicenseUseCase } from '../../../application/cart/SelectLicenseUseCase';
import { ProceedToCheckoutUseCase } from '../../../application/cart/ProceedToCheckoutUseCase';
import type { AuthSession } from '../../../domain/auth/entities/auth';
import type { CartItem } from '../../../domain/cart/CartItem';

export function useCart() {
  const store = useCartStore;
  const repo = useMemo(() => new ZustandCartRepository(store), [store]);
  const selectLicense = useMemo(() => new SelectLicenseUseCase(repo), [repo]);
  const checkout = useMemo(() => new ProceedToCheckoutUseCase(repo), [repo]);

  // Reactive reads — store now holds CartItem[], no mapping needed
  const items = useCartStore((state) => state.items);
  const itemCount = useCartStore((state) => state.getItemCount());
  const total = useCartStore((state) => state.getTotal());

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
