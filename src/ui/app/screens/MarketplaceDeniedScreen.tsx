interface MarketplaceDeniedScreenProps {
  onGoHome: () => void;
  onGoLogin: () => void;
}

export function MarketplaceDeniedScreen({ onGoHome, onGoLogin }: MarketplaceDeniedScreenProps) {
  return (
    <main className="page-shell page-shell--home">
      <div className="page-shell__grain" />
      <div className="page-shell__pattern" />

      <section className="home-hero">
        <div className="home-hero__copy">
          <p className="eyebrow">Acceso restringido</p>
          <h1>Esa sesión no puede entrar al marketplace.</h1>
          <p className="lede">
            El marketplace está reservado para artistas. Los productores gestionan sus beats desde el panel.
          </p>

          <div className="home-actions">
            <button className="primary-button" type="button" onClick={onGoHome}>
              Volver al inicio
            </button>
            <button className="ghost-button" type="button" onClick={onGoLogin}>
              Ir al login
            </button>
          </div>
        </div>

        <aside className="home-hero__panel">
          <p className="panel-label">403</p>
          <h2>Solo artistas</h2>
          <p>Las cuentas de productor no tienen permiso para abrir #/marketplace.</p>
        </aside>
      </section>
    </main>
  );
}
