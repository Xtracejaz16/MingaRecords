import type { MarketplaceRepository } from '../../domain/marketplace/MarketplaceRepository';
import type { Release } from '../../domain/marketplace/Release';

export class GetUpcomingReleasesUseCase {
  private readonly repository: MarketplaceRepository;

  constructor(repository: MarketplaceRepository) {
    this.repository = repository;
  }

  async execute(): Promise<Release[]> {
    const releases = await this.repository.getUpcomingReleases();

    if (releases == null) {
      throw new Error('Releases no pueden ser null.');
    }

    return releases;
  }
}
