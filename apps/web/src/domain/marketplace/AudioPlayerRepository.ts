export interface AudioPlayerRepository {
  load(url: string): void;
  play(): Promise<void>;
  pause(): void;
  seek(time: number): void;
  setVolume(value: number): void;
  toggleMute(): void;
  getCurrentTime(): number;
  getDuration(): number;
  onTimeUpdate(callback: (time: number) => void): void;
  onLoadedMetadata(callback: (duration: number) => void): void;
  onEnded(callback: () => void): void;
  onError(callback: (error: Error) => void): void;
  cleanup(): void;
}
