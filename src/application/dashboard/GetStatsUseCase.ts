import type { DashboardRepository } from '../../domain/dashboard/DashboardRepository';
import type { ProducerStats } from '../../domain/dashboard/ProducerStats';

export class GetStatsUseCase {
  constructor(private readonly repository: DashboardRepository) {}

  async execute(): Promise<ProducerStats> {
    const stats = await this.repository.getStats();

    if (stats == null) {
      throw new Error('Dashboard stats no pueden ser null.');
    }

    return stats;
  }
}
