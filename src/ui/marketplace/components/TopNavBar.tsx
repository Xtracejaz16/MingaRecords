import { BrandLogo } from '../../shared/components/BrandLogo';

export function TopNavBar() {
  return (
    <header className="h-20 w-full flex-shrink-0 z-50 bg-obsidian/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(69,43,0,0.15)] border-b border-outline/10">
      <div className="h-full flex items-center justify-between px-12">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <BrandLogo primaryColor="text-brightGold" accentColor="text-blush" className="text-2xl tracking-[0.1em]" />
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8 font-display text-sm tracking-widest uppercase">
          <span className="text-brightGold border-b-2 border-brightGold pb-1">
            MARKETPLACE
          </span>
          <span className="text-mutedCream hover:text-wayuuJade transition-colors cursor-pointer">
            LIBRARY
          </span>
          <span className="text-mutedCream hover:text-zenuCopper transition-colors cursor-pointer">
            MINGA UPDATES
          </span>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-6">
          <button className="bg-brightGold text-[#452b00] /* TODO: token para deepBrown */ px-6 py-2 font-display text-sm font-bold tracking-widest active:scale-95 transition-transform">
            EXPLORAR BEATS
          </button>

          {/* Notifications */}
          <button className="relative group cursor-pointer">
            <span className="material-symbols-outlined text-mutedCream group-hover:text-brightGold transition-colors">
              notifications
            </span>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-taironaTerracotta" />
          </button>

          {/* Avatar */}
          <div className="w-10 h-10 border border-brightGold/30 flex items-center justify-center bg-darkMud">
            <span className="material-symbols-outlined text-mutedCream text-lg">
              person
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
