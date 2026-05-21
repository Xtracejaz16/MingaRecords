import { SideNavBar } from '../../shared/components/SideNavBar';
import { TopNavBar } from '../../shared/components/TopNavBar';

const BEATS_DATA = [
  { id: '1', title: 'Luna de Medellín', bpm: 140, key: 'Am', price: 29.99, plays: 1243 },
  { id: '2', title: 'Selva Sonora', bpm: 128, key: 'Cm', price: 34.99, plays: 892 },
  { id: '3', title: 'Cumbia Cósmica', bpm: 95, key: 'Fm', price: 24.99, plays: 2105 },
  { id: '4', title: 'Vallenato Digital', bpm: 110, key: 'Gm', price: 19.99, plays: 567 },
  { id: '5', title: 'Bosque Lluvioso', bpm: 135, key: 'Em', price: 39.99, plays: 324 },
];

export function BeatsPage() {
  return (
    <main className="page-shell page-shell--dashboard min-h-screen bg-obsidian font-body text-koguiCream mineral-grain">
      <TopNavBar />
      <SideNavBar />

      <div className="page-shell__grain" />
      <div className="page-shell__pattern" />

      <div className="relative ml-64 mt-20 flex max-w-7xl flex-1 flex-col gap-12 bg-transparent p-12 pattern-vueltiao-subtle">
        <section className="relative flex flex-col gap-6">
          <h1 className="font-headline text-6xl font-black leading-none tracking-tighter text-koguiCream md:text-7xl">
            TU CATÁLOGO DE <span className="text-muiscaGold">BEATS</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-muiscaGold/30" />
            <span className="font-headline text-xl italic uppercase tracking-[0.4em] text-taironaTerracotta">5 Beats Publicados</span>
            <div className="h-px w-12 bg-muiscaGold/30" />
          </div>
        </section>

        <div className="mt-8 overflow-hidden rounded-lg border border-koguiCream/20 stone-tablet">
          <table className="w-full">
            <thead className="bg-obsidian/50 text-left text-sm uppercase tracking-wider text-koguiCream/70">
              <tr>
                <th className="p-4">Título</th>
                <th className="p-4">BPM</th>
                <th className="p-4">Tonalidad</th>
                <th className="p-4">Precio</th>
                <th className="p-4">Reproducciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-koguiCream/10">
              {BEATS_DATA.map((beat) => (
                <tr key={beat.id} className="hover:bg-muiscaGold/5 transition-colors">
                  <td className="p-4 font-medium text-koguiCream">{beat.title}</td>
                  <td className="p-4 text-koguiCream/80">{beat.bpm}</td>
                  <td className="p-4 text-koguiCream/80">{beat.key}</td>
                  <td className="p-4 text-muiscaGold">${beat.price}</td>
                  <td className="p-4 text-koguiCream/80">{beat.plays.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}