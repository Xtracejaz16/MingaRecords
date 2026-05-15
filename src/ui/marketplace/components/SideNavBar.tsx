const NAV_ITEMS = [
  {
    label: 'Marketplace',
    icon: 'storefront',
    active: true,
    activeClasses: 'bg-taironaTerracotta/30 border-l-4 border-taironaTerracotta text-white',
    hoverClasses: '',
  },
  {
    label: 'Mis Compras',
    icon: 'shopping_bag',
    active: false,
    activeClasses: '',
    hoverClasses: 'hover:bg-mud/20 hover:text-wayuuJade',
  },
  {
    label: 'Favoritos',
    icon: 'favorite',
    active: false,
    activeClasses: '',
    hoverClasses: 'hover:bg-mud/20 hover:text-zenuCopper',
    badge: 0,
  },
  {
    label: 'Mi Perfil',
    icon: 'person',
    active: false,
    activeClasses: '',
    hoverClasses: 'hover:bg-mud/20 hover:text-muiscaGold',
  },
] as const;

const FOOTER_ITEMS = [
  { label: 'Ajustes', icon: 'tune' },
  { label: 'Salir', icon: 'logout' },
] as const;

export function SideNavBar() {
  return (
    <aside className="h-full w-64 flex-shrink-0 bg-deepObsidian border-r border-outline/5 z-40 flex flex-col overflow-y-auto">
      {/* Profile */}
      <div className="p-6 border-b border-outline/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 border border-blush/50 p-1 shrink-0">
            <div className="w-full h-full bg-darkMud flex items-center justify-center">
              <span className="material-symbols-outlined text-blush">
                person
              </span>
            </div>
          </div>
          <div>
            <p className="font-display text-sm font-bold text-brightGold tracking-tighter">
              ARTISTA ELITE
            </p>
            <p className="font-body text-xs text-mutedCream italic">
              Minga Gold Member
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-3 px-4 py-3 font-display text-xs tracking-widest uppercase cursor-pointer transition-colors ${
              item.active
                ? item.activeClasses
                : `text-mutedCream ${item.hoverClasses}`
            }`}
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
      <div className="p-4 border-t border-outline/10 space-y-1">
        {FOOTER_ITEMS.map((item) => (
          <button
            key={item.label}
            className="w-full flex items-center gap-3 px-4 py-2 text-koguiCream/40 hover:text-koguiCream text-xs font-display tracking-widest uppercase cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-base">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
