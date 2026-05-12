import type { Beat } from '../../../domain/marketplace/Beat';

interface BeatCardProps {
  beat: Beat;
  isFavorite: boolean;
  onToggleFavorite: (beatId: string) => void;
  onPlay: (beat: Beat) => void;
  onPurchase: (beat: Beat) => void;
}

const GENRE_COLORS: Record<string, { bg: string; text: string }> = {
  AFROBEAT: { bg: 'bg-[#1A7A6E]', text: 'text-white' },
  CHAMPETA: { bg: 'bg-[#B5651D]', text: 'text-[#0F0A00]' },
  CUMBIA: { bg: 'bg-[#1A2340]', text: 'text-[#efe2c2]' },
  TRAP: { bg: 'bg-[#8B2500]', text: 'text-white' },
  'R&B': { bg: 'bg-[#1A7A6E]', text: 'text-white' },
  VALLENATO: { bg: 'bg-[#B5651D]', text: 'text-[#0F0A00]' },
};

function getGenreStyle(genre: string) {
  return GENRE_COLORS[genre.toUpperCase()] ?? { bg: 'bg-[#302915]', text: 'text-[#efe2c2]' };
}

export function BeatCard({ beat, isFavorite, onToggleFavorite, onPlay, onPurchase }: BeatCardProps) {
  const genreStyle = getGenreStyle(beat.genre);
  const coverSrc = beat.coverUrl || `https://picsum.photos/400/400?random=${beat.id}`;

  return (
    <div className="bg-[#211b08] border border-[#ffb950]/20 p-4 group hover:border-[#ffb950]/50 transition-all duration-500">
      {/* Image */}
      <div className="relative aspect-square mb-6 overflow-hidden bg-[#3b341f]">
        <img
          src={coverSrc}
          alt={beat.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
        />

        {/* Play overlay */}
        <div
          className="absolute inset-0 bg-[#0F0A00]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          onClick={() => onPlay(beat)}
        >
          <div className="w-16 h-16 rounded-full border-2 border-[#ffb950] flex items-center justify-center text-[#ffb950] bg-[#0F0A00]/60 backdrop-blur-sm">
            <span
              className="material-symbols-outlined text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              play_arrow
            </span>
          </div>
        </div>

        {/* Favorite button */}
        <button
          className="absolute top-4 right-4 z-10 bg-[#0F0A00]/60 backdrop-blur-sm rounded-full p-2 transition-transform duration-300 active:scale-125 cursor-pointer"
          onClick={() => onToggleFavorite(beat.id)}
        >
          <span
            className="material-symbols-outlined text-sm"
            style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}
          >
            {isFavorite ? 'favorite' : 'favorite_border'}
          </span>
        </button>
      </div>

      {/* Info */}
      <div>
        <span
          className={`${genreStyle.bg} ${genreStyle.text} text-[9px] px-2 py-0.5 font-display tracking-[0.2em] uppercase mb-2 inline-block`}
        >
          {beat.genre}
        </span>
        <h3 className="text-[#efe2c2] font-display text-xl font-bold">
          {beat.title}
        </h3>
        <p className="text-[#d6c4af]/70 font-body text-xs tracking-[0.2em] uppercase">
          PROD BY {beat.artist}
        </p>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-[#514535]/10">
        <span className="font-display text-[#ffb950] text-lg font-bold">
          ${beat.price}
        </span>
        <button
          className="bg-[#ffb950]/10 hover:bg-[#ffb950] text-[#ffb950] hover:text-[#452b00] px-4 py-2 text-xs font-display font-bold tracking-widest border border-[#ffb950]/50 transition-all cursor-pointer"
          onClick={() => onPurchase(beat)}
        >
          ADQUIRIR
        </button>
      </div>
    </div>
  );
}
