import type { Release } from '../../../domain/marketplace/Release';

interface ReleaseListProps {
  releases: Release[];
}

export function ReleaseList({ releases }: ReleaseListProps) {
  return (
    <div className="bg-[#130e01] border border-[#514535]/10 overflow-hidden">
      {/* Header */}
      <div className="p-8 border-b border-[#514535]/10 flex justify-between items-center bg-[#211b08]/30">
        <h4 className="font-display font-bold tracking-widest text-[#efe2c2] uppercase">
          Próximos Lanzamientos
        </h4>
        <span className="text-xs text-[#d6c4af] font-body">
          ACTUALIZADO HACE 2 MINUTOS
        </span>
      </div>

      {/* Items */}
      <div className="divide-y divide-[#514535]/5">
        {releases.map((release) => {
          const coverSrc =
            release.coverUrl ||
            `https://picsum.photos/100/100?random=${release.id}`;

          return (
            <div
              key={release.id}
              className="p-6 flex items-center gap-6 group hover:bg-[#302915] transition-colors cursor-pointer"
            >
              {/* Image */}
              <div className="w-14 h-14 bg-[#3b341f] border border-[#ffb950]/20 shrink-0 overflow-hidden">
                <img
                  src={coverSrc}
                  alt={release.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1">
                <h5 className="text-[#efe2c2] font-display text-lg font-bold group-hover:text-[#ffb950] transition-colors">
                  {release.title}
                </h5>
                <p className="text-[#d6c4af] font-body text-sm italic">
                  {release.artist} · Disponible en {release.availableInDays} días
                </p>
              </div>

              {/* Calendar icon */}
              <span className="material-symbols-outlined text-[#ffb950]/40 group-hover:text-[#ffb950] transition-colors">
                calendar_today
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
