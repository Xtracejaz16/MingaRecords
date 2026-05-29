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
      <SideNavBar />

      <div className="page-shell__grain" />
      <div className="page-shell__pattern" />

      <div className="relative ml-64 mt-20 flex max-w-7xl flex-1 flex-col gap-12 bg-transparent p-12 bg-[url('data:image/svg+xml,%3Csvg%20width=%2760%27%20height=%2760%27%20viewBox=%270%200%2060%2060%27%20xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath%20d=%27M30%200L60%2030L30%2060L0%2030L30%200ZM30%2010L50%2030L30%2050L10%2030L30%2010Z%27%20fill=%27%23C8860A%27%20fill-opacity=%270.04%27/%3E%3C/svg%3E')]">
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