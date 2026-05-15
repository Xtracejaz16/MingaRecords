import { useEffect, useState, useRef, useMemo } from 'react';
import { GetBeatsUseCase } from '../../../application/marketplace/GetBeatsUseCase';
import { GetActivitiesUseCase } from '../../../application/marketplace/GetActivitiesUseCase';
import { GetUpcomingReleasesUseCase } from '../../../application/marketplace/GetUpcomingReleasesUseCase';
import type { ActivityItem } from '../../../domain/marketplace/ActivityItem';
import type { Beat } from '../../../domain/marketplace/Beat';
import type { Release } from '../../../domain/marketplace/Release';
import { MockMarketplaceRepository } from '../../../infrastructure/marketplace/MockMarketplaceRepository';

export function useMarketplace(repositoryParam?: MockMarketplaceRepository) {
  // Keep repository stable across renders when not injected
  const repositoryRef = useRef<MockMarketplaceRepository | null>(null);
  const repository = repositoryParam ?? (repositoryRef.current ?? (repositoryRef.current = new MockMarketplaceRepository()));

  const getBeats = useMemo(() => new GetBeatsUseCase(repository), [repository]);
  const getActivities = useMemo(() => new GetActivitiesUseCase(repository), [repository]);
  const getUpcomingReleases = useMemo(() => new GetUpcomingReleasesUseCase(repository), [repository]);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [nextBeats, nextActivities, nextReleases] = await Promise.all([
          getBeats.execute(),
          getActivities.execute(),
          getUpcomingReleases.execute(),
        ]);

        if (!isMounted) {
          return;
        }

        setBeats(nextBeats);
        setActivities(nextActivities);
        setReleases(nextReleases);
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        const message = caughtError instanceof Error
          ? caughtError.message
          : 'No se pudo cargar el marketplace.';
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
  }, [getBeats, getActivities, getUpcomingReleases]);

  const searchBeats = (query: string): Beat[] => {
    if (query.trim() === '') {
      return beats;
    }

    const lowerQuery = query.toLowerCase();
    return beats.filter((beat) => beat.title.toLowerCase().includes(lowerQuery));
  };

  const filterByGenre = (genre: string | null): Beat[] => {
    if (genre === null) {
      return beats;
    }

    return beats.filter((beat) => beat.genre === genre);
  };

  return {
    beats,
    activities,
    releases,
    loading,
    error,
    searchBeats,
    filterByGenre,
  };
}
