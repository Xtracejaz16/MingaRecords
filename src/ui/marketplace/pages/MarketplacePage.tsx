import { useEffect, useRef, useState } from 'react';
import '../marketplace.css';
import { TopNavBar } from '../components/TopNavBar';
import { SideNavBar } from '../components/SideNavBar';
import { HeroHeader } from '../components/HeroHeader';
import { SearchBar } from '../components/SearchBar';
import { GenreFilterChips } from '../components/GenreFilterChips';
import { BeatCard } from '../components/BeatCard';
import { ActivityCard } from '../components/ActivityCard';
import { ReleaseList } from '../components/ReleaseList';
import { PersistentPlayer } from '../components/PersistentPlayer';
import { ToastNotification } from '../components/ToastNotification';
import { useUIStore } from '../store/uiStore';
import { usePlayerStore } from '../store/playerStore';
import { GetBeatsUseCase } from '../../../application/marketplace/GetBeatsUseCase';
import { GetActivitiesUseCase } from '../../../application/marketplace/GetActivitiesUseCase';
import { GetUpcomingReleasesUseCase } from '../../../application/marketplace/GetUpcomingReleasesUseCase';
import { SearchBeatsUseCase } from '../../../application/marketplace/SearchBeatsUseCase';
import { FilterBeatsByGenreUseCase } from '../../../application/marketplace/FilterBeatsByGenreUseCase';
import { MockMarketplaceRepository } from '../../../infrastructure/marketplace/MockMarketplaceRepository';
import type { Beat } from '../../../domain/marketplace/Beat';
import type { ActivityItem } from '../../../domain/marketplace/ActivityItem';
import type { Release } from '../../../domain/marketplace/Release';

const mockRepo = new MockMarketplaceRepository();
const getBeatsUC = new GetBeatsUseCase(mockRepo);
const getActivitiesUC = new GetActivitiesUseCase(mockRepo);
const getReleasesUC = new GetUpcomingReleasesUseCase(mockRepo);
const searchBeatsUC = new SearchBeatsUseCase(mockRepo);
const filterByGenreUC = new FilterBeatsByGenreUseCase(mockRepo);

export function MarketplacePage() {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const {
    searchQuery,
    setSearchQuery,
    selectedGenre,
    setSelectedGenre,
    toggleFavorite,
    isFavorite,
  } = useUIStore();
  const playBeat = usePlayerStore((s) => s.playBeat);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getBeatsUC.execute(),
      getActivitiesUC.execute(),
      getReleasesUC.execute(),
    ]).then(([b, a, r]) => {
      if (!cancelled) {
        setBeats(b);
        setActivities(a);
        setReleases(r);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) {
        setLoading(false);
        setToastMessage('No pudimos cargar el marketplace. Probá de nuevo.');
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchChange = async (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      const allBeats = await getBeatsUC.execute();
      setBeats(allBeats);
    } else {
      const results = await searchBeatsUC.execute(query);
      setBeats(results);
    }
  };

  const handleGenreSelect = async (genre: string | null) => {
    setSelectedGenre(genre);
    if (genre === null) {
      const allBeats = await getBeatsUC.execute();
      setBeats(allBeats);
    } else {
      const filtered = await filterByGenreUC.execute(genre);
      setBeats(filtered);
    }
  };

  const handleToggleFavorite = (beatId: string) => {
    const willBeFavorite = !isFavorite(beatId);
    toggleFavorite(beatId);
    setToastMessage(
      willBeFavorite ? 'Añadido a tus Favoritos' : 'Eliminado de tus Favoritos',
    );
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePlay = (beat: Beat) => {
    playBeat(beat);
  };

  const handlePurchase = (beat: Beat) => {
    setToastMessage(`Función de compra próximamente: ${beat.title}`);
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="marketplace-shell h-screen flex flex-col overflow-hidden bg-obsidian font-body text-koguiCream selection:bg-muiscaGold selection:text-taironaTerracotta">
      {/* Background overlays */}
      <div className="fixed inset-0 marketplace-pattern z-0 pointer-events-none"></div>
      <div className="fixed inset-0 marketplace-grain z-0 pointer-events-none"></div>

      <TopNavBar />

      <div className="flex flex-1 overflow-hidden">
        <SideNavBar />

        <main className="flex-1 overflow-y-auto relative z-10">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 bg-secondary animate-pulse" />
                <span className="font-display text-sm tracking-widest text-on-surface-variant uppercase">
                  Cargando la cosecha...
                </span>
              </div>
            </div>
          ) : (
            <div className="px-12 py-12 max-w-7xl mx-auto">
              <HeroHeader />

              {/* Search & Filters */}
              <section className="mb-12 space-y-8">
                <SearchBar value={searchQuery} onChange={handleSearchChange} />
                <GenreFilterChips
                  selectedGenre={selectedGenre}
                  onSelectGenre={handleGenreSelect}
                />
              </section>

              {/* La Cosecha Grid */}
              <section className="mb-20">
                <div className="flex justify-between items-end mb-10">
                  <div className="flex items-center gap-6 flex-1">
                    <h3 className="font-display text-3xl font-bold tracking-widest text-on-surface uppercase pr-6">
                      La Cosecha
                    </h3>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-wayuuJade/20 via-muiscaGold/40 to-zenuCopper/20"></div>
                  </div>
                  <a
                    className="text-primary font-display text-xs tracking-widest underline decoration-secondary ml-10"
                    href="#"
                  >
                    VER TODOS LOS BEATS
                  </a>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {beats.map((beat) => (
                    <BeatCard
                      key={beat.id}
                      beat={beat}
                      isFavorite={isFavorite(beat.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onPlay={handlePlay}
                      onPurchase={handlePurchase}
                    />
                  ))}
                </div>
              </section>

              {/* La Minga Activity */}
              <section className="mb-20">
                <div className="flex items-center gap-4 mb-10">
                  <h3 className="font-display text-2xl font-bold tracking-widest text-on-surface uppercase">
                    La Minga Activity
                  </h3>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-wayuuJade/20 via-muiscaGold/40 to-zenuCopper/20"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activities.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} />
                  ))}
                </div>
              </section>

              {/* Próximos Lanzamientos */}
              <section className="mb-20">
                <ReleaseList releases={releases} />
              </section>

              {/* Footer */}
              <footer className="mt-20 py-12 border-t border-outline-variant/10 text-center space-y-6">
                <div className="flex justify-center gap-8 font-display text-[10px] tracking-[0.4em] text-on-surface-variant uppercase">
                  <a className="hover:text-primary transition-colors" href="#">
                    Minga License
                  </a>
                  <span className="text-outline-variant/30">|</span>
                  <a className="hover:text-primary transition-colors" href="#">
                    Support Portal
                  </a>
                </div>
                <p className="text-on-surface-variant/40 font-body text-xs tracking-widest uppercase">
                  © 2024 MINGA RECORDS · Ancestral Audio Solutions
                </p>
              </footer>
            </div>
          )}
        </main>
      </div>

      <PersistentPlayer />

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60]">
          <ToastNotification
            message={toastMessage}
            onClose={() => setToastMessage(null)}
          />
        </div>
      )}
    </div>
  );
}
