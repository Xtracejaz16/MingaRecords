import type { MarketplaceRepository } from '../../domain/marketplace/MarketplaceRepository';
import type { Beat } from '../../domain/marketplace/Beat';

export class SearchBeatsUseCase {
  constructor(private readonly repository: MarketplaceRepository) {}

  async execute(query: string, beats?: Beat[]): Promise<Beat[]> {
    const source = beats ?? (await this.repository.getBeats());

    // repository contract promises Beat[]; defensive null check removed to match types
    const lowerQuery = query.toLowerCase();
    return source.filter((beat) => beat.title.toLowerCase().includes(lowerQuery));
  }
}
