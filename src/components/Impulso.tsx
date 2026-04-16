import { stats } from '../data';

export function Impulso() {
  return (
    <section className="py-20 bg-taironaTerracotta text-koguiCream" id="impulso">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
        {stats.map((stat, index) => (
          <div key={index} className="reveal">
            <span className="block font-cinzel text-5xl font-black mb-2">{stat.value}</span>
            <span className="block tracking-[0.3em] text-xs uppercase opacity-80 font-cinzel">{stat.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}