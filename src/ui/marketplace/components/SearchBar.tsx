interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative max-w-3xl">
      <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-[#ffb950]/50">
        search
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="BUSCAR EN LA COSECHA..."
        className="w-full bg-[#211b08] border border-[#ffb950]/20 py-5 pl-16 pr-8 text-[#efe2c2] font-display tracking-widest text-sm focus:outline-none focus:border-[#ffb950] transition-colors"
      />
    </div>
  );
}
