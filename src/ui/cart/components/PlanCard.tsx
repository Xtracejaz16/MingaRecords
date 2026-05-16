import { LICENSE_CONFIG, type LicenseType } from '../../../domain/cart/LicenseType';

interface PlanCardProps {
  plan: LicenseType;
  isSelected: boolean;
  onSelect: (plan: LicenseType) => void;
}

const PLAN_BORDER: Record<LicenseType, string> = {
  semilla: 'border-outline-variant/30 hover:border-koguiCream/40',
  raiz: 'border-2 border-muiscaGold shadow-[0_0_20px_rgba(200,134,10,0.3)]',
  ceiba: 'border-wayuuJade/30 hover:border-wayuuJade hover:bg-wayuuJade/10',
};

const PLAN_BUTTON: Record<LicenseType, string> = {
  semilla: 'border border-outline-variant text-koguiCream hover:bg-surface-container-highest/20',
  raiz: 'bg-muiscaGold text-obsidian hover:opacity-90',
  ceiba: 'border border-wayuuJade text-wayuuJade hover:bg-wayuuJade/10',
};

const PLAN_BUTTON_SELECTED: Record<LicenseType, string> = {
  semilla: 'bg-outline-variant text-koguiCream',
  raiz: 'bg-muiscaGold text-obsidian',
  ceiba: 'bg-wayuuJade text-white',
};

export function PlanCard({ plan, isSelected, onSelect }: PlanCardProps) {
  const config = LICENSE_CONFIG[plan];

  const borderClasses = PLAN_BORDER[plan];
  const buttonClasses = isSelected ? PLAN_BUTTON_SELECTED[plan] : PLAN_BUTTON[plan];
  const buttonLabel = isSelected ? 'SELECCIONADO' : 'SELECCIONAR';

  return (
    <div className={`relative flex gap-6 p-6 border transition-colors ${borderClasses}`}>
      {config.recommended && (
        <div className="absolute top-4 right-[-30px] bg-taironaTerracotta rotate-45 text-white text-[9px] tracking-widest py-1 px-10">
          RECOMENDADO
        </div>
      )}

      <img
        src={`https://picsum.photos/96/96?random=${plan}`}
        alt={config.name}
        className="w-24 h-24 object-cover"
      />

      <div className="flex-1">
        <h3 className="text-xs tracking-widest uppercase font-display text-koguiCream">
          {config.name}
        </h3>
        <p className="font-crimson text-5xl text-koguiCream mt-1">
          ${config.price}
        </p>
        <ul className="mt-3 space-y-1">
          {config.features.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm font-body text-on-surface-variant">
              <span className="material-symbols-outlined text-muiscaGold text-sm">check</span>
              {feature}
            </li>
          ))}
        </ul>
        <button
          type="button"
          className={`mt-4 w-full font-display text-xs tracking-widest font-bold uppercase py-3 px-6 transition-colors cursor-pointer ${buttonClasses}`}
          onClick={() => onSelect(plan)}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}
