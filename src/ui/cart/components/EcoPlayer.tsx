import { useState } from 'react';

interface EcoBeatInfo {
  title: string;
  artist: string;
  coverUrl: string;
  genre: string;
}

interface EcoPlayerProps {
  currentBeat?: EcoBeatInfo;
}

export function EcoPlayer({ currentBeat }: EcoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(66);

  if (!currentBeat) return null;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setProgress(Math.max(0, Math.min(100, percentage)));
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setVolume(Math.max(0, Math.min(100, percentage)));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-24 z-50 bg-surface/95 backdrop-blur-xl border-t border-outline-variant/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex items-center px-8">
      {/* Left section */}
      <div className="w-1/4 flex items-center gap-4">
        <div className="w-14 h-14 border border-secondary shrink-0 overflow-hidden">
          <img
            src={currentBeat.coverUrl || `https://picsum.photos/56/56?random=eco`}
            alt={currentBeat.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="text-primary font-display text-sm truncate">{currentBeat.title}</p>
          <p className="text-wayuuJade text-xs truncate">{currentBeat.genre}</p>
        </div>
      </div>

      {/* Center section */}
      <div className="flex-1 flex flex-col items-center gap-3">
        <div className="flex items-center gap-6">
          <button
            type="button"
            className={`cursor-pointer transition-colors ${isShuffle ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
            onClick={() => setIsShuffle(!isShuffle)}
          >
            <span className="material-symbols-outlined text-lg">shuffle</span>
          </button>
          <button type="button" className="text-koguiCream hover:text-primary transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-lg">skip_previous</span>
          </button>
          <button
            type="button"
            className="border-2 border-primary text-primary w-12 h-12 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isPlaying ? 'pause' : 'play_arrow'}
            </span>
          </button>
          <button type="button" className="text-koguiCream hover:text-primary transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-lg">skip_next</span>
          </button>
          <button
            type="button"
            className={`cursor-pointer transition-colors ${isRepeat ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
            onClick={() => setIsRepeat(!isRepeat)}
          >
            <span className="material-symbols-outlined text-lg">repeat</span>
          </button>
        </div>

        <div className="w-full max-w-xl flex items-center gap-3">
          <span className="text-[10px] text-on-surface-variant font-body w-10 text-right">
            {Math.floor((progress / 100) * 202 / 60)}:{String(Math.floor(((progress / 100) * 202) % 60)).padStart(2, '0')}
          </span>
          <div
            className="flex-1 h-1 bg-outline-variant/30 rounded-full relative cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className="h-full bg-gradient-to-r from-taironaTerracotta to-muiscaGold rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[10px] text-on-surface-variant font-body w-10">
            3:22
          </span>
        </div>
      </div>

      {/* Right section */}
      <div className="w-1/4 flex justify-end items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-lg cursor-pointer">
            volume_up
          </span>
          <div
            className="w-24 h-1 bg-outline-variant/30 rounded-full relative cursor-pointer"
            onClick={handleVolumeClick}
          >
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${volume}%` }}
            />
          </div>
        </div>
        <button
          type="button"
          className="bg-muiscaGold text-obsidian font-display text-xs tracking-widest font-bold uppercase px-6 py-2 hover:opacity-90 transition-opacity cursor-pointer"
        >
          ADQUIRIR
        </button>
      </div>
    </div>
  );
}
