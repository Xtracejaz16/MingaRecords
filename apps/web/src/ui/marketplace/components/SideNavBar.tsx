import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useAppShell } from '../../app/hooks/useAppShell';
import { checkCartAccess } from '../../cart/hooks/useCartGuard';
import { LoginRequiredModal, type LoginRequiredModalProps } from '../../cart/components/LoginRequiredModal';

const NAV_ITEMS = [
  {
    label: 'Marketplace',
    icon: 'storefront',
    active: true,
    activeClasses: 'text-white bg-taironaTerracotta/30 border-l-4 border-taironaTerracotta',
    hoverClasses: '',
    action: 'marketplace' as const,
  },
  {
    label: 'Mis Compras',
    icon: 'shopping_bag',
    active: false,
    activeClasses: '',
    hoverClasses: 'hover:bg-surface-container-highest/20 hover:text-wayuuJade',
    action: 'purchases' as const,
  },
  {
    label: 'Favoritos',
    icon: 'favorite',
    active: false,
    activeClasses: '',
    hoverClasses: 'hover:bg-surface-container-highest/20 hover:text-zenuCopper',
    badge: 0,
    action: 'favorites' as const,
  },
  {
    label: 'Mi Perfil',
    icon: 'person',
    active: false,
    activeClasses: '',
    hoverClasses: 'hover:bg-surface-container-highest/20 hover:text-muiscaGold',
    action: 'profile' as const,
  },
] as const;

const FOOTER_ITEMS = [
  { label: 'Ajustes', icon: 'tune' },
  { label: 'Salir', icon: 'logout' },
] as const;

export function SideNavBar() {
  const { session } = useAuth();
  const { navigateTo, handleLogout } = useAppShell();
  const [modalVariant, setModalVariant] = useState<LoginRequiredModalProps['variant']>('not-logged-in-purchases');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleNavClick = (action: typeof NAV_ITEMS[number]['action']) => {
    if (action === 'marketplace') {
      navigateTo('marketplace');
      return;
    }

    if (action === 'purchases') {
      const guard = checkCartAccess(session);
      if (!guard.allowed) {
        setModalVariant(guard.variant === 'not-logged-in' ? 'not-logged-in-purchases' : 'wrong-role');
        setIsModalOpen(true);
        return;
      }
      navigateTo('intercambio');
      return;
    }

    // For favorites and profile — guard check too
    const guard = checkCartAccess(session);
    if (!guard.allowed) {
      const variant = action === 'favorites' ? 'not-logged-in-favorite' as const : 'not-logged-in-buy' as const;
      setModalVariant(guard.variant === 'not-logged-in' ? variant : 'wrong-role');
      setIsModalOpen(true);
    }
  };

  return (
    <aside className="fixed left-0 top-20 h-[calc(100vh-160px)] w-64 bg-surface-container-low border-r border-outline-variant/5 flex flex-col py-8 z-40">
      {/* Profile */}
      <div className="px-6 mb-10 flex items-center gap-4">
        <div className="w-12 h-12 border border-secondary/50 p-1 shrink-0">
          <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
            <span className="material-symbols-outlined text-secondary">person</span>
          </div>
        </div>
        <div>
          <p className="font-display text-sm font-bold text-primary tracking-tighter">
            {session ? (session.alias ?? 'ARTISTA ELITE') : 'ARTISTA ELITE'}
          </p>
          <p className="font-body text-xs text-on-surface-variant italic">
            {session?.role === 'artist' ? 'Minga Gold Member' : 'Productor'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.filter((item) => session || item.action !== 'profile').map((item) => {
          const isActive = item.active;
          return (
            <button
              key={item.label}
              type="button"
              className={`w-full flex items-center gap-4 px-6 py-3 font-display text-sm tracking-widest uppercase cursor-pointer transition-all ${
                isActive
                  ? item.activeClasses
                  : `text-on-surface-variant ${item.hoverClasses}`
              }`}
              onClick={() => handleNavClick(item.action)}
            >
              <span
                className="material-symbols-outlined"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                {item.icon}
              </span>
              <span className="flex-1 text-left">{item.label}</span>
              {'badge' in item && item.badge > 0 && (
                <span className="ml-auto bg-taironaTerracotta text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      {session && (
        <div className="mt-auto px-6 space-y-2">
          {FOOTER_ITEMS.map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-4 py-2 text-koguiCream/40 hover:text-koguiCream transition-colors text-xs font-display tracking-widest uppercase cursor-pointer"
              type="button"
              onClick={item.label === 'Salir' ? handleLogout : undefined}
            >
              <span className="material-symbols-outlined text-sm">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      <LoginRequiredModal
        variant={modalVariant}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </aside>
  );
}
