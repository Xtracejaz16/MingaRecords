import { BrandLogo } from './BrandLogo';
import { useAuth } from '../../auth/hooks/useAuth';
import { useCart } from '../../cart/hooks/useCart';
import { useAppShell } from '../../app/hooks/useAppShell';
import { CartIconBadge } from '../../cart/components/CartIconBadge';

export function TopNavBar() {
  const { session } = useAuth();
  const { itemCount } = useCart();
  const { navigateTo } = useAppShell();

  return (
    <header className="fixed top-0 z-50 flex h-20 w-full items-center justify-between border-b border-taironaTerracotta/30 bg-obsidian/95 px-8 font-headline tracking-widest text-muiscaGold shadow-2xl backdrop-blur-md">
      <BrandLogo className="text-2xl font-black uppercase tracking-[0.2em]" />

      <nav className="hidden items-center gap-8 text-xs font-display tracking-widest md:flex">
        <button
          type="button"
          className="uppercase text-koguiCream/60 transition-colors hover:text-muiscaGold cursor-pointer"
          onClick={() => navigateTo('marketplace')}
        >
          MARKETPLACE
        </button>
        <span className="uppercase text-koguiCream/60 transition-colors hover:text-muiscaGold cursor-pointer">
          LIBRARY
        </span>
        <span className="uppercase text-koguiCream/60 transition-colors hover:text-muiscaGold cursor-pointer">
          MINGA UPDATES
        </span>
      </nav>

      <div className="flex items-center gap-6">
        <button
          type="button"
          className="bg-muiscaGold text-obsidian px-6 py-2 text-sm font-display tracking-widest uppercase shadow-lg shadow-muiscaGold/10 transition-all duration-300 hover:bg-koguiCream cursor-pointer"
          onClick={() => navigateTo('marketplace')}
        >
          EXPLORAR BEATS
        </button>

        <div className="flex gap-4 items-center text-koguiCream/60">
          {!session || session.emailVerified === false ? (
            <>
              <button
                type="button"
                className="text-xs font-display tracking-widest uppercase text-koguiCream/60 hover:text-muiscaGold transition-colors cursor-pointer"
                onClick={() => navigateTo('login')}
              >
                Iniciar sesi&oacute;n
              </button>
              <button
                type="button"
                className="text-xs font-display tracking-widest uppercase bg-muiscaGold/10 border border-muiscaGold text-muiscaGold px-4 py-2 hover:bg-muiscaGold/20 transition-colors cursor-pointer"
                onClick={() => navigateTo('register')}
              >
                Registrarse
              </button>
            </>
          ) : (
            <>
              {session.role === 'BEATMAKER' && (
                <CartIconBadge
                  itemCount={itemCount}
                  onClick={() => navigateTo('intercambio')}
                />
              )}
              <span className="material-symbols-outlined cursor-pointer transition-colors hover:text-muiscaGold">notifications</span>
              <div className="w-10 h-10 border border-muiscaGold/30 flex items-center justify-center bg-surface-container-high overflow-hidden">
                <span className="material-symbols-outlined text-koguiCream/60 text-lg">person</span>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
