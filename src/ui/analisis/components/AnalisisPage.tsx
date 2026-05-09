import { SideNavBar } from '../../shared/components/SideNavBar';
import { TopNavBar } from '../../shared/components/TopNavBar';

const ANALISIS_DATA = {
  reproduccionesTotales: 15234,
  reproduccionesUnicas: 8921,
  tiempoReproducido: '4,230 hrs',
  tasaConversion: 3.2,
  topTerritorios: [
    { pais: 'Colombia', reproducciones: 5234 },
    { pais: 'México', reproducciones: 3210 },
    { pais: 'España', reproducciones: 2100 },
    { pais: 'Argentina', reproducciones: 1890 },
    { pais: 'Chile', reproducciones: 1456 },
  ],
};

export function AnalisisPage() {
  return (
    <main className="page-shell page-shell--dashboard min-h-screen bg-obsidian font-body text-koguiCream mineral-grain">
      <TopNavBar />
      <SideNavBar />

      <div className="page-shell__grain" />
      <div className="page-shell__pattern" />

      <div className="relative ml-64 mt-20 flex max-w-7xl flex-1 flex-col gap-12 bg-transparent p-12 pattern-vueltiao-subtle">
        <section className="relative flex flex-col gap-6">
          <h1 className="font-headline text-6xl font-black leading-none tracking-tighter text-koguiCream md:text-7xl">
            ANÁLISIS DE <span className="text-muiscaGold">AUDIENCIA</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-muiscaGold/30" />
            <span className="font-headline text-xl italic uppercase tracking-[0.4em] text-taironaTerracotta">Métricas y Territorios</span>
            <div className="h-px w-12 bg-muiscaGold/30" />
          </div>
        </section>

        <div className="grid grid-cols-4 gap-6">
          <div className="stone-tablet tunjo-clip p-6">
            <p className="text-sm uppercase tracking-wider text-koguiCream/70">Reproducciones</p>
            <p className="font-headline text-3xl text-muiscaGold">{ANALISIS_DATA.reproduccionesTotales.toLocaleString()}</p>
          </div>
          <div className="stone-tablet tunjo-clip p-6">
            <p className="text-sm uppercase tracking-wider text-koguiCream/70">Únicas</p>
            <p className="font-headline text-3xl text-koguiCream">{ANALISIS_DATA.reproduccionesUnicas.toLocaleString()}</p>
          </div>
          <div className="stone-tablet tunjo-clip p-6">
            <p className="text-sm uppercase tracking-wider text-koguiCream/70">Tiempo Total</p>
            <p className="font-headline text-3xl text-taironaTerracotta">{ANALISIS_DATA.tiempoReproducido}</p>
          </div>
          <div className="stone-tablet tunjo-clip p-6">
            <p className="text-sm uppercase tracking-wider text-koguiCream/70">Conversión</p>
            <p className="font-headline text-3xl text-koguiCream">{ANALISIS_DATA.tasaConversion}%</p>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-koguiCream/20 stone-tablet p-6">
          <h2 className="font-headline text-2xl text-koguiCream mb-6">Top Territorios</h2>
          <div className="space-y-4">
            {ANALISIS_DATA.topTerritorios.map((territorio, index) => (
              <div key={territorio.pais} className="flex items-center gap-4">
                <span className="w-8 text-sm text-koguiCream/50">#{index + 1}</span>
                <span className="flex-1 font-medium text-koguiCream">{territorio.pais}</span>
                <div className="flex-1 h-2 bg-obsidian rounded-full overflow-hidden">
                  <div
                    className="h-full bg-muiscaGold rounded-full"
                    style={{ width: `${(territorio.reproducciones / ANALISIS_DATA.topTerritorios[0].reproducciones) * 100}%` }}
                  />
                </div>
                <span className="w-20 text-right text-koguiCream/80">{territorio.reproducciones.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}