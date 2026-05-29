export function HeroHeader() {
  return (
    <section className="mb-16">
      {/* Badge */}
      <div className="flex items-center gap-3 mb-6">
        <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse" />
        <span className="text-secondary font-display text-xs tracking-[0.3em] uppercase">
          Cosecha del Mes
        </span>
      </div>

      {/* Title */}
      <h2 className="leading-none mb-4">
        <span className="block text-on-surface font-display text-6xl font-bold tracking-tight">
          ENCUENTRA TU
        </span>
        <span className="block text-primary font-display text-7xl font-black tracking-tighter italic">
          PRÓXIMO SONIDO
        </span>
      </h2>

      {/* Subtitle */}
      <p className="text-on-surface-variant font-body text-xl italic max-w-2xl leading-relaxed">
        Descubre ritmos ancestrales procesados para la eternidad. Una curaduría de beats que conectan el pasado muisca con el futuro digital.
      </p>
    </section>
  );
}
