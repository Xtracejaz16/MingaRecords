interface GenreFilterChipsProps {
  selectedGenre: string | null;
  onSelectGenre: (genre: string | null) => void;
}

interface GenreChip {
  label: string;
  value: string;
  activeBg: string;
  activeText: string;
  hoverBg: string;
  hoverText: string;
  hasBorder?: boolean;
}

const GENRE_CHIPS: GenreChip[] = [
  {
    label: 'TODO',
    value: 'TODO',
    activeBg: 'bg-taironaTerracotta',
    activeText: 'text-white',
    hoverBg: 'hover:bg-taironaTerracotta',
    hoverText: 'hover:text-white',
  },
  {
    label: 'AFROBEAT',
    value: 'AFROBEAT',
    activeBg: 'bg-wayuuJade',
    activeText: 'text-white',
    hoverBg: 'hover:bg-wayuuJade',
    hoverText: 'hover:text-white',
  },
  {
    label: 'CHAMPETA',
    value: 'CHAMPETA',
    activeBg: 'bg-zenuCopper',
    activeText: 'text-on-surface',
    hoverBg: 'hover:bg-zenuCopper',
    hoverText: 'hover:text-on-surface',
  },
  {
    label: 'CUMBIA',
    value: 'CUMBIA',
    activeBg: 'bg-emberaNavy',
    activeText: 'text-on-surface',
    hoverBg: 'hover:bg-emberaNavy',
    hoverText: 'hover:text-on-surface',
    hasBorder: true,
  },
  {
    label: 'TRAP',
    value: 'TRAP',
    activeBg: 'bg-surface-container-high',
    activeText: 'text-on-surface',
    hoverBg: 'hover:bg-taironaTerracotta',
    hoverText: 'hover:text-white',
  },
  {
    label: 'R&B',
    value: 'R&B',
    activeBg: 'bg-surface-container-high',
    activeText: 'text-on-surface',
    hoverBg: 'hover:bg-wayuuJade',
    hoverText: 'hover:text-white',
  },
  {
    label: 'VALLENATO',
    value: 'VALLENATO',
    activeBg: 'bg-surface-container-high',
    activeText: 'text-on-surface',
    hoverBg: 'hover:bg-zenuCopper',
    hoverText: 'hover:text-on-surface',
  },
];

export function GenreFilterChips({ selectedGenre, onSelectGenre }: GenreFilterChipsProps) {
  const currentGenre = selectedGenre ?? 'TODO';

  return (
    <div className="flex flex-wrap gap-3">
      {GENRE_CHIPS.map((chip) => {
        const isActive = currentGenre === chip.value;
        const isDefault = chip.value === 'TODO';

        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => onSelectGenre(isDefault ? null : chip.value)}
            className={`px-6 py-2 font-display text-xs tracking-widest font-bold cursor-pointer transition-all ${
              isActive
                ? `${chip.activeBg} ${chip.activeText}`
                : `bg-surface-container-high border border-outline-variant/30 text-on-surface-variant ${chip.hoverBg} ${chip.hoverText}`
            } ${
              chip.hasBorder && isActive
                ? 'border border-muiscaGold'
                : ''
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
