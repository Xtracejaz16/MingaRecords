import type { ActivityItem } from '../../../domain/marketplace/ActivityItem';

interface ActivityCardProps {
  activity: ActivityItem;
}

export function ActivityCard({ activity }: ActivityCardProps) {
  return (
    <div
      className="bg-deepObsidian/40 p-6 flex items-start gap-6 border-l-4"
      style={{ borderLeftColor: activity.color }}
    >
      {/* Icon */}
      <div
        className="w-12 h-12 flex items-center justify-center shrink-0"
        style={{
          backgroundColor: `${activity.color}10`,
          color: activity.color,
        }}
      >
        <span className="material-symbols-outlined">{activity.icon}</span>
      </div>

      {/* Info */}
      <div>
        <p
          className="font-display text-xs tracking-widest mb-1 uppercase font-bold"
          style={{ color: activity.color }}
        >
          {activity.type.replace('_', ' ')}
        </p>
        <p className="text-paleCream font-body text-lg italic leading-tight">
          {activity.description}
        </p>
      </div>
    </div>
  );
}
