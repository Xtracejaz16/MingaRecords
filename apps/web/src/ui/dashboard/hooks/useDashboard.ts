import { useEffect, useState } from 'react';
import { GetActivityUseCase } from '../../../application/dashboard/GetActivityUseCase';
import { GetBeatsUseCase } from '../../../application/dashboard/GetBeatsUseCase';
import { GetStatsUseCase } from '../../../application/dashboard/GetStatsUseCase';
import type { ActivityItem } from '../../../domain/dashboard/ActivityItem';
import type { Beat } from '../../../domain/dashboard/Beat';
import type { ProducerStats } from '../../../domain/dashboard/ProducerStats';
import { MockDashboardRepository } from '../../../infrastructure/dashboard/MockDashboardRepository';

const repository = new MockDashboardRepository();
const getStatsUseCase = new GetStatsUseCase(repository);
const getBeatsUseCase = new GetBeatsUseCase(repository);
const getActivityUseCase = new GetActivityUseCase(repository);

export function useDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<ProducerStats | null>(null);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [nextStats, nextBeats, nextActivity] = await Promise.all([
          getStatsUseCase.execute(),
          getBeatsUseCase.execute(),
          getActivityUseCase.execute(),
        ]);

        if (!isMounted) {
          return;
        }

        setStats(nextStats);
        setBeats(nextBeats);
        setActivity(nextActivity);
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        const message = caughtError instanceof Error ? caughtError.message : 'No se pudo cargar el dashboard.';
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    loading,
    error,
    stats,
    beats,
    activity,
  };
}
