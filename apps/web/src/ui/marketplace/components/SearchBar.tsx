interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative max-w-3xl">
      <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-brightGold/50">
        search
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="BUSCAR EN LA COSECHA..."
        aria-label="Buscar beats"
        className="w-full bg-deepObsidian border border-brightGold/20 py-5 pl-16 pr-8 text-paleCream font-display tracking-widest text-sm focus:outline-none focus:border-brightGold transition-colors"
      />
    </div>
  );
}
