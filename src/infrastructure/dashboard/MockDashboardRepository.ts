import { ACTIVITY_TYPE, type ActivityItem } from '../../domain/dashboard/ActivityItem';
import { BEAT_STATUS, type Beat } from '../../domain/dashboard/Beat';
import type { DashboardRepository } from '../../domain/dashboard/DashboardRepository';
import type { ProducerStats } from '../../domain/dashboard/ProducerStats';

const delay = async () => {
  await new Promise((resolve) => setTimeout(resolve, 600));
};

const STATS: ProducerStats = {
  earningsCOP: 12_450_000,
  totalStreams: 142_800,
  licensessSold: 54,
};

const BEATS: Beat[] = [
  {
    id: 'beat-ancestral-pulse',
    title: 'Ancestral Pulse',
    genre: 'Deep Techno / Tribal',
    status: BEAT_STATUS.PUBLIC,
    priceCOP: 450_000,
    coverUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCvHeNM9rVJ5b9IAM_uJWYyZHoFNn5NOe8QdyjzxmWyADAzUiU_GSOsNQGfhBUxBasnXj0HRpfOXzmSmcD9HOS6PtI-YsUFqyyIJD8IZ7szmeCzH_Rjo2mf65LSHsSfXJcNN6h9wbfO1ZPAg6WlIPUYgAIn2gEn-vKU-MEOrY8NPFe_8nUlQI6etbVaWsHJs7emDAysFTW4Th4hHy7KqQ88qBrIXNnZk6_Ioa4qB14OAHkecMwrewdsrTHpjyLyOevk-s98iPNTsog',
  },
  {
    id: 'beat-gold-dust-riddim',
    title: 'Gold Dust Riddim',
    genre: 'Dancehall / Moombahton',
    status: BEAT_STATUS.DRAFT,
    priceCOP: 320_000,
    coverUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuC_ArQrFFa786ovoShf8p2zPGl93bYCH0PzmOImBj-B1cUnc_4gjiJPxjPJZW92C3nIxYTDsEdziE9hT823ua8rCWrJS-BGuunsP6R1zs73uAp-9sfasziTLHKAxD7KXhq0Yxe0CBiJOLGMb292y0Cv8bK06fuYtDVrfBGBfXMjuCrSsvrwebrXxxmJ142VJ4X70lt5Nfphk7q5sgqF-N99I8GU5yntPllHyynJEdcyXq2AUG1wpMXGGgF_IfKzMH-At44cUw68PPY',
  },
];

const ACTIVITY: ActivityItem[] = [
  {
    id: 'activity-1',
    type: ACTIVITY_TYPE.COMMENT,
    author: 'Esteban R.',
    timeAgo: '2h ago',
    message: "'The percussion in \'Ancestral Pulse\' is exactly what I was looking for my new EP. Great work on the mix.'",
  },
  {
    id: 'activity-2',
    type: ACTIVITY_TYPE.UPDATE,
    author: 'System Update',
    timeAgo: '1d ago',
    message: 'Heritage License v2.4 has been applied to all your public tracks. Review the new terms in the legal portal.',
  },
  {
    id: 'activity-3',
    type: ACTIVITY_TYPE.TRENDING,
    author: 'Trending Alert',
    timeAgo: '3h ago',
    message: "'Gold Dust Riddim' has been added to 12 new playlists in the Bogotá Underground circuit.",
  },
  {
    id: 'activity-4',
    type: ACTIVITY_TYPE.FOLLOWER,
    author: 'New Follower',
    timeAgo: '5h ago',
    message: 'Luz Ma. (Sound Designer) is now following your sound territory.',
  },
];

export class MockDashboardRepository implements DashboardRepository {
  async getStats(): Promise<ProducerStats> {
    await delay();
    return STATS;
  }

  async getBeats(): Promise<Beat[]> {
    await delay();
    return BEATS;
  }

  async getActivity(): Promise<ActivityItem[]> {
    await delay();
    return ACTIVITY;
  }
}
