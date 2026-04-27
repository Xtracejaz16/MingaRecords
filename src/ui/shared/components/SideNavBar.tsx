function resolveHash(hash: string) {
  return hash.replace(/^#/, '').replace(/^\//, '').replace(/\/+$/, '').trim().toLowerCase();
}

interface SideNavBarProps {
  currentRoute?: string;
}

export function SideNavBar({ currentRoute = 'panel' }: SideNavBarProps) {
  // Map route keys to their hash paths for comparison
  const routeHashMap: Record<string, string> = {
    panel: '/panel',
    beats: '/beats',
    ganancias: '/ganancias',
    analisis: '/analisis',
    actualizaciones: '/actualizaciones',
    configuracion: '/configuracion',
  };

  const currentPath = routeHashMap[currentRoute] || '/panel';

  const NAV_ITEMS = [
    { label: 'Dashboard', icon: 'dashboard', hash: '#/panel', routeKey: 'panel' },
    { label: 'My Beats', icon: 'music_note', hash: '#/beats', routeKey: 'beats' },
    { label: 'Earnings', icon: 'payments', hash: '#/ganancias', routeKey: 'ganancias' },
    { label: 'Analytics', icon: 'insights', hash: '#/analisis', routeKey: 'analisis' },
    { label: 'Updates', icon: 'new_releases', hash: '#/actualizaciones', routeKey: 'actualizaciones' },
  ] as const;

  const FOOTER_ITEMS = [
    { label: 'Settings', icon: 'settings', hash: '#/configuracion', routeKey: 'configuracion' },
    { label: 'Support', icon: 'contact_support', hash: '#/soporte', routeKey: 'soporte' },
  ] as const;

  const isActive = (itemHash: string) => {
    const normalizedItem = resolveHash(itemHash);
    const normalizedCurrent = resolveHash(currentPath);
    return normalizedItem === normalizedCurrent;
  };

  return (
    <aside className="fixed left-0 top-20 z-40 flex h-[calc(100vh-5rem)] w-64 flex-col border-r border-taironaTerracotta/20 bg-obsidian font-headline">
      <div className="border-b border-taironaTerracotta/20 bg-taironaTerracotta/5 p-8">
        <div className="mb-2 flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-1 scale-75 transform rotate-45 rounded-sm border border-muiscaGold/40" />
            <img
              alt="Producer"
              className="relative z-10 h-10 w-10 border border-muiscaGold object-cover brightness-90 grayscale"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlA1HG0F17euhLWtwVlb1Ip4Hyrn9vFgp81tDqZ5S2Nu0CA94Dr5lciJGDEa0HQblefCVwt6KMamtBBMo912p2ZZ-yTAdtYJxolqEVYn63LcDaJLlIYW54DVeYJ10wdto_0CcdrfpdN4vB0-5IOGcegATTcleYE1IzeVr-lMBvNs4DFltr7i3G9Dyf3Z9vXDVjI1KXLapnnBgaWbPgUWkBBYFx-OQOhHSq-qaaqplrFWMkWq2a3zLSIDMGub4E06NChjkdnSqniMw"
            />
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-tighter text-muiscaGold">Producer Portal</h3>
            <p className="text-[10px] italic uppercase tracking-widest text-taironaTerracotta">Territory of Sound</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-6">
        {NAV_ITEMS.map((item) => (
          <a
            key={item.routeKey}
            aria-current={isActive(item.hash) ? 'page' : undefined}
            className={isActive(item.hash)
              ? 'flex items-center gap-3 border-r-4 border-muiscaGold bg-taironaTerracotta/20 px-6 py-4 text-xs font-bold uppercase tracking-widest text-muiscaGold'
              : 'flex items-center gap-3 px-6 py-4 text-xs uppercase tracking-widest text-koguiCream/50 transition-all hover:bg-taironaTerracotta/10 hover:text-koguiCream'}
            href={item.hash}
          >
            <span className="material-symbols-outlined text-sm">{item.icon}</span>
            {item.label}
          </a>
        ))}
      </nav>

      <div className="mt-auto border-t border-taironaTerracotta/20 py-6">
        {FOOTER_ITEMS.map((item) => (
          <a
            key={item.routeKey}
            className={item.routeKey === 'soporte'
              ? 'flex items-center gap-3 px-6 py-3 text-[10px] uppercase tracking-widest text-koguiCream/40 transition-colors hover:text-muiscaGold pointer-events-none opacity-50'
              : 'flex items-center gap-3 px-6 py-3 text-[10px] uppercase tracking-widest text-koguiCream/40 transition-colors hover:text-muiscaGold'}
            href={item.hash}
          >
            <span className="material-symbols-outlined text-xs">{item.icon}</span>
            {item.label}
          </a>
        ))}
      </div>
    </aside>
  );
}
