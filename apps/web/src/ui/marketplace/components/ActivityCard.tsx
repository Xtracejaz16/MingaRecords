import type { ActivityItem } from '../../../domain/marketplace/ActivityItem';

interface ActivityCardProps {
  activity: ActivityItem;
}

const ACTIVITY_STYLES: Record<string, { border: string; bg: string; text: string }> = {
  nuevo_beat: { border: 'border-[#1A7A6E]', bg: 'bg-[#1A7A6E]/10', text: 'text-[#1A7A6E]' },
  trending: { border: 'border-[#C8860A]', bg: 'bg-[#C8860A]/10', text: 'text-[#C8860A]' },
  oferta: { border: 'border-[#8B2500]', bg: 'bg-[#8B2500]/10', text: 'text-[#8B2500]' },
  recomendado: { border: 'border-[#B5651D]', bg: 'bg-[#B5651D]/10', text: 'text-[#B5651D]' },
};

function getActivityStyle(type: string) {
  return ACTIVITY_STYLES[type] ?? { border: 'border-[#1A7A6E]', bg: 'bg-[#1A7A6E]/10', text: 'text-[#1A7A6E]' };
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const style = getActivityStyle(activity.type);

  return (
    <div
      className={`bg-surface-container-low/40 p-6 flex items-start gap-6 border-l-4 ${style.border}`}
    >
      {/* Icon */}
      <div
        className={`w-12 h-12 ${style.bg} flex items-center justify-center ${style.text} shrink-0`}
      >
        <span className="material-symbols-outlined">{activity.icon}</span>
      </div>

      {/* Info */}
      <div>
        <p className={`${style.text} font-display text-xs tracking-widest mb-1 uppercase font-bold`}>
          {activity.type.replace('_', ' ')}
        </p>
        <p className="text-on-surface font-body text-lg italic leading-tight">
          {activity.description}
        </p>
      </div>
    </div>
  );
}
