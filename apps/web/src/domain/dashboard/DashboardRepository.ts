import type { ActivityItem } from './ActivityItem';
import type { Beat } from './Beat';
import type { ProducerStats } from './ProducerStats';

export interface DashboardRepository {
  getStats(): Promise<ProducerStats>;
  getBeats(): Promise<Beat[]>;
  getActivity(): Promise<ActivityItem[]>;
}
