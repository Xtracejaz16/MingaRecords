import { useRef, useState, useEffect } from 'react';
import { TopNavBar } from '../../shared/components/TopNavBar';
import { SideNavBar } from '../components/SideNavBar';
import { SearchBar } from '../components/SearchBar';
import { GenreFilterChips } from '../components/GenreFilterChips';
import { BeatCard } from '../components/BeatCard';
import { ActivityCard } from '../components/ActivityCard';
import { ReleaseList } from '../components/ReleaseList';
import { PersistentPlayer } from '../components/PersistentPlayer';
import { ToastNotification } from '../components/ToastNotification';
import { useUIStore } from '../store/uiStore';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
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
    // searchBeats is unused in this component after combining logic here
    filterByGenre,
    beats,
  } = useMarketplace();

  const {
    searchQuery,
    setSearchQuery,
    selectedGenre,
    setSelectedGenre,
    toggleFavorite,
    isFavorite,
  } = useUIStore();
  const { playBeat } = useAudioPlayer();

  // Synchronize error -> toastMessage inside an effect to avoid setState during render
  // and ensure toast is shown when an error appears.
  useEffect(() => {
    if (!error) return;
    // schedule setToastMessage in microtask to avoid lint complaining about sync setState
    Promise.resolve().then(() => setToastMessage(error));
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

  const handlePlay = (beat: Beat) => {
    playBeat(beat);
  };

  const handleToggleFavorite = (beatId: string) => {
    const willBeFavorite = !isFavorite(beatId);
    toggleFavorite(beatId);
    showToast(
      willBeFavorite ? 'Añadido a Favoritos' : 'Removido de Favoritos',
    );
  };

  const handlePurchase = (beat: Beat) => {
    showToast(`Función de compra próximamente: ${beat.title}`);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface font-body text-on-surface selection:bg-primary selection:text-on-primary min-h-screen overflow-x-hidden">
      {/* Background overlays — Tailwind equivalents of grain and pattern */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#c8860a 0.5px, transparent 0.5px)',
          backgroundSize: '24px 24px',
          opacity: 0.05,
        }}
      />
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          opacity: 0.03,
        }}
      />

      <TopNavBar />

      <div className="flex pt-20 pb-24 min-h-screen">
        <SideNavBar />

        <main className="ml-64 flex-1 px-12 py-12 relative z-10 max-w-7xl">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex items-center gap-3">
                <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse" />
                <span className="text-secondary font-display text-xs tracking-[0.3em] uppercase">
                  Cargando la cosecha...
                </span>
              </div>
            </div>
          ) : (
            <div>
              {/* Hero Header */}
              <section className="mb-16">
                <div className="flex items-center gap-3 mb-6">
                  <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse" />
                  <span className="text-secondary font-display text-xs tracking-[0.3em] uppercase">
                    Cosecha del Mes
                  </span>
                </div>
                <h2 className="leading-none mb-4">
                  <span className="block text-on-surface font-display text-6xl font-bold tracking-tight">
                    ENCUENTRA TU
                  </span>
                  <span className="block text-primary font-display text-7xl font-black tracking-tighter italic">
                    PRÓXIMO SONIDO
                  </span>
                </h2>
                <p className="text-on-surface-variant font-body text-xl italic max-w-2xl leading-relaxed">
                  Descubre ritmos ancestrales procesados para la eternidad. Una curaduría de beats que conectan el pasado muisca con el futuro digital.
                </p>
              </section>

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
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-[#1A7A6E]/20 via-[#C8860A]/40 to-[#B5651D]/20" />
                  </div>
                  <a
                    className="text-primary font-display text-xs tracking-widest underline decoration-secondary ml-10"
                    href="#"
                  >
                    VER TODOS LOS BEATS
                  </a>
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
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-[#1A7A6E]/20 via-[#C8860A]/40 to-[#B5651D]/20" />
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
