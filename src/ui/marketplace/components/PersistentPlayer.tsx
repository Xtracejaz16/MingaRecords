import { usePlayerStore } from '../store/playerStore';
import { useEffect, useRef } from 'react';

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

  // Integrate a real <audio> element to play beats so the player actually emits audio
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    const audio = audioRef.current;
    // TODO: the repository currently doesn't provide an audioUrl field; when available use it.
    // For now, we don't set src to avoid invalid requests. This keeps UI responsive.
    if (isPlaying) {
      void audio.play().catch(() => {
        // ignore play errors in environments without audio
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  return (
    <div className="h-24 w-full flex-shrink-0 z-50 bg-obsidian/90 backdrop-blur-xl border-t border-brightGold/20 flex items-center px-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      {/* Track Info */}
      <div className="w-1/4 flex items-center gap-4">
        <div className="w-14 h-14 border border-blush shrink-0 overflow-hidden">
          {currentBeat.coverUrl ? (
            <img
              src={currentBeat.coverUrl}
              alt={currentBeat.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-mud flex items-center justify-center">
              <span className="material-symbols-outlined text-mutedCream/40 text-lg">music_note</span>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-brightGold font-display text-sm font-bold tracking-tight truncate">
            {currentBeat.title}
          </p>
          <p className="text-wayuuJade font-body text-[10px] tracking-[0.2em] uppercase truncate">
            {currentBeat.artist}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex-1 flex flex-col items-center gap-3">
        {/* Buttons */}
        <div className="flex items-center gap-6">
          <button className="text-mutedCream hover:text-paleCream transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-lg">shuffle</span>
          </button>
          <button className="text-mutedCream hover:text-paleCream transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-lg">
              skip_previous
            </span>
          </button>
          <button
            className="w-10 h-10 bg-muiscaGold text-[#452b00] /* TODO: token para deepBrown */ flex items-center justify-center rounded-full hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            onClick={() => (isPlaying ? pauseBeat() : resumeBeat())}
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button className="text-mutedCream hover:text-paleCream transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-lg">
              skip_next
            </span>
          </button>
          <button className="text-mutedCream hover:text-paleCream transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-lg">repeat</span>
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xl flex items-center gap-3">
          <span className="text-[10px] text-mutedCream font-body w-10 text-right">
            {formatTime(progress)}
          </span>
          <div className="flex-1 h-1 bg-mud relative cursor-pointer">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-zenuCopper to-muiscaGold"
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-muiscaGold border-2 border-[#452b00] /* TODO: token para deepBrown */"
              style={{ left: `calc(${progressPercent}% - 6px)` }}
            />
          </div>
          <span className="text-[10px] text-mutedCream font-body w-10">
            {formatTime(duration)}
          </span>
        </div>
    </div>

      {/* Volume + CTA */}
      <div className="w-1/4 flex justify-end items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-mutedCream text-lg cursor-pointer">
            volume_up
          </span>
          <div className="w-24 h-1 bg-mud relative cursor-pointer">
            <div
              className="absolute inset-y-0 left-0 bg-muiscaGold"
              style={{ width: `${volume}%` }}
            />
          </div>
        </div>
        <button className="bg-brightGold text-[#452b00] /* TODO: token para deepBrown */ px-6 py-2 font-display text-xs font-bold tracking-widest active:scale-95 transition-transform cursor-pointer">
          ADQUIRIR
        </button>
      </div>
      {/* Hidden audio element for playback */}
      <audio ref={audioRef} style={{ display: 'none' }} aria-hidden />
    </div>
  );
}
