import { useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useAppShell } from '../../app/hooks/useAppShell';
import { checkCartAccess } from '../../cart/hooks/useCartGuard';
import { LoginRequiredModal, type LoginRequiredModalProps } from '../../cart/components/LoginRequiredModal';

const NAV_ITEMS = [
  {
    label: 'Favoritos',
    icon: 'favorite',
    active: false,
    activeClasses: '',
    hoverClasses: 'hover:bg-surface-container-high/20 hover:text-zenuCopper',
    badge: 0,
    action: 'favorites' as const,
  },
  {
    label: 'Mis Compras',
    icon: 'shopping_bag',
    active: false,
    activeClasses: '',
    hoverClasses: 'hover:bg-surface-container-high/20 hover:text-wayuuJade',
    badge: 0,
    action: 'purchases' as const,
  },
  {
    label: 'Mi Perfil',
    icon: 'person',
    active: false,
    activeClasses: '',
    hoverClasses: 'hover:bg-surface-container-high/20 hover:text-muiscaGold',
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
    <aside className="h-full w-64 flex-shrink-0 bg-surface border-r border-outline/5 z-40 flex flex-col overflow-y-auto pt-20">
      {/* Profile */}
      {session && (
        <div className="p-6 border-b border-outline/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 border border-muiscaGold/50 p-1 shrink-0">
              <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                <span className="material-symbols-outlined text-muiscaGold">
                  person
                </span>
              </div>
            </div>
            <div>
              <p className="font-display text-sm font-bold text-muiscaGold tracking-tighter">
                {session.alias ?? 'ARTISTA'}
              </p>
              <p className="font-body text-xs text-koguiCream italic">
                {session.role === 'BEATMAKER' ? 'Minga Gold Member' : 'Productor'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.filter((item) => session || item.action !== 'profile').map((item) => (
          <button
            key={item.label}
            type="button"
            className={`w-full flex items-center gap-3 px-4 py-3 font-display text-xs tracking-widest uppercase cursor-pointer transition-colors ${
              item.active
                ? item.activeClasses
                : `text-koguiCream ${item.hoverClasses}`
            }`}
            onClick={() => handleNavClick(item.action)}
          >
            <span
              className="material-symbols-outlined text-lg"
              style={
                item.active
                  ? { fontVariationSettings: "'FILL' 1" }
                  : undefined
              }
            >
              {item.icon}
            </span>
            <span className="flex-1 text-left">{item.label}</span>
            {'badge' in item && item.badge > 0 && (
              <span className="ml-auto bg-taironaTerracotta text-white text-[10px] px-1.5 py-0.5">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      {session && (
        <div className="p-4 border-t border-outline/10 space-y-1">
          {FOOTER_ITEMS.map((item) => (
            <button
              key={item.label}
              className="w-full flex items-center gap-3 px-4 py-2 text-koguiCream/40 hover:text-koguiCream text-xs font-display tracking-widest uppercase cursor-pointer transition-colors"
              type="button"
              onClick={item.label === 'Salir' ? handleLogout : undefined}
            >
              <span className="material-symbols-outlined text-base">
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
