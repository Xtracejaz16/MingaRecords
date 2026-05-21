export const ACTIVITY_TYPE = {
  NEW_BEAT: 'new_beat',
  TRENDING: 'trending',
  OFFER: 'offer',
  RECOMMENDED: 'recommended',
} as const;

export type ActivityType = (typeof ACTIVITY_TYPE)[keyof typeof ACTIVITY_TYPE];

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  color: string;
  icon: string;
}
