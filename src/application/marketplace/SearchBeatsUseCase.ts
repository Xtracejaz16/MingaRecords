import type { MarketplaceRepository } from '../../domain/marketplace/MarketplaceRepository';
import type { Beat } from '../../domain/marketplace/Beat';

export class SearchBeatsUseCase {
  constructor(private readonly repository: MarketplaceRepository) {}

  async execute(query: string): Promise<Beat[]> {
    const beats = await this.repository.getBeats();

    if (beats == null) {
      throw new Error('Beats no pueden ser null.');
    }

    const lowerQuery = query.toLowerCase();
    return beats.filter((beat) => beat.title.toLowerCase().includes(lowerQuery));
  }
}
