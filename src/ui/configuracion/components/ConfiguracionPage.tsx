import { SideNavBar } from '../../shared/components/SideNavBar';
import { TopNavBar } from '../../shared/components/TopNavBar';

const CONFIG_DATA = {
  email: 'productor@mingarecords.com',
  notifyEmail: true,
  notifyVentas: true,
  notifyAnalisis: false,
  idioma: 'es-CO',
  moneda: 'COP',
};

export function ConfiguracionPage() {
  return (
    <main className="page-shell page-shell--dashboard min-h-screen bg-obsidian font-body text-koguiCream mineral-grain">
      <TopNavBar />
      <SideNavBar currentRoute="configuracion" />

      <div className="page-shell__grain" />
      <div className="page-shell__pattern" />

      <div className="relative ml-64 mt-20 flex max-w-7xl flex-1 flex-col gap-12 bg-transparent p-12 pattern-vueltiao-subtle">
        <section className="relative flex flex-col gap-6">
          <h1 className="font-headline text-6xl font-black leading-none tracking-tighter text-koguiCream md:text-7xl">
            <span className="text-muiscaGold">CONFIGURACIÓN</span> DE CUENTA
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-muiscaGold/30" />
            <span className="font-headline text-xl italic uppercase tracking-[0.4em] text-taironaTerracotta">Preferencias y Ajustes</span>
            <div className="h-px w-12 bg-muiscaGold/30" />
          </div>
        </section>

        <div className="mt-4 space-y-6 max-w-2xl">
          <div className="stone-tablet tunjo-clip p-6">
            <h2 className="font-headline text-xl text-muiscaGold mb-4">Información de Cuenta</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-koguiCream/70">Email</span>
                <span className="text-koguiCream">{CONFIG_DATA.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-koguiCream/70">Idioma</span>
                <span className="text-koguiCream">{CONFIG_DATA.idioma}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-koguiCream/70">Moneda</span>
                <span className="text-koguiCream">{CONFIG_DATA.moneda}</span>
              </div>
            </div>
          </div>

          <div className="stone-tablet tunjo-clip p-6">
            <h2 className="font-headline text-xl text-muiscaGold mb-4">Notificaciones</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-koguiCream/70">Email de notificaciones</span>
                <input type="checkbox" checked={CONFIG_DATA.notifyEmail} readOnly className="w-5 h-5 accent-muiscaGold" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-koguiCream/70">Notificaciones de ventas</span>
                <input type="checkbox" checked={CONFIG_DATA.notifyVentas} readOnly className="w-5 h-5 accent-muiscaGold" />
              </label>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-koguiCream/70">Resumen de análisis semanal</span>
                <input type="checkbox" checked={CONFIG_DATA.notifyAnalisis} readOnly className="w-5 h-5 accent-muiscaGold" />
              </label>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}