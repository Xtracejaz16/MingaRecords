import { SideNavBar } from '../../shared/components/SideNavBar';
import { TopNavBar } from '../../shared/components/TopNavBar';

const ACTUALIZACIONES_DATA = [
  { id: '1', titulo: 'Nueva función de análisis de audiencia', fecha: '2026-04-15', estado: 'disponible' },
  { id: '2', titulo: 'Mejoras en el reproductor de audio', fecha: '2026-04-10', estado: 'disponible' },
  { id: '3', titulo: 'Exportación de beats en formato WAV', fecha: '2026-04-20', estado: 'pronto' },
  { id: '4', titulo: 'Integración con distributor digital', fecha: '2026-05-01', estado: 'pronto' },
];

export function ActualizacionesPage() {
  return (
    <main className="page-shell page-shell--dashboard min-h-screen bg-obsidian font-body text-koguiCream mineral-grain">
      <TopNavBar />
      <SideNavBar />

      <div className="page-shell__grain" />
      <div className="page-shell__pattern" />

      <div className="relative ml-64 mt-20 flex max-w-7xl flex-1 flex-col gap-12 bg-transparent p-12 pattern-vueltiao-subtle">
        <section className="relative flex flex-col gap-6">
          <h1 className="font-headline text-6xl font-black leading-none tracking-tighter text-koguiCream md:text-7xl">
            <span className="text-muiscaGold">ACTUALIZACIONES</span> DEL SISTEMA
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-muiscaGold/30" />
            <span className="font-headline text-xl italic uppercase tracking-[0.4em] text-taironaTerracotta">Novedades y Próximamente</span>
            <div className="h-px w-12 bg-muiscaGold/30" />
          </div>
        </section>

        <div className="mt-4 space-y-4">
          {ACTUALIZACIONES_DATA.map((actualizacion) => (
            <div
              key={actualizacion.id}
              className="stone-tablet tunjo-clip flex items-center justify-between p-6 transition-colors hover:bg-muiscaGold/5"
            >
              <div className="flex flex-col gap-2">
                <h3 className="font-headline text-xl text-koguiCream">{actualizacion.titulo}</h3>
                <p className="text-sm text-koguiCream/70">{actualizacion.fecha}</p>
              </div>
              <span
                className={`rounded-full px-4 py-1 text-sm uppercase tracking-wider ${
                  actualizacion.estado === 'disponible'
                    ? 'bg-muiscaGold/20 text-muiscaGold'
                    : 'bg-taironaTerracotta/20 text-taironaTerracotta'
                }`}
              >
                {actualizacion.estado}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}