export function HeroHeader() {
  return (
    <div className="mb-16">
      {/* Badge */}
      <div className="flex items-center gap-3 mb-6">
        <span className="h-2 w-2 rounded-full bg-[#ffb59f] animate-pulse" />
        <span className="text-[#ffb59f] font-display text-xs tracking-[0.3em] uppercase">
          Cosecha del Mes
        </span>
      </div>

      {/* Title */}
      <h2 className="leading-none mb-4">
        <span className="block text-[#efe2c2] font-display text-6xl font-bold tracking-tight">
          ENCUENTRA TU
        </span>
        <span className="block text-[#ffb950] font-display text-7xl font-black tracking-tighter italic">
          PRÓXIMO SONIDO
        </span>
      </h2>

      {/* Subtitle */}
      <p className="text-[#d6c4af] font-body text-xl italic max-w-2xl leading-relaxed">
        Descubre beats únicos inspirados en los ritmos de nuestra tierra.
        Afrobeat, champeta, cumbia y más — todo en un solo lugar.
      </p>
    </div>
  );
}
