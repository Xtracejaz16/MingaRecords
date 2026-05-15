import { useRef, useState, useEffect } from 'react';
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
import { useMarketplace } from '../hooks/useMarketplace';
import type { Beat } from '../../../domain/marketplace/Beat';

export function MarketplacePage() {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const {
    activities,
    releases,
    loading,
    error,
    searchBeats,
    filterByGenre,
  } = useMarketplace();

  const {
    searchQuery,
    setSearchQuery,
    selectedGenre,
    setSelectedGenre,
    toggleFavorite,
    isFavorite,
  } = useUIStore();
  const playBeat = usePlayerStore((s) => s.playBeat);

  // Synchronize error -> toastMessage inside an effect to avoid setState during render
  // and ensure toast is shown when an error appears.
  useEffect(() => {
    if (error) {
      setToastMessage(error);
    }
  }, [error]);

  // Combine filters: genre + search text. Both should apply additively.
  const displayBeats = (() => {
    const byGenre = selectedGenre ? filterByGenre(selectedGenre) : undefined;
    const candidates = byGenre ?? beats; // start from all beats when no genre selected
    const q = searchQuery?.trim() ?? '';
    if (q === '') return candidates;
    const lowerQ = q.toLowerCase();
    return candidates.filter((b) => b.title.toLowerCase().includes(lowerQ));
  })();

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleGenreSelect = (genre: string | null) => {
    setSelectedGenre(genre);
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current !== null) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleFavorite = (beatId: string) => {
    const willBeFavorite = !isFavorite(beatId);
    toggleFavorite(beatId);
    showToast(
      willBeFavorite ? 'Añadido a Favoritos' : 'Removido de Favoritos',
    );
  };

  const handlePlay = (beat: Beat) => {
    playBeat(beat);
  };

  const handlePurchase = (beat: Beat) => {
    showToast(`Función de compra próximamente: ${beat.title}`);
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
                  <button
                    className="text-primary font-display text-xs tracking-widest underline decoration-secondary ml-10"
                    type="button"
                  >
                    VER TODOS LOS BEATS
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {displayBeats.map((beat) => (
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
                  <button
                    className="hover:text-primary transition-colors"
                    type="button"
                  >
                    Minga License
                  </button>
                  <span className="text-outline-variant/30">|</span>
                  <button
                    className="hover:text-primary transition-colors"
                    type="button"
                  >
                    Support Portal
                  </button>
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
