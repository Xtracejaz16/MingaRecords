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
    activeText: 'text-obsidian',
    hoverBg: 'hover:bg-zenuCopper',
    hoverText: 'hover:text-obsidian',
  },
  {
    label: 'CUMBIA',
    value: 'CUMBIA',
    activeBg: 'bg-emberaNavy',
    activeText: 'text-paleCream',
    hoverBg: 'hover:bg-emberaNavy',
    hoverText: 'hover:text-paleCream',
  },
  {
    label: 'TRAP',
    value: 'TRAP',
    activeBg: 'bg-taironaTerracotta',
    activeText: 'text-white',
    hoverBg: 'hover:bg-taironaTerracotta',
    hoverText: 'hover:text-white',
  },
  {
    label: 'R&B',
    value: 'R&B',
    activeBg: 'bg-wayuuJade',
    activeText: 'text-white',
    hoverBg: 'hover:bg-wayuuJade',
    hoverText: 'hover:text-white',
  },
  {
    label: 'VALLENATO',
    value: 'VALLENATO',
    activeBg: 'bg-zenuCopper',
    activeText: 'text-obsidian',
    hoverBg: 'hover:bg-zenuCopper',
    hoverText: 'hover:text-obsidian',
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
                ? `${chip.activeBg} ${chip.activeText} border border-transparent`
                : `bg-darkMud border border-outline/30 text-mutedCream ${chip.hoverBg} ${chip.hoverText}`
            } ${
              chip.value === 'CUMBIA' && isActive
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
