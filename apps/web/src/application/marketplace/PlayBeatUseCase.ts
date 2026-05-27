import type { AudioPlayerRepository } from '../../domain/marketplace/AudioPlayerRepository';
import type { Beat } from '../../domain/marketplace/Beat';

export class PlayBeatUseCase {
  constructor(private readonly audioRepo: AudioPlayerRepository) {}

  async execute(beat: Beat): Promise<void> {
    if (!beat.audioUrl) {
      throw new Error('MISSING_AUDIO_URL');
    }
    this.audioRepo.load(beat.audioUrl);
    await this.audioRepo.play();
  }
}
