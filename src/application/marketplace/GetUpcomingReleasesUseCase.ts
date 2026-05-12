import type { MarketplaceRepository } from '../../domain/marketplace/MarketplaceRepository';
import type { Release } from '../../domain/marketplace/Release';

export class GetUpcomingReleasesUseCase {
  constructor(private readonly repository: MarketplaceRepository) {}

  async execute(): Promise<Release[]> {
    const releases = await this.repository.getUpcomingReleases();

    if (releases == null) {
      throw new Error('Releases no pueden ser null.');
    }

    return releases;
  }
}
