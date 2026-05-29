import { useAuth } from '../../auth/hooks/useAuth';
import { useAppShell } from '../../app/hooks/useAppShell';

const NAV_ITEMS = [
  {
    label: 'Marketplace',
    icon: 'storefront',
    fill: true,
    active: true,
    activeBg: 'bg-taironaTerracotta/30',
    activeBorder: 'border-taironaTerracotta',
    hoverColor: 'hover:text-taironaTerracotta',
    iconHover: 'group-hover:text-taironaTerracotta',
  },
  {
    label: 'Mis Compras',
    icon: 'shopping_bag',
    fill: false,
    active: false,
    activeBg: '',
    activeBorder: '',
    hoverColor: 'hover:text-wayuuJade',
    iconHover: 'group-hover:text-wayuuJade',
  },
  {
    label: 'Favoritos',
    icon: 'favorite',
    fill: false,
    active: false,
    activeBg: '',
    activeBorder: '',
    hoverColor: 'hover:text-zenuCopper',
    iconHover: 'group-hover:text-zenuCopper',
  },
  {
    label: 'Mi Perfil',
    icon: 'person',
    fill: false,
    active: false,
    activeBg: '',
    activeBorder: '',
    hoverColor: 'hover:text-muiscaGold',
    iconHover: 'group-hover:text-muiscaGold',
  },
] as const;

const FOOTER_ITEMS = [
  { label: 'Ajustes', icon: 'tune' },
  { label: 'Salir', icon: 'logout' },
] as const;

export function SideNavBar() {
  const { session } = useAuth();
  const { navigateTo, handleLogout } = useAppShell();

  return (
    <aside className="fixed left-0 top-20 h-[calc(100vh-160px)] w-64 bg-surface-container-low border-r border-outline-variant/5 flex flex-col py-8 z-40">
      {/* Profile */}
      {session && (
        <div className="px-6 mb-10 flex items-center gap-4">
          <div className="w-12 h-12 border border-secondary/50 p-1">
            <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant">person</span>
            </div>
          </div>
          <div>
            <p className="font-display text-sm font-bold text-primary tracking-tighter">ARTISTA ELITE</p>
            <p className="font-body text-xs text-on-surface-variant italic">Minga Gold Member</p>
          </div>
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`flex items-center gap-4 px-6 py-3 w-full text-left font-display text-sm tracking-widest uppercase transition-all cursor-pointer ${
              item.active
                ? `text-white ${item.activeBg} border-l-4 ${item.activeBorder}`
                : `text-on-surface-variant hover:bg-surface-container-highest/20 ${item.hoverColor} group`
            }`}
            onClick={() => {
              if (item.label === 'Favoritos') navigateTo('marketplace');
              if (item.label === 'Mis Compras') navigateTo('marketplace');
              if (item.label === 'Mi Perfil') navigateTo('marketplace');
            }}
          >
            <span
              className={`material-symbols-outlined ${item.active ? '' : item.iconHover}`}
              style={item.fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto px-6 space-y-2">
        {FOOTER_ITEMS.map((item) => (
          <button
            key={item.label}
            type="button"
            className="flex items-center gap-4 py-2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors text-xs font-display tracking-widest uppercase w-full text-left cursor-pointer"
            onClick={() => {
              if (item.label === 'Salir') handleLogout();
            }}
          >
            <span className="material-symbols-outlined text-sm">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
