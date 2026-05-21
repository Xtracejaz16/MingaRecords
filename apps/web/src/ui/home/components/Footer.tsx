export function Footer() {
  return (
    <footer className="bg-obsidian pt-24 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center text-center">
          <div className="font-cinzel text-3xl font-black text-muiscaGold mb-8">
            MINGA <span className="text-taironaTerracotta">RECORDS</span>
          </div>
          
          {/* Zenu Divider */}
          <div className="w-full flex items-center justify-center gap-4 mb-12">
            <div className="h-[1px] bg-gradient-to-r from-transparent to-muiscaGold flex-grow" />
            <svg className="text-muiscaGold" fill="none" height="40" viewBox="0 0 100 100" width="40">
              <path d="M50 10 C30 10 10 30 10 50 C10 70 30 90 50 90 C70 90 90 70 90 50 C90 30 70 10 50 10 Z M50 25 C65 25 75 35 75 50 C75 65 65 75 50 75 C35 75 25 65 25 50 C25 35 35 25 50 25 Z" fill="currentColor" />
            </svg>
            <div className="h-[1px] bg-gradient-to-l from-transparent to-muiscaGold flex-grow" />
          </div>
          
          <div className="flex gap-8 mb-16">
            <a className="text-koguiCream/60 hover:text-muiscaGold transition-colors" href="https://instagram.com/" aria-label="Instagram" rel="noreferrer" target="_blank">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a className="text-koguiCream/60 hover:text-muiscaGold transition-colors" href="https://youtube.com/" aria-label="YouTube" rel="noreferrer" target="_blank">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
              </svg>
            </a>
          </div>
          
          <p className="text-xs font-cinzel tracking-[0.2em] opacity-40">
            © 2024 MINGA RECORDS. ORIGEN COLOMBIANO.
          </p>
        </div>
      </div>
      
      {/* Pattern Base */}
      <div className="w-full h-8 mt-12 pattern-vueltiao opacity-20" />
    </footer>
  );
}
