import { useAppShell } from '../../app/hooks/useAppShell';

export interface LoginRequiredModalProps {
  variant: 'not-logged-in-buy' | 'wrong-role' | 'not-logged-in-favorite' | 'not-logged-in-purchases';
  isOpen: boolean;
  onClose: () => void;
}

const VARIANT_CONTENT = {
  'not-logged-in-buy': {
    title: 'Inicia sesión para continuar',
    message: 'Debes iniciar sesión como ARTISTA para adquirir beats.',
    primaryLabel: 'Iniciar sesión',
    secondaryLabel: 'Cancelar',
    showSecondary: true,
  },
  'wrong-role': {
    title: 'Acción no disponible',
    message: 'Solo los ARTISTAS pueden adquirir beats. Tu cuenta actual es de PRODUCTOR.',
    primaryLabel: 'Entendido',
    secondaryLabel: '',
    showSecondary: false,
  },
  'not-logged-in-favorite': {
    title: 'Inicia sesión para continuar',
    message: 'Inicia sesión como ARTISTA para guardar favoritos.',
    primaryLabel: 'Iniciar sesión',
    secondaryLabel: 'Cancelar',
    showSecondary: true,
  },
  'not-logged-in-purchases': {
    title: 'Inicia sesión para continuar',
    message: 'Inicia sesión como ARTISTA para ver tus compras.',
    primaryLabel: 'Iniciar sesión',
    secondaryLabel: 'Cancelar',
    showSecondary: true,
  },
} as const;

export function LoginRequiredModal({ variant, isOpen, onClose }: LoginRequiredModalProps) {
  const { navigateTo } = useAppShell();

  if (!isOpen) return null;

  const content = VARIANT_CONTENT[variant];

  const handlePrimary = () => {
    if (variant === 'wrong-role') {
      onClose();
    } else {
      navigateTo('login');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-surface-container-high border border-outline-variant/30 p-10 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display tracking-widest uppercase text-koguiCream">
          {content.title}
        </h2>
        <p className="font-body text-on-surface-variant italic mt-4 mb-8">
          {content.message}
        </p>
        <div className="flex gap-4">
          <button
            type="button"
            className="flex-1 bg-muiscaGold text-obsidian font-display text-xs tracking-widest font-bold py-3 px-6 hover:opacity-90 transition-opacity cursor-pointer"
            onClick={handlePrimary}
          >
            {content.primaryLabel}
          </button>
          {content.showSecondary && (
            <button
              type="button"
              className="flex-1 border border-outline-variant text-koguiCream font-display text-xs tracking-widest font-bold py-3 px-6 hover:bg-surface-container-highest/20 transition-colors cursor-pointer"
              onClick={onClose}
            >
              {content.secondaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
