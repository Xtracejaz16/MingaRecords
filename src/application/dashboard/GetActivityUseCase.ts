import type { ActivityItem } from '../../domain/dashboard/ActivityItem';
import type { DashboardRepository } from '../../domain/dashboard/DashboardRepository';

export class GetActivityUseCase {
  private readonly repository: DashboardRepository;

  constructor(repository: DashboardRepository) {
    this.repository = repository;
  }

  async execute(): Promise<ActivityItem[]> {
    const activity = await this.repository.getActivity();

    if (activity == null) {
      throw new Error('Dashboard activity no puede ser null.');
    }

    return activity;
  }
}
