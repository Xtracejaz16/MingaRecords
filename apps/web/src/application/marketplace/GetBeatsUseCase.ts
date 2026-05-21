import type { MarketplaceRepository } from '../../domain/marketplace/MarketplaceRepository';
import type { Beat } from '../../domain/marketplace/Beat';

export class GetBeatsUseCase {
  private readonly repository: MarketplaceRepository;

  constructor(repository: MarketplaceRepository) {
    this.repository = repository;
  }

  async execute(): Promise<Beat[]> {
    const beats = await this.repository.getBeats();

    if (beats == null) {
      throw new Error('Beats no pueden ser null.');
    }

    return beats;
  }
}
