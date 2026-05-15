import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { checkCartAccess } from '../hooks/useCartGuard';
import { useAppShell } from '../../app/hooks/useAppShell';
import { LICENSE_CONFIG, type LicenseType } from '../../../domain/cart/LicenseType';
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
  const { items, itemCount, checkout } = useCart();
  const { navigateTo, handleLogout } = useAppShell();

  const [selectedPlan, setSelectedPlan] = useState<LicenseType | null>(null);
  const [modalVariant, setModalVariant] = useState<LoginRequiredModalProps['variant']>('not-logged-in-buy');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const guard = checkCartAccess(session);
  const selectedCartItem = items.length > 0 ? items[0] : null;
  const selectedPlanPrice = selectedPlan ? LICENSE_CONFIG[selectedPlan].price : 0;


  const handleSelectPlan = (plan: LicenseType) => {
    if (!guard.allowed) {
      const variant = guard.variant === 'not-logged-in' ? 'not-logged-in-buy' as const : 'wrong-role' as const;
      setModalVariant(variant);
      setIsModalOpen(true);
      return;
    }
    setSelectedPlan(plan);
  };

  const handleContinue = () => {
    if (!session || !selectedPlan) return;
    try {
      checkout(session);
      navigateTo('marketplace');
    } catch {
      setModalVariant('not-logged-in-buy');
      setIsModalOpen(true);
    }
  };

  return (
    <div className="bg-obsidian min-h-screen">
      <TopNavBar />

      <div className="flex">
        {/* Left sidebar */}
        <aside className="w-64 fixed left-0 top-20 h-[calc(100vh-80px)] bg-surface/95 backdrop-blur-xl z-40 flex flex-col overflow-y-auto border-r border-outline/5">
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

          <footer className="mt-auto pt-12 border-t border-outline-variant/10">
            <div className="flex gap-6 text-sm font-body text-on-surface-variant">
              <span className="hover:text-muiscaGold cursor-pointer">Minga License</span>
              <span>|</span>
              <span className="hover:text-muiscaGold cursor-pointer">Support Portal</span>
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
