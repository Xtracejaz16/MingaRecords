import { useState, useRef, useEffect, useCallback } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function PersistentPlayer() {
  const currentBeat = usePlayerStore((s) => s.currentBeat);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const pauseBeat = usePlayerStore((s) => s.pauseBeat);
  const resumeBeat = usePlayerStore((s) => s.resumeBeat);

  const { seek, setVolume, toggleMute } = useAudioPlayer();

  const [isDragging, setIsDragging] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);

  const getPercentFromEvent = useCallback(
    (e: MouseEvent, element: HTMLDivElement): number => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      return Math.max(0, Math.min(100, (x / rect.width) * 100));
    },
    [],
  );

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (duration <= 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      seek((percent / 100) * duration);
    },
    [duration, seek],
  );

  const handleThumbMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
    },
    [],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!progressRef.current || duration <= 0) return;
      const percent = getPercentFromEvent(e, progressRef.current);
      seek((percent / 100) * duration);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration, seek, getPercentFromEvent]);

  const handleVolumeClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setVolume(percent);
    },
    [setVolume],
  );

  const handlePlayPause = useCallback(() => {
    if (!currentBeat) return;
    if (isPlaying) {
      pauseBeat();
    } else {
      resumeBeat();
    }
  }, [currentBeat, isPlaying, pauseBeat, resumeBeat]);

  if (!currentBeat) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="h-24 w-full flex-shrink-0 z-50 bg-obsidian/90 backdrop-blur-xl border-t border-b border-brightGold/20 flex items-center px-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
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
              <span className="material-symbols-outlined text-mutedCream/40 text-lg">
                music_note
              </span>
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
          <button
            type="button"
            className="text-mutedCream hover:text-paleCream transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">shuffle</span>
          </button>
          <button
            type="button"
            className="text-mutedCream hover:text-paleCream transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">
              skip_previous
            </span>
          </button>
          <button
            type="button"
            className="w-10 h-10 bg-muiscaGold text-deepBrown flex items-center justify-center rounded-full hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            onClick={handlePlayPause}
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button
            type="button"
            className="text-mutedCream hover:text-paleCream transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">
              skip_next
            </span>
          </button>
          <button
            type="button"
            className="text-mutedCream hover:text-paleCream transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">repeat</span>
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xl flex items-center gap-3">
          <span className="text-[10px] text-mutedCream font-body w-10 text-right">
            {formatTime(progress)}
          </span>
          <div
            ref={progressRef}
            className="flex-1 h-1 bg-mud relative cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-zenuCopper to-muiscaGold"
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-muiscaGold border-2 border-deepBrown cursor-grab active:cursor-grabbing"
              style={{ left: `calc(${progressPercent}% - 6px)` }}
              onMouseDown={handleThumbMouseDown}
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
          <button
            type="button"
            className="text-mutedCream hover:text-paleCream transition-colors cursor-pointer"
            onClick={toggleMute}
          >
            <span className="material-symbols-outlined text-lg">
              {isMuted ? 'volume_off' : 'volume_up'}
            </span>
          </button>
          <div
            ref={volumeRef}
            className="w-24 h-1 bg-mud relative cursor-pointer"
            onClick={handleVolumeClick}
          >
            <div
              className="absolute inset-y-0 left-0 bg-muiscaGold"
              style={{ width: `${volume}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          className="bg-brightGold text-deepBrown px-6 py-2 font-display text-xs font-bold tracking-widest active:scale-95 transition-transform cursor-pointer"
        >
          ADQUIRIR
        </button>
      </div>
    </div>
  );
}
