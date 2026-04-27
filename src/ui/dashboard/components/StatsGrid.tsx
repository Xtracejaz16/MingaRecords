import type { ProducerStats } from '../../../domain/dashboard/ProducerStats';

interface StatsGridProps {
  stats: ProducerStats;
}

interface StatCardProps {
  title: string;
  value: string;
  note: string;
  accentClassName: string;
  iconName: string;
  iconClassName: string;
  rotateClassName?: string;
  valueClassName: string;
}

function StatCard({ title, value, note, accentClassName, iconName, iconClassName, rotateClassName, valueClassName }: StatCardProps) {
  return (
    <div className="stone-tablet tunjo-clip group relative overflow-hidden p-8 transition-all duration-500 hover:border-muiscaGold">
      <div className={`absolute right-2 inset-y-0 flex items-center opacity-10 transition-opacity duration-500 group-hover:opacity-20 ${rotateClassName ?? ''}`}>
        <span
          className={`material-symbols-outlined ${iconClassName}`}
          style={{
            fontSize: '10rem',
            fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 48",
          }}
        >
          {iconName}
        </span>
      </div>
      <div className={`absolute left-0 top-8 h-12 w-1 ${accentClassName}`} />
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest font-headline text-taironaTerracotta">{title}</p>
      <h2 className={`font-headline text-4xl font-black tracking-tight ${valueClassName}`}>{value}</h2>
      <p className="mt-4 text-xs italic text-koguiCream/40">{note}</p>
    </div>
  );
}

function formatCurrency(value: number) {
  return `$${value.toLocaleString('es-CO')}`;
}

function formatStreams(value: number) {
  return `${(value / 1_000).toFixed(1)}K`;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <section className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <StatCard
        accentClassName="bg-muiscaGold"
        iconClassName="text-muiscaGold"
        iconName="payments"
        note="+15% from last lunar cycle"
        title="Earnings ($COP)"
        value={formatCurrency(stats.earningsCOP)}
        valueClassName="text-muiscaGold"
      />
      <StatCard
        accentClassName="bg-wayuuJade"
        iconClassName="text-wayuuJade"
        iconName="graphic_eq"
        note="Global territory reach"
        title="Total Streams"
        value={formatStreams(stats.totalStreams)}
        rotateClassName="-rotate-12"
        valueClassName="text-wayuuJade"
      />
      <StatCard
        accentClassName="bg-muiscaGold"
        iconClassName="text-koguiCream"
        iconName="verified"
        note="Active beat usage rights"
        title="New Licenses Sold"
        value={String(stats.licensessSold)}
        valueClassName="text-koguiCream"
      />
    </section>
  );
}
