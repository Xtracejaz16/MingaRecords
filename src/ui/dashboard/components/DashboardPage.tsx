import { useDashboard } from '../hooks/useDashboard';
import { ActivityFeed } from './ActivityFeed';
import { BeatsTable } from './BeatsTable';
import { DashboardFooter } from './DashboardFooter';
import { StatsGrid } from './StatsGrid';
import { SideNavBar } from '../../shared/components/SideNavBar';
import { TopNavBar } from '../../shared/components/TopNavBar';
import { WayuuDivider } from '../../shared/components/WayuuDivider';

function DashboardLoading() {
  return <div className="stone-tablet tunjo-clip p-8 text-center font-body italic text-koguiCream/70">Cosechando el territorio...</div>;
}

function DashboardError({ message }: { message: string }) {
  return <div className="stone-tablet tunjo-clip p-8 text-center font-body italic text-red-300">{message}</div>;
}

export function DashboardPage() {
  const { loading, error, stats, beats, activity } = useDashboard();

  return (
    <main className="page-shell page-shell--dashboard min-h-screen bg-obsidian font-body text-koguiCream mineral-grain">
      <TopNavBar />
      <SideNavBar currentRoute="panel" />

      <div className="page-shell__grain" />
      <div className="page-shell__pattern" />

      <div className="relative ml-64 mt-20 flex max-w-7xl flex-1 flex-col gap-12 bg-transparent p-12 pattern-vueltiao-subtle">
        <section className="relative flex flex-col gap-6">
          <h1 className="font-headline text-6xl font-black leading-none tracking-tighter text-koguiCream md:text-7xl">
            TU TERRITORIO DE <span className="text-muiscaGold">SONIDO</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-muiscaGold/30" />
            <span className="font-headline text-xl italic uppercase tracking-[0.4em] text-taironaTerracotta">Cosecha del Mes</span>
            <div className="h-px w-12 bg-muiscaGold/30" />
          </div>
        </section>

        {loading ? <DashboardLoading /> : null}
        {error ? <DashboardError message={error} /> : null}

        {!loading && !error && stats && beats.length > 0 && activity.length > 0 ? (
          <>
            <StatsGrid stats={stats} />
            <WayuuDivider className="my-4 w-full opacity-20" />
            <BeatsTable beats={beats} />
            <ActivityFeed activity={activity} />
          </>
        ) : null}

        <DashboardFooter />
      </div>
    </main>
  );
}
