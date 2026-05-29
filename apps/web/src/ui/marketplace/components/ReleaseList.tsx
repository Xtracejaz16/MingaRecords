import type { Release } from '../../../domain/marketplace/Release';

interface ReleaseListProps {
  releases: Release[];
}

export function ReleaseList({ releases }: ReleaseListProps) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/10 overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low/30">
        <h4 className="font-display font-bold tracking-widest text-on-surface uppercase">
          Próximos Lanzamientos
        </h4>
        <span className="text-xs text-on-surface-variant font-body">
          ACTUALIZADO HACE 2 MINUTOS
        </span>
      </div>

      {/* Items */}
      <div className="divide-y divide-outline-variant/5">
        {releases.map((release) => {
          return (
            <div
              key={release.id}
              className="p-6 flex items-center gap-6 group hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              {/* Image */}
              <div className="w-14 h-14 bg-surface-container-highest border border-primary/20 shrink-0 overflow-hidden">
                {release.coverUrl ? (
                  <img
                    src={release.coverUrl}
                    alt={release.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant/40 text-lg">album</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h5 className="text-on-surface font-display text-lg font-bold group-hover:text-primary transition-colors">
                  {release.title}
                </h5>
                <p className="text-on-surface-variant font-body text-sm italic">
                  {release.artist} · Disponible en {release.availableInDays} días
                </p>
              </div>

              {/* Calendar icon */}
              <span className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors">
                calendar_today
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
