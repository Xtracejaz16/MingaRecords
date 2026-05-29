import type { AudioPlayerRepository } from '../../domain/marketplace/AudioPlayerRepository';

export class HTMLAudioPlayerAdapter implements AudioPlayerRepository {
  private readonly audio: HTMLAudioElement;
  private timeUpdateCallback: ((time: number) => void) | null = null;
  private loadedMetadataCallback: ((duration: number) => void) | null = null;
  private endedCallback: (() => void) | null = null;
  private errorCallback: ((error: Error) => void) | null = null;
  private pendingSeek: number | null = null;

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.handleTimeUpdate = this.handleTimeUpdate.bind(this);
    this.handleLoadedMetadata = this.handleLoadedMetadata.bind(this);
    this.handleEnded = this.handleEnded.bind(this);
    this.handleError = this.handleError.bind(this);
  }

  load(url: string): void {
    this.audio.src = url;
    this.audio.load();
  }

  async play(): Promise<void> {
    await this.audio.play();
  }

  pause(): void {
    this.audio.pause();
  }

  seek(time: number): void {
    const duration = this.audio.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      this.pendingSeek = time;
      return;
    }
    this.pendingSeek = null;
    this.audio.currentTime = Math.max(0, Math.min(time, duration));
  }

  setVolume(value: number): void {
    this.audio.volume = Math.max(0, Math.min(value / 100, 1));
  }

  toggleMute(): void {
    this.audio.muted = !this.audio.muted;
  }

  getCurrentTime(): number {
    return this.audio.currentTime;
  }

  getDuration(): number {
    return this.audio.duration;
  }

  onTimeUpdate(callback: (time: number) => void): void {
    this.timeUpdateCallback = callback;
    this.audio.addEventListener('timeupdate', this.handleTimeUpdate);
  }

  onLoadedMetadata(callback: (duration: number) => void): void {
    this.loadedMetadataCallback = callback;
    this.audio.addEventListener('loadedmetadata', this.handleLoadedMetadata);
  }

  onEnded(callback: () => void): void {
    this.endedCallback = callback;
    this.audio.addEventListener('ended', this.handleEnded);
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallback = callback;
    this.audio.addEventListener('error', this.handleError);
  }

  cleanup(): void {
    this.audio.removeEventListener('timeupdate', this.handleTimeUpdate);
    this.audio.removeEventListener('loadedmetadata', this.handleLoadedMetadata);
    this.audio.removeEventListener('ended', this.handleEnded);
    this.audio.removeEventListener('error', this.handleError);
    this.audio.pause();
    this.timeUpdateCallback = null;
    this.loadedMetadataCallback = null;
    this.endedCallback = null;
    this.errorCallback = null;
  }

  private handleTimeUpdate(): void {
    this.timeUpdateCallback?.(this.audio.currentTime);
  }

  private handleLoadedMetadata(): void {
    this.loadedMetadataCallback?.(this.audio.duration);
    if (this.pendingSeek !== null) {
      const duration = this.audio.duration;
      if (Number.isFinite(duration) && duration > 0) {
        this.audio.currentTime = Math.max(0, Math.min(this.pendingSeek, duration));
      }
      this.pendingSeek = null;
    }
  }

  private handleEnded(): void {
    this.endedCallback?.();
  }

  private handleError(): void {
    this.errorCallback?.(new Error('Audio playback error'));
  }
}
