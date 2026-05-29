interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative max-w-3xl">
      <span className="absolute left-6 top-1/2 -translate-y-1/2 material-symbols-outlined text-primary/50">
        search
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="BUSCAR EN LA COSECHA..."
        aria-label="Buscar beats"
        className="w-full bg-surface-container-low border border-primary/20 py-5 pl-16 pr-8 text-on-surface font-display tracking-widest text-sm focus:outline-none focus:border-primary transition-colors"
      />
    </div>
  );
}
