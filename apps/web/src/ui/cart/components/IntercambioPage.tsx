import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { checkCartAccess } from '../hooks/useCartGuard';
import { useAppShell } from '../../app/hooks/useAppShell';
import { useCartStore } from '../../marketplace/store/cartStore';
import { buildCartItem } from '../../../domain/cart/buildCartItem';
import { LICENSE_CONFIG, type LicenseType } from '../../../domain/cart/LicenseType';
import type { CartItem } from '../../../domain/cart/CartItem';
import { TopNavBar } from '../../shared/components/TopNavBar';
import { PlanCard } from './PlanCard';
import { TheRitualSidebar } from './TheRitualSidebar';
import { EcoPlayer } from './EcoPlayer';
import { LoginRequiredModal, type LoginRequiredModalProps } from './LoginRequiredModal';
import { CartIconBadge } from './CartIconBadge';

const PLANS: LicenseType[] = ['semilla', 'raiz', 'ceiba'];

const NAV_ITEMS = [
  { label: 'Marketplace', icon: 'storefront', active: true },
  { label: 'Mis Compras', icon: 'shopping_bag', active: false },
  { label: 'Favoritos', icon: 'favorite', active: false },
  { label: 'Mi Perfil', icon: 'person', active: false },
] as const;

const FOOTER_ITEMS = [
  { label: 'Ajustes', icon: 'tune' },
  { label: 'Salir', icon: 'logout' },
] as const;

