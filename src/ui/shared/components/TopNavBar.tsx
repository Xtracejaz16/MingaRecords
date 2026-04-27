import { BrandLogo } from './BrandLogo';

export function TopNavBar() {
  return (
    <header className="fixed top-0 z-50 flex h-20 w-full items-center justify-between border-b border-taironaTerracotta/30 bg-obsidian/95 px-8 font-headline tracking-widest text-muiscaGold shadow-2xl backdrop-blur-md">
      <BrandLogo className="text-2xl font-black uppercase tracking-[0.2em]" />

      <nav className="hidden items-center gap-8 text-xs md:flex">
        <a className="uppercase text-koguiCream/60 transition-colors hover:text-muiscaGold" href="#">
          Marketplace
        </a>
        <a className="uppercase text-koguiCream/60 transition-colors hover:text-muiscaGold" href="#">
          Library
        </a>
        <a className="uppercase text-koguiCream/60 transition-colors hover:text-muiscaGold" href="#">
          Minga Updates
        </a>
      </nav>

      <div className="flex items-center gap-6">
        <button className="bg-muiscaGold px-6 py-2 font-bold uppercase tracking-widest text-obsidian shadow-lg shadow-muiscaGold/10 transition-all duration-300 hover:bg-koguiCream" type="button">
          Upload Beat
        </button>

        <div className="flex gap-4 text-koguiCream/60">
          <span className="material-symbols-outlined cursor-pointer transition-colors hover:text-muiscaGold">notifications</span>
          <span className="material-symbols-outlined cursor-pointer transition-colors hover:text-muiscaGold">account_circle</span>
        </div>
      </div>
    </header>
  );
}
