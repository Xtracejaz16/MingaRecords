import type { Beat } from '../../../domain/marketplace/Beat';

interface BeatCardProps {
  beat: Beat;
  isFavorite: boolean;
  onToggleFavorite: (beatId: string) => void;
  onPlay: (beat: Beat) => void;
  onPurchase: (beat: Beat) => void;
}

const GENRE_COLORS: Record<string, { bg: string; text: string }> = {
  AFROBEAT: { bg: 'bg-wayuuJade', text: 'text-white' },
  CHAMPETA: { bg: 'bg-zenuCopper', text: 'text-obsidian' },
  CUMBIA: { bg: 'bg-emberaNavy', text: 'text-paleCream' },
  TRAP: { bg: 'bg-taironaTerracotta', text: 'text-white' },
  'R&B': { bg: 'bg-wayuuJade', text: 'text-white' },
  VALLENATO: { bg: 'bg-zenuCopper', text: 'text-obsidian' },
};

function getGenreStyle(genre: string) {
  return GENRE_COLORS[genre.toUpperCase()] ?? { bg: 'bg-darkMud', text: 'text-paleCream' };
}

export function BeatCard({ beat, isFavorite, onToggleFavorite, onPlay, onPurchase }: BeatCardProps) {
  const genreStyle = getGenreStyle(beat.genre);

  return (
    <div className="bg-deepObsidian border border-brightGold/20 p-4 group hover:border-brightGold/50 transition-all duration-500">
      {/* Image */}
      <div className="relative aspect-square mb-6 overflow-hidden bg-mud">
        {beat.coverUrl ? (
          <img
            src={beat.coverUrl}
            alt={beat.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
          />
        ) : (
          <div className="w-full h-full bg-mud flex items-center justify-center">
            <span className="material-symbols-outlined text-mutedCream/40 text-5xl">music_note</span>
          </div>
        )}

        {/* Play overlay */}
        <button
          type="button"
          className="absolute inset-0 bg-obsidian/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          onClick={() => onPlay(beat)}
          aria-label={`Reproducir ${beat.title}`}
        >
          <div className="w-16 h-16 rounded-full border-2 border-brightGold flex items-center justify-center text-brightGold bg-obsidian/60 backdrop-blur-sm">
            <span
              className="material-symbols-outlined text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              play_arrow
            </span>
          </div>
        </button>

        {/* Favorite button */}
        <button
          className="absolute top-4 right-4 z-10 bg-obsidian/60 backdrop-blur-sm rounded-full p-2 transition-transform duration-300 active:scale-125 cursor-pointer"
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
        <h3 className="text-paleCream font-display text-xl font-bold">
          {beat.title}
        </h3>
        <p className="text-mutedCream/70 font-body text-xs tracking-[0.2em] uppercase">
          PROD BY {beat.artist}
        </p>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-outline/10">
        <span className="font-display text-brightGold text-lg font-bold">
          ${beat.price.toLocaleString('es-CO')}
        </span>
          <button
            className="bg-brightGold/10 hover:bg-brightGold text-brightGold hover:text-deepBrown px-4 py-2 text-xs font-display font-bold tracking-widest border border-brightGold/50 transition-all cursor-pointer"
            onClick={() => onPurchase(beat)}
          >
            ADQUIRIR
          </button>
      </div>
    </div>
  );
}
