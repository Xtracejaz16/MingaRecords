import type { ActivityItem } from '../../domain/dashboard/ActivityItem';
import type { DashboardRepository } from '../../domain/dashboard/DashboardRepository';

export class GetActivityUseCase {
  constructor(private readonly repository: DashboardRepository) {}

  async execute(): Promise<ActivityItem[]> {
    const activity = await this.repository.getActivity();

    if (activity == null) {
      throw new Error('Dashboard activity no puede ser null.');
    }

    return activity;
  }
}
