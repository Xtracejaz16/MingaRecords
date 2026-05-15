import { LICENSE_CONFIG, type LicenseType } from '../../../domain/cart/LicenseType';
import type { CartItem } from '../../../domain/cart/CartItem';

interface TheRitualSidebarProps {
  selectedPlan: LicenseType | null;
  cartItem: CartItem | null;
  total: number;
  onContinue: () => void;
}

export function TheRitualSidebar({ selectedPlan, cartItem, total, onContinue }: TheRitualSidebarProps) {
  return (
    <aside className="w-96 sticky top-28">
      <h2 className="text-sm tracking-[0.4em] font-display uppercase text-koguiCream mb-8">
        THE RITUAL
      </h2>

      {selectedPlan === null || cartItem === null ? (
        <p className="font-body text-on-surface-variant italic text-sm">
          Selecciona un plan para continuar el ritual.
        </p>
      ) : (
        <div className="space-y-6">
          <div>
            <span className="text-[10px] tracking-widest uppercase text-muiscaGold font-display">
              SELECTION CONFIRMED
            </span>
          </div>

          <div className="flex gap-4">
            <img
              src={cartItem.coverUrl || `https://picsum.photos/64/64?random=${cartItem.beatId}`}
              alt={cartItem.beatTitle}
              className="w-16 h-16 object-cover"
            />
            <div>
              <p className="font-display text-sm text-koguiCream">{cartItem.beatTitle}</p>
              <p className="text-xs text-on-surface-variant font-body">{cartItem.producerName}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm font-body">
            <div className="flex justify-between text-on-surface-variant">
              <span>Plan</span>
              <span className="text-koguiCream">{LICENSE_CONFIG[selectedPlan].name}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Precio</span>
              <span className="text-koguiCream">${LICENSE_CONFIG[selectedPlan].price}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Licencia</span>
              <span className="text-koguiCream">{LICENSE_CONFIG[selectedPlan].name}</span>
            </div>
            <div className="flex justify-between text-on-surface-variant">
              <span>Subtotal</span>
              <span className="text-koguiCream">${total}</span>
            </div>
          </div>

          <div className="h-px bg-outline-variant/30" />

          <div className="flex justify-between items-baseline">
            <span className="text-sm font-display tracking-widest uppercase text-on-surface-variant">
              TOTAL
            </span>
            <span className="font-crimson text-2xl font-bold text-koguiCream">
              ${total}
            </span>
          </div>

          <button
            type="button"
            className="w-full bg-gradient-to-r from-muiscaGold to-zenuCopper text-obsidian font-display text-xs tracking-widest font-bold uppercase py-3 px-6 hover:opacity-90 transition-opacity cursor-pointer"
            onClick={onContinue}
          >
            CONTINUAR EL RITUAL
          </button>
        </div>
      )}
    </aside>
  );
}
