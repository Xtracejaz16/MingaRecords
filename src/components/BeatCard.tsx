import type { Beat } from '../types';

interface BeatCardProps {
  beat: Beat;
}

export function BeatCard({ beat }: BeatCardProps) {
  return (
    <div className="group relative p-1 bg-gradient-to-br from-muiscaGold/40 to-transparent">
      <div className="bg-obsidian p-6 border border-muiscaGold/20 relative overflow-hidden">
        {/* Angled Corner Detail */}
        <div 
          className="absolute top-0 right-0 w-8 h-8 bg-muiscaGold/10" 
          style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
        />
        
        <div className="aspect-square bg-neutral-900 mb-6 relative overflow-hidden">
          <img 
            alt={beat.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
            src={beat.imageUrl} 
          />
          <button className="absolute inset-0 flex items-center justify-center bg-obsidian/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 rounded-full bg-muiscaGold flex items-center justify-center text-obsidian">
              <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </button>
        </div>
        
        <h3 className="font-cinzel text-xl font-bold mb-1">{beat.title}</h3>
        <p className="text-sm tracking-widest text-wayuuJade uppercase mb-4">{beat.genre}</p>
        
        <div className="flex justify-between items-center pt-4 border-t border-koguiCream/10">
          <span className="font-cinzel text-muiscaGold">${beat.price}</span>
          <button className="text-xs font-cinzel tracking-widest hover:text-white transition-colors">
            AÑADIR +
          </button>
        </div>
      </div>
    </div>
  );
}