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
    activeBg: 'bg-[#8B2500]',
    activeText: 'text-white',
    hoverBg: 'hover:bg-[#8B2500]',
    hoverText: 'hover:text-white',
  },
  {
    label: 'AFROBEAT',
    value: 'AFROBEAT',
    activeBg: 'bg-[#1A7A6E]',
    activeText: 'text-white',
    hoverBg: 'hover:bg-[#1A7A6E]',
    hoverText: 'hover:text-white',
  },
  {
    label: 'CHAMPETA',
    value: 'CHAMPETA',
    activeBg: 'bg-[#B5651D]',
    activeText: 'text-[#0F0A00]',
    hoverBg: 'hover:bg-[#B5651D]',
    hoverText: 'hover:text-[#0F0A00]',
  },
  {
    label: 'CUMBIA',
    value: 'CUMBIA',
    activeBg: 'bg-[#1A2340]',
    activeText: 'text-[#efe2c2]',
    hoverBg: 'hover:bg-[#1A2340]',
    hoverText: 'hover:text-[#efe2c2]',
  },
  {
    label: 'TRAP',
    value: 'TRAP',
    activeBg: 'bg-[#8B2500]',
    activeText: 'text-white',
    hoverBg: 'hover:bg-[#8B2500]',
    hoverText: 'hover:text-white',
  },
  {
    label: 'R&B',
    value: 'R&B',
    activeBg: 'bg-[#1A7A6E]',
    activeText: 'text-white',
    hoverBg: 'hover:bg-[#1A7A6E]',
    hoverText: 'hover:text-white',
  },
  {
    label: 'VALLENATO',
    value: 'VALLENATO',
    activeBg: 'bg-[#B5651D]',
    activeText: 'text-[#0F0A00]',
    hoverBg: 'hover:bg-[#B5651D]',
    hoverText: 'hover:text-[#0F0A00]',
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
                : `bg-[#302915] border border-[#514535]/30 text-[#d6c4af] ${chip.hoverBg} ${chip.hoverText}`
            } ${
              chip.value === 'CUMBIA' && isActive
                ? 'border border-[#C8860A]'
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
