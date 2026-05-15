import type { MarketplaceRepository } from '../../domain/marketplace/MarketplaceRepository';
import type { ActivityItem } from '../../domain/marketplace/ActivityItem';

export class GetActivitiesUseCase {
  constructor(private readonly repository: MarketplaceRepository) {}

  async execute(): Promise<ActivityItem[]> {
    const activities = await this.repository.getActivities();

    if (activities == null) {
      throw new Error('Activities no pueden ser null.');
    }

    return activities;
  }
}
