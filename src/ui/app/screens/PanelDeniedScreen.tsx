interface PanelDeniedScreenProps {
  onGoHome: () => void;
  onGoLogin: () => void;
}

export function PanelDeniedScreen({ onGoHome, onGoLogin }: PanelDeniedScreenProps) {
  return (
    <main className="page-shell page-shell--home">
      <div className="page-shell__grain" />
      <div className="page-shell__pattern" />

      <section className="home-hero">
        <div className="home-hero__copy">
          <p className="eyebrow">Acceso restringido</p>
          <h1>Esa sesión no puede entrar al panel.</h1>
          <p className="lede">
            El panel está reservado para productores. Si querés seguir, volvé al inicio o cambiá de sesión.
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
          <h2>Solo productores</h2>
          <p>Las cuentas de artista no tienen permiso para abrir #/panel.</p>
        </aside>
      </section>
    </main>
  );
}
