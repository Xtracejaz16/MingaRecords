import { useAuth } from '../../auth/hooks/useAuth';
import { useAppShell } from '../../app/hooks/useAppShell';

export function TopNavBar() {
  const { session } = useAuth();
  const { navigateTo } = useAppShell();

  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(69,43,0,0.15)] h-20 flex justify-between items-center px-12 border-b border-outline-variant/10">
      <div className="flex items-center gap-8">
        <h1 className="text-2xl font-display font-bold tracking-[0.1em] flex items-center">
          <span className="text-primary">MINGA</span>
          <span className="text-secondary ml-2">RECORDS</span>
        </h1>
        <nav className="hidden md:flex gap-8 font-display text-sm tracking-widest uppercase">
          <span className="text-primary border-b-2 border-primary pb-1">MARKETPLACE</span>
          <button
            type="button"
            className="text-on-surface-variant hover:text-wayuuJade transition-colors cursor-pointer"
            onClick={() => navigateTo('home')}
          >
            LIBRARY
          </button>
          <span className="text-on-surface-variant hover:text-zenuCopper transition-colors cursor-pointer">
            MINGA UPDATES
          </span>
        </nav>
      </div>
      <div className="flex items-center gap-6">
        <button
          type="button"
          className="bg-primary text-on-primary px-6 py-2 font-display text-sm font-bold tracking-widest active:scale-95 transition-transform cursor-pointer"
        >
          EXPLORAR BEATS
        </button>
        <div className="relative group cursor-pointer">
          <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary">notifications</span>
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-taironaTerracotta rounded-full"></span>
        </div>
        <div className="w-10 h-10 border border-primary/30 flex items-center justify-center bg-surface-container-high overflow-hidden">
          {session ? (
            <span className="material-symbols-outlined text-on-surface-variant/60 text-lg">person</span>
          ) : (
            <button
              type="button"
              className="w-full h-full flex items-center justify-center cursor-pointer"
              onClick={() => navigateTo('login')}
            >
              <span className="material-symbols-outlined text-on-surface-variant/60 text-lg">person</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
