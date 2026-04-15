import { useState } from 'react';
import { BeatCard } from './BeatCard';
import { beats, genres } from '../data';

export function Cosecha() {
  const [activeFilter, setActiveFilter] = useState('TODO');

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto reveal" id="cosecha">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12">
        <div>
          <h2 className="font-cinzel text-4xl font-bold text-muiscaGold mb-2">LA COSECHA</h2>
          <p className="italic text-lg opacity-70">Sonidos sembrados en tierras sagradas.</p>
        </div>
        <div className="flex gap-4 mt-6 md:mt-0 font-cinzel text-xs tracking-widest overflow-x-auto pb-2 w-full md:w-auto">
          {genres.map((genre) => (
            <button
              key={genre}
              onClick={() => setActiveFilter(genre)}
              className={`px-4 py-2 border transition-colors ${
                activeFilter === genre
                  ? 'border-muiscaGold text-muiscaGold bg-muiscaGold/10'
                  : 'border-koguiCream/20 hover:border-muiscaGold'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {beats.map((beat) => (
          <BeatCard key={beat.id} beat={beat} />
        ))}
      </div>
    </section>
  );
}