export function IntercambioPage() {
  const { session } = useAuth();
  const { items, itemCount, selectLicense, checkout } = useCart();
  const { navigateTo, handleLogout } = useAppShell();
  const selectedBeat = useCartStore((state) => state.selectedBeat);

  const [selectedPlan, setSelectedPlan] = useState<LicenseType | null>(null);
  const [modalVariant, setModalVariant] = useState<LoginRequiredModalProps['variant']>('not-logged-in-buy');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const guard = checkCartAccess(session);

  // Primary source: beat selected from MarketplacePage via cartStore
  // Fallback: first item already in cart (e.g. direct navigation)
  const rawCartItem = items.length > 0 ? items[0] : null;
  const selectedCartItem: CartItem | null = selectedBeat
    ? buildCartItem(selectedBeat, selectedPlan ?? 'semilla')
    : rawCartItem;
  const selectedPlanPrice = selectedPlan ? LICENSE_CONFIG[selectedPlan].price : 0;


  const handleSelectPlan = (plan: LicenseType) => {
    if (!guard.allowed) {
      const variant = guard.variant === 'not-logged-in' ? 'not-logged-in-buy' as const : 'wrong-role' as const;
      setModalVariant(variant);
      setIsModalOpen(true);
      return;
    }
    setSelectedPlan(plan);
    if (selectedCartItem && session) {
      const item = selectedBeat
        ? buildCartItem(selectedBeat, plan)
        : {
            ...selectedCartItem,
            price: LICENSE_CONFIG[plan].price,
            licenseType: plan,
          };
      selectLicense(item, session);
    }
  };

  const handleContinue = () => {
    if (!selectedPlan || !session) return;
    const result = checkout(session);
    if (result.success) {
      useCartStore.getState().setSelectedBeat(null);
      navigateTo('marketplace');
    }
  };

  return (
    <div className="bg-obsidian min-h-screen relative">
      {/* Background overlays */}
      <div className="fixed inset-0 pointer-events-none bg-[url('data:image/svg+xml,%3Csvg%20width=%2760%27%20height=%2760%27%20viewBox=%270%200%2060%2060%27%20xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath%20d=%27M30%200L60%2030L30%2060L0%2030L30%200ZM30%2010L50%2030L30%2050L10%2030L30%2010Z%27%20fill=%27%23C8860A%27%20fill-opacity=%270.04%27/%3E%3C/svg%3E')] opacity-20 z-0" />
      <div className="fixed inset-0 pointer-events-none mineral-grain z-0" />

      <TopNavBar />

      <div className="flex">
        {/* Left sidebar */}
        <aside className="w-64 fixed left-0 top-20 h-[calc(100vh-160px)] bg-surface/95 backdrop-blur-xl z-40 flex flex-col overflow-y-auto border-r border-outline/5">
          <div className="p-6 border-b border-outline/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 border border-muiscaGold/30 p-1 shrink-0">
                <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-muiscaGold">person</span>
                </div>
              </div>
              <div>
                <p className="font-display text-sm font-bold text-muiscaGold tracking-tighter">
                  {session?.alias ?? 'ARTISTA'}
                </p>
                <p className="font-body text-xs text-on-surface-variant italic">
                  {session?.role === 'artist' ? 'Minga Gold Member' : 'Productor'}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`w-full flex items-center gap-3 px-4 py-3 font-display text-xs tracking-widest uppercase cursor-pointer transition-colors ${
                  item.active
                    ? 'bg-taironaTerracotta/30 border-l-4 border-taironaTerracotta text-white'
                    : 'text-on-surface-variant hover:bg-surface-container-high/20 hover:text-wayuuJade'
                }`}
              >
                <span
                  className="material-symbols-outlined text-lg"
                  style={item.active ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {item.icon}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-outline/10 space-y-1">
            {FOOTER_ITEMS.map((item) => (
              <button
                key={item.label}
                type="button"
                className="w-full flex items-center gap-3 px-4 py-2 text-koguiCream/40 hover:text-koguiCream text-xs font-display tracking-widest uppercase cursor-pointer transition-colors"
                onClick={item.label === 'Salir' ? handleLogout : undefined}
              >
                <span className="material-symbols-outlined text-base">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <main className="ml-64 mr-96 pt-20 pb-24 px-12 flex-1">
          <header className="mb-12">
            <div className="flex items-center justify-between">
              <h1 className="font-display text-4xl tracking-widest uppercase text-koguiCream">
                EL INTERCAMBIO
              </h1>
              <CartIconBadge
                itemCount={itemCount}
                onClick={() => {}}
              />
            </div>
            <div className="h-px w-full bg-gradient-to-r from-wayuuJade via-muiscaGold to-zenuCopper mt-4 mb-6" />
            <p className="font-body italic text-on-surface-variant text-lg">
              Define la profundidad de tu conexión con la obra.
            </p>
          </header>

          {!selectedCartItem ? (
            <div className="flex flex-col items-center justify-center py-24 gap-6">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant/40">
                shopping_bag
              </span>
              <p className="font-display text-xl tracking-widest uppercase text-koguiCream">
                Tu carrito está vacío
              </p>
              <p className="font-body text-on-surface-variant text-sm">
                Explora los beats disponibles y elige tu licencia.
              </p>
              <button
                type="button"
                className="bg-muiscaGold text-obsidian font-display text-xs tracking-widest font-bold uppercase py-3 px-8 hover:opacity-90 transition-opacity cursor-pointer"
                onClick={() => navigateTo('marketplace')}
              >
                Explorar Beats
              </button>
            </div>
          ) : (
            <div className="flex gap-12">
              <section className="flex-1 space-y-6">
                {PLANS.map((plan) => (
                  <PlanCard
                    key={plan}
                    plan={plan}
                    isSelected={selectedPlan === plan}
                    onSelect={handleSelectPlan}
                  />
                ))}
              </section>

              <TheRitualSidebar
                selectedPlan={selectedPlan}
                cartItem={selectedCartItem}
                total={selectedPlanPrice}
                onContinue={handleContinue}
              />
            </div>
          )}

          <footer className="mt-auto pt-12 border-t border-outline-variant/10">
            <div className="flex flex-col items-center gap-4 text-[10px] tracking-[0.4em] font-display text-on-surface-variant uppercase">
              <div className="flex gap-6">
                <span className="hover:text-muiscaGold cursor-pointer">Minga License</span>
                <span className="text-outline-variant/30">|</span>
                <span className="hover:text-muiscaGold cursor-pointer">Support Portal</span>
                <span className="text-outline-variant/30">|</span>
                <span className="hover:text-muiscaGold cursor-pointer">Privacy</span>
                <span className="text-outline-variant/30">|</span>
                <span className="hover:text-muiscaGold cursor-pointer">Terms</span>
              </div>
              <span className="text-koguiCream/30">&copy; 2026 Minga Records. All rights reserved.</span>
            </div>
          </footer>
        </main>
      </div>

      <EcoPlayer
        currentBeat={selectedCartItem ? {
          title: selectedCartItem.beatTitle,
          artist: selectedCartItem.producerName,
          coverUrl: selectedCartItem.coverUrl,
          genre: 'AFROBEAT',
        } : undefined}
      />

      <LoginRequiredModal
        variant={modalVariant}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
