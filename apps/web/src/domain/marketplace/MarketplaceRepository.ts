import type { Beat } from './Beat';
import type { ActivityItem } from './ActivityItem';
import type { Release } from './Release';

export interface MarketplaceRepository {
  getBeats(): Promise<Beat[]>;
  getActivities(): Promise<ActivityItem[]>;
  getUpcomingReleases(): Promise<Release[]>;
}
