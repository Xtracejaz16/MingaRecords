import type { Release } from '../../../domain/marketplace/Release';

interface ReleaseListProps {
  releases: Release[];
}

export function ReleaseList({ releases }: ReleaseListProps) {
  return (
    <div className="bg-void border border-outline/10 overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-outline/10 flex justify-between items-center bg-deepObsidian/30">
        <h4 className="font-display font-bold tracking-widest text-paleCream uppercase">
          Próximos Lanzamientos
        </h4>
        <span className="text-xs text-mutedCream font-body">
          ACTUALIZADO HACE 2 MINUTOS
        </span>
      </div>

      {/* Items */}
      <div className="divide-y divide-outline/5">
        {releases.map((release) => {
          return (
            <div
              key={release.id}
              className="p-6 flex items-center gap-6 group hover:bg-darkMud transition-colors cursor-pointer"
            >
              {/* Image */}
              <div className="w-14 h-14 bg-mud border border-brightGold/20 shrink-0 overflow-hidden">
                {release.coverUrl ? (
                  <img
                    src={release.coverUrl}
                    alt={release.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-mud flex items-center justify-center">
                    <span className="material-symbols-outlined text-mutedCream/40 text-lg">album</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h5 className="text-paleCream font-display text-lg font-bold group-hover:text-brightGold transition-colors">
                  {release.title}
                </h5>
                <p className="text-mutedCream font-body text-sm italic">
                  {release.artist} · Disponible en {release.availableInDays} días
                </p>
              </div>

              {/* Calendar icon */}
              <span className="material-symbols-outlined text-brightGold/40 group-hover:text-brightGold transition-colors">
                calendar_today
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
