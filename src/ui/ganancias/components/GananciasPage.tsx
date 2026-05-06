import { SideNavBar } from '../../shared/components/SideNavBar';
import { TopNavBar } from '../../shared/components/TopNavBar';

const COP_FORMAT = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const GANANCIAS_DATA = {
  total: 2847.50,
  pendientes: 423.00,
  mes: [
    { fecha: '2026-04', monto: 892.00, beatsVendidos: 12 },
    { fecha: '2026-03', monto: 1124.00, beatsVendidos: 18 },
    { fecha: '2026-02', monto: 631.50, beatsVendidos: 9 },
    { fecha: '2026-01', monto: 200.00, beatsVendidos: 4 },
  ],
};

export function GananciasPage() {
  return (
    <main className="page-shell page-shell--dashboard min-h-screen bg-obsidian font-body text-koguiCream mineral-grain">
      <TopNavBar />
      <SideNavBar currentRoute="ganancias" />

      <div className="page-shell__grain" />
      <div className="page-shell__pattern" />

      <div className="relative ml-64 mt-20 flex max-w-7xl flex-1 flex-col gap-12 bg-transparent p-12 pattern-vueltiao-subtle">
        <section className="relative flex flex-col gap-6">
          <h1 className="font-headline text-6xl font-black leading-none tracking-tighter text-koguiCream md:text-7xl">
            TUS <span className="text-muiscaGold">GANANCIAS</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-muiscaGold/30" />
            <span className="font-headline text-xl italic uppercase tracking-[0.4em] text-taironaTerracotta">Historial de Ingresos</span>
            <div className="h-px w-12 bg-muiscaGold/30" />
          </div>
        </section>

        <div className="grid grid-cols-3 gap-6">
          <div className="stone-tablet tunjo-clip p-6">
            <p className="text-sm uppercase tracking-wider text-koguiCream/70">Total Histórico</p>
            <p className="font-headline text-4xl text-muiscaGold">${GANANCIAS_DATA.total}</p>
          </div>
          <div className="stone-tablet tunjo-clip p-6">
            <p className="text-sm uppercase tracking-wider text-koguiCream/70">Pendiente de Cobro</p>
            <p className="font-headline text-4xl text-taironaTerracotta">${GANANCIAS_DATA.pendientes}</p>
          </div>
          <div className="stone-tablet tunjo-clip p-6">
            <p className="text-sm uppercase tracking-wider text-koguiCream/70">Este Mes</p>
            <p className="font-headline text-4xl text-koguiCream">{COP_FORMAT.format(GANANCIAS_DATA.mes[0].monto)}</p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-koguiCream/20 stone-tablet">
          <table className="w-full">
            <thead className="bg-obsidian/50 text-left text-sm uppercase tracking-wider text-koguiCream/70">
              <tr>
                <th className="p-4">Mes</th>
                <th className="p-4">Ingresos</th>
                <th className="p-4">Beats Vendidos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-koguiCream/10">
              {GANANCIAS_DATA.mes.map((item) => (
                <tr key={item.fecha} className="hover:bg-muiscaGold/5 transition-colors">
                  <td className="p-4 font-medium text-koguiCream">{item.fecha}</td>
                  <td className="p-4 text-muiscaGold">${item.monto}</td>
                  <td className="p-4 text-koguiCream/80">{item.beatsVendidos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}