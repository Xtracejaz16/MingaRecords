import type { ActivityItem } from '../../../domain/dashboard/ActivityItem';
import { ZenuDivider } from '../../shared/components/ZenuDivider';

interface ActivityFeedProps {
  activity: ActivityItem[];
}

const ACTIVITY_ICON = {
  comment: 'chat_bubble',
  update: 'update',
  trending: 'local_fire_department',
  follower: 'person_add',
} as const;

function splitIntoColumns(items: ActivityItem[]) {
  const midpoint = Math.ceil(items.length / 2);
  return [items.slice(0, midpoint), items.slice(midpoint)];
}

export function ActivityFeed({ activity }: ActivityFeedProps) {
  const [leftColumn, rightColumn] = splitIntoColumns(activity);

  const renderItem = (item: ActivityItem) => (
    <div key={item.id} className="group flex items-start gap-6">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center border border-muiscaGold/20 bg-taironaTerracotta/10 transition-all group-hover:bg-muiscaGold/20">
        <span className="material-symbols-outlined text-muiscaGold">{ACTIVITY_ICON[item.type]}</span>
      </div>
      <div>
        <p className="font-headline text-sm font-bold uppercase tracking-widest text-koguiCream">
          {item.author}
          <span className="ml-2 text-[10px] font-normal italic text-taironaTerracotta/60">{item.timeAgo}</span>
        </p>
        <p className="mt-2 text-sm italic leading-relaxed text-koguiCream/70">{item.message}</p>
      </div>
    </div>
  );

  return (
    <section className="flex flex-col gap-8 pb-12">
      <div className="flex items-center gap-6">
        <h2 className="font-headline text-3xl font-black italic uppercase tracking-widest text-taironaTerracotta">La Minga Activity</h2>
        <ZenuDivider className="flex-1" />
      </div>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        {[leftColumn, rightColumn].map((column, columnIndex) => (
          <div key={columnIndex} className="flex flex-col gap-8">
            {column.map((item, index) => (
              <div key={item.id} className="flex flex-col gap-8">
                {renderItem(item)}
                {index < column.length - 1 ? <div className="h-px bg-gradient-to-r from-muiscaGold/20 to-transparent" /> : null}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
