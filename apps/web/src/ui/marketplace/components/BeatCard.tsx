import type { Beat } from '../../../domain/marketplace/Beat';

interface BeatCardProps {
  beat: Beat;
  isFavorite: boolean;
  onToggleFavorite: (beatId: string) => void;
  onPlay: (beat: Beat) => void;
  onPurchase: (beat: Beat) => void;
}

const GENRE_STYLES: Record<string, { bg: string; text: string; hoverBorder: string }> = {
  AFROBEAT: { bg: 'bg-[#1A7A6E]/20', text: 'text-[#1A7A6E]', hoverBorder: 'hover:border-[#1A7A6E]' },
  CHAMPETA: { bg: 'bg-[#B5651D]/20', text: 'text-[#B5651D]', hoverBorder: 'hover:border-[#B5651D]' },
  CUMBIA: { bg: 'bg-[#1A2340]', text: 'text-[#C8860A]', hoverBorder: 'hover:border-[#C8860A]' },
  TRAP: { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', hoverBorder: 'hover:bg-[#8B2500] hover:text-white' },
  'R&B': { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', hoverBorder: 'hover:bg-[#1A7A6E] hover:text-white' },
  VALLENATO: { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', hoverBorder: 'hover:bg-[#B5651D] hover:text-[#0F0A00]' },
};

function getGenreStyle(genre: string) {
  return GENRE_STYLES[genre.toUpperCase()] ?? { bg: 'bg-surface-container-high', text: 'text-on-surface-variant', hoverBorder: 'hover:bg-[#8B2500] hover:text-white' };
}

export function BeatCard({ beat, isFavorite, onToggleFavorite, onPlay, onPurchase }: BeatCardProps) {
  const genreStyle = getGenreStyle(beat.genre);

  return (
    <div className={`bg-surface-container-low border border-primary/20 p-4 group ${genreStyle.hoverBorder} transition-all duration-500`}>
      {/* Image */}
      <div className="relative aspect-square mb-6 overflow-hidden bg-surface-container-highest">
        {beat.coverUrl ? (
          <img
            src={beat.coverUrl}
            alt={beat.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
          />
        ) : (
          <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
            <span className="material-symbols-outlined text-on-surface-variant/40 text-5xl">music_note</span>
          </div>
        )}

        {/* Play overlay */}
        <button
          type="button"
          className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
          onClick={() => onPlay(beat)}
          aria-label={`Reproducir ${beat.title}`}
        >
          <div className="w-16 h-16 rounded-full border-2 border-primary flex items-center justify-center text-primary bg-background/60 backdrop-blur-sm">
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
          className="absolute top-4 right-4 z-10 bg-background/60 backdrop-blur-sm rounded-full p-2 transition-transform duration-300 active:scale-125 cursor-pointer"
          onClick={() => onToggleFavorite(beat.id)}
        >
          <span
            className="material-symbols-outlined text-sm text-[#efe2c2]/40 flex transition-colors"
            style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}
          >
            {isFavorite ? 'favorite' : 'favorite_border'}
          </span>
        </button>
      </div>

      {/* Info */}
      <div className="space-y-4">
        <div>
          <span
            className={`${genreStyle.bg} ${genreStyle.text} border border-primary/40 text-[9px] px-2 py-0.5 font-display tracking-[0.2em] uppercase mb-2 inline-block`}
          >
            {beat.genre}
          </span>
          <h4 className="text-on-surface font-display text-xl font-bold">
            {beat.title}
          </h4>
          <p className="text-on-surface-variant/70 font-body text-xs tracking-[0.2em] uppercase">
            PROD BY {beat.artist}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-outline-variant/10">
          <span className="font-display text-primary text-lg font-bold">
            ${beat.price.toLocaleString('es-CO')}
          </span>
          <button
            className="bg-primary/10 hover:bg-primary text-primary hover:text-on-primary px-4 py-2 text-xs font-display font-bold tracking-widest border border-primary/50 transition-all cursor-pointer"
            onClick={() => onPurchase(beat)}
          >
            ADQUIRIR
          </button>
        </div>
      </div>
    </div>
  );
}
