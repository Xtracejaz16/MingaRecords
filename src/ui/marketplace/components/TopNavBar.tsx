import { BrandLogo } from '../../shared/components/BrandLogo';

export function TopNavBar() {
  return (
    <header className="h-20 w-full flex-shrink-0 z-50 bg-[#0F0A00]/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(69,43,0,0.15)] border-b border-[#514535]/10">
      <div className="h-full flex items-center justify-between px-12">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <BrandLogo primaryColor="text-[#ffb950]" accentColor="text-[#ffb59f]" className="text-2xl tracking-[0.1em]" />
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8 font-display text-sm tracking-widest uppercase">
          <span className="text-[#ffb950] border-b-2 border-[#ffb950] pb-1">
            MARKETPLACE
          </span>
          <span className="text-[#d6c4af] hover:text-[#1A7A6E] transition-colors cursor-pointer">
            LIBRARY
          </span>
          <span className="text-[#d6c4af] hover:text-[#B5651D] transition-colors cursor-pointer">
            MINGA UPDATES
          </span>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-6">
          <button className="bg-[#ffb950] text-[#452b00] px-6 py-2 font-display text-sm font-bold tracking-widest active:scale-95 transition-transform">
            EXPLORAR BEATS
          </button>

          {/* Notifications */}
          <button className="relative group cursor-pointer">
            <span className="material-symbols-outlined text-[#d6c4af] group-hover:text-[#ffb950] transition-colors">
              notifications
            </span>
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#8B2500]" />
          </button>

          {/* Avatar */}
          <div className="w-10 h-10 border border-[#ffb950]/30 flex items-center justify-center bg-[#302915]">
            <span className="material-symbols-outlined text-[#d6c4af] text-lg">
              person
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
