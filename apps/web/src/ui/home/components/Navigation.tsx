import { useState } from 'react';

interface NavigationProps {
  onNavigate?: (id: string) => void;
}

export function Navigation({ onNavigate }: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(targetId);
    } else {
      const element = document.querySelector(targetId);
      if (element && 'offsetTop' in element) {
        const htmlElement = element as HTMLElement;
        window.scrollTo({
          top: htmlElement.offsetTop - 80,
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-obsidian/90 backdrop-blur-md border-b border-muiscaGold/20 px-6 py-4 flex justify-between items-center">
      <div className="font-cinzel text-xl font-black tracking-widest text-muiscaGold">
        MINGA <span className="text-taironaTerracotta">RECORDS</span>
      </div>
      <div className="hidden md:flex space-x-8 font-cinzel text-xs tracking-[0.2em] uppercase">
        <a 
          className="hover:text-muiscaGold transition-colors cursor-pointer" 
          href="#cosecha"
          onClick={(e) => handleNavClick(e, '#cosecha')}
        >
          Cosecha
        </a>
        <a 
          className="hover:text-muiscaGold transition-colors cursor-pointer" 
          href="#comunidad"
          onClick={(e) => handleNavClick(e, '#comunidad')}
        >
          Comunidad
        </a>
        <a 
          className="hover:text-muiscaGold transition-colors cursor-pointer" 
          href="#ofrendas"
          onClick={(e) => handleNavClick(e, '#ofrendas')}
        >
          Ofrendas
        </a>
        <a 
          className="hover:text-muiscaGold transition-colors cursor-pointer" 
          href="#minga"
          onClick={(e) => handleNavClick(e, '#minga')}
        >
          La Minga
        </a>
      </div>
      <button 
        className="md:hidden text-muiscaGold"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M4 6h16M4 12h16m-7 6h7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        </svg>
      </button>
      
      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <div className="absolute top-full left-0 w-full bg-obsidian/95 border-b border-muiscaGold/20 md:hidden">
          <div className="flex flex-col p-4 space-y-4 font-cinzel text-xs tracking-[0.2em] uppercase">
            <a 
              className="hover:text-muiscaGold transition-colors cursor-pointer" 
              href="#cosecha"
              onClick={(e) => { handleNavClick(e, '#cosecha'); setMobileOpen(false); }}
            >
              Cosecha
            </a>
            <a 
              className="hover:text-muiscaGold transition-colors cursor-pointer" 
              href="#comunidad"
              onClick={(e) => { handleNavClick(e, '#comunidad'); setMobileOpen(false); }}
            >
              Comunidad
            </a>
            <a 
              className="hover:text-muiscaGold transition-colors cursor-pointer" 
              href="#ofrendas"
              onClick={(e) => { handleNavClick(e, '#ofrendas'); setMobileOpen(false); }}
            >
              Ofrendas
            </a>
            <a 
              className="hover:text-muiscaGold transition-colors cursor-pointer" 
              href="#minga"
              onClick={(e) => { handleNavClick(e, '#minga'); setMobileOpen(false); }}
            >
              La Minga
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
