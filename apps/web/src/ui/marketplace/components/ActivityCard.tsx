import type { ActivityItem } from '../../../domain/marketplace/ActivityItem';

interface ActivityCardProps {
  activity: ActivityItem;
}

const ACTIVITY_COLORS: Record<string, string> = {
  NUEVO_BEAT: '#1A7A6E',
  TRENDING_ALERT: '#C8860A',
  OFERTA_EXCLUSIVA: '#8B2500',
  RECOMENDADO: '#B5651D',
};

function getActivityColor(type: string): string {
  return ACTIVITY_COLORS[type] ?? '#C8860A';
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const color = getActivityColor(activity.type);

  return (
    <div className="bg-surface-container-low/40 p-6 flex items-start gap-6 border-l-4" style={{ borderLeftColor: color }}>
      <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}10`, color }}>
        <span className="material-symbols-outlined">{activity.icon}</span>
      </div>
      <div>
        <p className="font-display text-xs tracking-widest mb-1 uppercase font-bold" style={{ color }}>
          {activity.type.replace('_', ' ')}
        </p>
        <p className="text-on-surface font-body text-lg italic leading-tight">
          {activity.description}
        </p>
      </div>
    </div>
  );
}
