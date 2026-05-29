interface GenreFilterChipsProps {
  selectedGenre: string | null;
  onSelectGenre: (genre: string | null) => void;
}

interface GenreChip {
  label: string;
  value: string;
  /** Classes when this chip is the active selection */
  activeClasses: string;
  /** Classes when inactive (includes hover transition) */
  inactiveClasses: string;
}

const GENRE_CHIPS: GenreChip[] = [
  {
    label: 'TODO',
    value: 'TODO',
    activeClasses: 'bg-[#8B2500] text-white',
    inactiveClasses: 'bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:bg-[#8B2500] hover:text-white',
  },
  {
    label: 'AFROBEAT',
    value: 'AFROBEAT',
    activeClasses: 'bg-[#1A7A6E] text-white',
    inactiveClasses: 'bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:bg-[#1A7A6E] hover:text-white',
  },
  {
    label: 'CHAMPETA',
    value: 'CHAMPETA',
    activeClasses: 'bg-[#B5651D] text-[#0F0A00]',
    inactiveClasses: 'bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:bg-[#B5651D] hover:text-[#0F0A00]',
  },
  {
    label: 'CUMBIA',
    value: 'CUMBIA',
    activeClasses: 'bg-[#1A2340] border border-[#C8860A] text-on-surface',
    inactiveClasses: 'bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:bg-[#1A2340] hover:border-[#C8860A] hover:text-on-surface',
  },
  {
    label: 'TRAP',
    value: 'TRAP',
    activeClasses: 'bg-[#8B2500] text-white',
    inactiveClasses: 'bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:bg-[#8B2500] hover:text-white',
  },
  {
    label: 'R&B',
    value: 'R&B',
    activeClasses: 'bg-[#1A7A6E] text-white',
    inactiveClasses: 'bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:bg-[#1A7A6E] hover:text-white',
  },
  {
    label: 'VALLENATO',
    value: 'VALLENATO',
    activeClasses: 'bg-[#B5651D] text-[#0F0A00]',
    inactiveClasses: 'bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:bg-[#B5651D] hover:text-[#0F0A00]',
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
            onClick={() => onSelectGenre(isDefault ? null : chip.value)}
            className={`px-6 py-2 font-display text-xs tracking-widest font-bold cursor-pointer transition-all ${
              isActive
                ? chip.activeClasses
                : chip.inactiveClasses
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
