import type { DashboardRepository } from '../../domain/dashboard/DashboardRepository';
import type { Beat } from '../../domain/dashboard/Beat';

export class GetBeatsUseCase {
  constructor(private readonly repository: DashboardRepository) {}

  async execute(): Promise<Beat[]> {
    const beats = await this.repository.getBeats();

    if (beats == null) {
      throw new Error('Dashboard beats no pueden ser null.');
    }

    return beats;
  }
}
