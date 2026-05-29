import type { ActivityItem, ActivityType } from '../../../domain/marketplace/ActivityItem';

interface ActivityCardProps {
  activity: ActivityItem;
}

interface ActivityStyle {
  border: string;
  iconWrapper: string;
  titleText: string;
  icon: string;
}

const ACTIVITY_STYLES: Record<ActivityType, ActivityStyle> = {
  new_beat: {
    border: 'border-[#1A7A6E]',
    iconWrapper: 'bg-[#1A7A6E]/10 text-[#1A7A6E]',
    titleText: 'text-[#1A7A6E]',
    icon: 'queue_music',
  },
  trending: {
    border: 'border-[#C8860A]',
    iconWrapper: 'bg-[#C8860A]/10 text-[#C8860A]',
    titleText: 'text-[#C8860A]',
    icon: 'trending_up',
  },
  offer: {
    border: 'border-[#8B2500]',
    iconWrapper: 'bg-[#8B2500]/10 text-[#8B2500]',
    titleText: 'text-[#8B2500]',
    icon: 'sell',
  },
  recommended: {
    border: 'border-[#B5651D]',
    iconWrapper: 'bg-[#B5651D]/10 text-[#B5651D]',
    titleText: 'text-[#B5651D]',
    icon: 'auto_awesome',
  },
};

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  new_beat: 'Nuevo Beat',
  trending: 'Trending Alert',
  offer: 'Oferta Exclusiva',
  recommended: 'Recomendado',
};

export function ActivityCard({ activity }: ActivityCardProps) {
  const styles = ACTIVITY_STYLES[activity.type] ?? ACTIVITY_STYLES.new_beat;
  const label = ACTIVITY_LABELS[activity.type] ?? activity.type.replace('_', ' ');

  return (
    <div className={`bg-surface-container-low/40 p-6 flex items-start gap-6 border-l-4 ${styles.border}`}>
      {/* Icon */}
      <div className={`w-12 h-12 ${styles.iconWrapper} flex items-center justify-center shrink-0`}>
        <span className="material-symbols-outlined">{styles.icon}</span>
      </div>

      {/* Info */}
      <div>
        <p className={`${styles.titleText} font-display text-xs tracking-widest mb-1 uppercase font-bold`}>
          {label}
        </p>
        <p className="text-on-surface font-body text-lg italic leading-tight">
          {activity.description}
        </p>
      </div>
    </div>
  );
}
