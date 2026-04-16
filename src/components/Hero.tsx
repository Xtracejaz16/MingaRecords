export function Hero() {
  return (
    <section className="relative min-h-screen pt-32 pb-20 flex flex-col items-center justify-center text-center pattern-vueltiao overflow-hidden">
      {/* Rotating Muisca Emblem Background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
        <svg className="solar-emblem w-[600px] h-[600px]" fill="none" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" stroke="#C8860A" strokeDasharray="2 2" strokeWidth="0.5" />
          <path d="M50 5 L55 45 L95 50 L55 55 L50 95 L45 55 L5 50 L45 45 Z" fill="#C8860A" />
          <circle cx="50" cy="50" r="10" stroke="#C8860A" strokeWidth="1" />
        </svg>
      </div>
      
      <div className="relative z-10 px-6">
        <p className="font-cinzel text-muiscaGold tracking-[0.4em] mb-4 text-sm md:text-lg animate-pulse">
          BIENVENIDOS AL ORIGEN
        </p>
        <h1 className="font-cinzel text-5xl md:text-8xl font-black text-koguiCream mb-6 leading-none">
          EL RITMO <br /> <span className="text-muiscaGold">NACIÓ AQUÍ</span>
        </h1>
        <p className="text-xl md:text-2xl font-light italic mb-10 max-w-2xl mx-auto opacity-80">
          "Del territorio colombiano al mundo — beats con raíz"
        </p>
        <div className="flex flex-col md:flex-row gap-6 justify-center">
          <a 
            className="px-10 py-4 bg-muiscaGold text-obsidian font-cinzel font-bold tracking-widest hover:bg-koguiCream transition-all duration-300 transform hover:-translate-y-1 shadow-[0_0_20px_rgba(200,134,10,0.3)] cursor-pointer"
            href="#cosecha"
          >
            EXPLORAR BEATS
          </a>
          <a 
            className="px-10 py-4 border-2 border-wayuuJade text-wayuuJade font-cinzel font-bold tracking-widest hover:bg-wayuuJade hover:text-white transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
            href="#/ser-productor"
          >
            SER PRODUCTOR
          </a>
        </div>
      </div>
    </section>
  );
}