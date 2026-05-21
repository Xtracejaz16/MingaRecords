export const ACTIVITY_TYPE = {
  COMMENT: 'comment',
  UPDATE: 'update',
  TRENDING: 'trending',
  FOLLOWER: 'follower',
} as const;

export type ActivityType = (typeof ACTIVITY_TYPE)[keyof typeof ACTIVITY_TYPE];

export interface ActivityItem {
  id: string;
  type: ActivityType;
  author: string;
  timeAgo: string;
  message: string;
}
