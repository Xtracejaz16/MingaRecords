import { useState, useRef, useEffect } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getPercentFromEvent(e: MouseEvent, element: HTMLDivElement): number {
  const rect = element.getBoundingClientRect();
  const x = e.clientX - rect.left;
  return Math.max(0, Math.min(100, (x / rect.width) * 100));
}

export function PersistentPlayer() {
  const currentBeat = usePlayerStore((s) => s.currentBeat);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const progress = usePlayerStore((s) => s.progress);
  const duration = usePlayerStore((s) => s.duration);
  const volume = usePlayerStore((s) => s.volume);
  const isMuted = usePlayerStore((s) => s.isMuted);
  const { seek, setVolume, toggleMute, pause, resume } = useAudioPlayer();

  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const seekRef = useRef(seek);
  seekRef.current = seek;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    seek((percent / 100) * duration);
  };

  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleVolumeThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingVolume(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!progressRef.current || duration <= 0) return;
      const percent = getPercentFromEvent(e, progressRef.current);
      seekRef.current((percent / 100) * duration);
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
  }, [isDragging, duration]);

  useEffect(() => {
    if (!isDraggingVolume) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!volumeRef.current) return;
      const percent = getPercentFromEvent(e, volumeRef.current);
      setVolume(percent);
    };

    const handleMouseUp = () => {
      setIsDraggingVolume(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingVolume, setVolume]);

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setVolume(percent);
  };

  const handlePlayPause = () => {
    if (!currentBeat) return;
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  if (!currentBeat) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 w-full h-24 z-50 bg-surface/90 backdrop-blur-xl border-t border-primary/20 flex items-center px-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      {/* Track Info */}
      <div className="flex items-center gap-4 w-1/4">
        <div className="w-14 h-14 border border-secondary shrink-0 overflow-hidden">
          {currentBeat.coverUrl ? (
            <img
              src={currentBeat.coverUrl}
              alt={currentBeat.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-surface-container-highest flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant/40 text-lg">
                music_note
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-primary font-display text-sm font-bold tracking-tight truncate">
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
        <div className="flex items-center gap-8">
          <button
            type="button"
            className="text-[#F2E8D0]/60 hover:text-[#C8860A] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">shuffle</span>
          </button>
          <button
            type="button"
            className="text-[#F2E8D0]/60 hover:text-[#C8860A] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">skip_previous</span>
          </button>
          <button
            type="button"
            className="w-10 h-10 bg-[#C8860A] text-on-primary flex items-center justify-center rounded-full hover:scale-105 transition-transform active:scale-95 cursor-pointer"
            onClick={handlePlayPause}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button
            type="button"
            className="text-[#F2E8D0]/60 hover:text-[#C8860A] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">skip_next</span>
          </button>
          <button
            type="button"
            className="text-[#F2E8D0]/60 hover:text-[#C8860A] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined">repeat</span>
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xl flex items-center gap-3">
          <span className="text-[10px] text-on-surface-variant font-body w-10 text-right">
            {formatTime(progress)}
          </span>
          <div
            ref={progressRef}
            className="flex-1 h-1 bg-surface-container-highest relative cursor-pointer"
            onClick={handleProgressClick}
            data-testid="progress-bar"
          >
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#B5651D] to-[#C8860A]"
              style={{ width: `${progressPercent}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#C8860A] border-2 border-on-primary cursor-grab active:cursor-grabbing"
              style={{ left: `calc(${progressPercent}% - 6px)` }}
              onMouseDown={handleThumbMouseDown}
            />
          </div>
          <span className="text-[10px] text-on-surface-variant font-body w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume + CTA */}
      <div className="w-1/4 flex justify-end items-center gap-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-[#F2E8D0]/60 hover:text-[#C8860A] transition-colors cursor-pointer"
            onClick={toggleMute}
          >
            <span className="material-symbols-outlined text-lg">
              {isMuted ? 'volume_off' : 'volume_up'}
            </span>
          </button>
          <div
            ref={volumeRef}
            className="w-24 h-1 bg-surface-container-highest relative cursor-pointer"
            onClick={handleVolumeClick}
            data-testid="volume-bar"
          >
            <div
              className="absolute inset-y-0 left-0 bg-[#C8860A]"
              style={{ width: `${isMuted ? 0 : volume}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#C8860A] border-2 border-on-primary cursor-grab active:cursor-grabbing"
              style={{ left: `calc(${isMuted ? 0 : volume}% - 6px)` }}
              onMouseDown={handleVolumeThumbMouseDown}
              data-testid="volume-thumb"
            />
          </div>
        </div>
        <button
          type="button"
          className="bg-primary text-on-primary px-6 py-2 font-display text-xs font-bold tracking-widest active:scale-95 transition-transform cursor-pointer"
        >
          ADQUIRIR
        </button>
      </div>
    </div>
  );
}
