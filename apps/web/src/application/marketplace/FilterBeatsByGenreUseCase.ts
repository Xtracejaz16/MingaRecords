import type { MarketplaceRepository } from '../../domain/marketplace/MarketplaceRepository';
import type { Beat } from '../../domain/marketplace/Beat';

export class FilterBeatsByGenreUseCase {
  private readonly repository: MarketplaceRepository;

  constructor(repository: MarketplaceRepository) {
    this.repository = repository;
  }

  async execute(genreId: string, beats?: Beat[]): Promise<Beat[]> {
    const source = beats ?? (await this.repository.getBeats());
    return source.filter((beat) => beat.genre === genreId);
  }
}
