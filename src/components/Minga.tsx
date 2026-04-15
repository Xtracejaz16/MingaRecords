import { manifesto } from '../data';

export function Minga() {
  return (
    <section className="relative py-32 bg-taironaTerracotta overflow-hidden" id="minga">
      {/* Kogui Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <svg fill="white" height="400" viewBox="0 0 100 100" width="400">
          <path d="M50 0 L100 50 L50 100 L0 50 Z" />
        </svg>
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <blockquote className="font-crimson italic text-3xl md:text-5xl leading-tight text-koguiCream">
          "{manifesto.quote}"
        </blockquote>
        <p className="mt-12 font-cinzel tracking-widest font-bold text-muiscaGold">
          {manifesto.attribution}
        </p>
      </div>
    </section>
  );
}