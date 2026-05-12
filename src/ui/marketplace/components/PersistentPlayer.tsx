import { usePlayerStore } from '../store/playerStore';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function PersistentPlayer() {
  const {
    currentBeat,
    isPlaying,
    progress,
    duration,
    volume,
    pauseBeat,
    resumeBeat,
  } = usePlayerStore();

  if (!currentBeat) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const coverSrc =
    currentBeat.coverUrl ||
    `https://picsum.photos/100/100?random=${currentBeat.id}`;

  return (
    <div className="h-24 w-full flex-shrink-0 z-50 bg-[#0F0A00]/90 backdrop-blur-xl border-t border-[#ffb950]/20 flex items-center px-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      {/* Track Info */}
      <div className="w-1/4 flex items-center gap-4">
        <div className="w-14 h-14 border border-[#ffb59f] shrink-0 overflow-hidden">
          <img
            src={coverSrc}
            alt={currentBeat.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="text-[#ffb950] font-display text-sm font-bold tracking-tight truncate">
            {currentBeat.title}
          </p>
          <p className="text-[#1A7A6E] font-body text-[10px] tracking-[0.2em] uppercase truncate">
            {currentBeat.artist}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col items-center gap-3">
        {/* Buttons */}
        <div className="flex items-center gap-6">
          <button className="text-[#d6c4af] hover:text-[#efe2c2] transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-lg">shuffle</span>
          </button>
          <button className="text-[#d6c4af] hover:text-[#efe2c2] transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-lg">
              skip_previous
            </span>
          </button>
          <button
            className="w-10 h-10 bg-[#C8860A] text-[#452b00] flex items-center justify-center rounded-full hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            onClick={() => (isPlaying ? pauseBeat() : resumeBeat())}
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button className="text-[#d6c4af] hover:text-[#efe2c2] transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-lg">
              skip_next
            </span>
          </button>
          <button className="text-[#d6c4af] hover:text-[#efe2c2] transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-lg">repeat</span>
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xl flex items-center gap-3">
          <span className="text-[10px] text-[#d6c4af] font-body w-10 text-right">
            {formatTime(progress)}
          </span>
          <div className="flex-1 h-1 bg-[#3b341f] relative cursor-pointer">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#B5651D] to-[#C8860A]"
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#C8860A] border-2 border-[#452b00]"
              style={{ left: `calc(${progressPercent}% - 6px)` }}
            />
          </div>
          <span className="text-[10px] text-[#d6c4af] font-body w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume + CTA */}
      <div className="w-1/4 flex justify-end items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#d6c4af] text-lg cursor-pointer">
            volume_up
          </span>
          <div className="w-24 h-1 bg-[#3b341f] relative cursor-pointer">
            <div
              className="absolute inset-y-0 left-0 bg-[#C8860A]"
              style={{ width: `${volume}%` }}
            />
          </div>
        </div>
        <button className="bg-[#ffb950] text-[#452b00] px-6 py-2 font-display text-xs font-bold tracking-widest active:scale-95 transition-transform cursor-pointer">
          ADQUIRIR
        </button>
      </div>
    </div>
  );
}
