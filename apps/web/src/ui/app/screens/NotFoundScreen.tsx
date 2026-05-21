interface NotFoundScreenProps {
  onGoHome: () => void;
  onGoLogin: () => void;
}

export function NotFoundScreen({ onGoHome, onGoLogin }: NotFoundScreenProps) {
  return (
    <main className="page-shell page-shell--home">
      <div className="page-shell__grain" />
      <div className="page-shell__pattern" />

      <section className="home-hero">
        <div className="home-hero__copy">
          <p className="eyebrow">Ruta no encontrada</p>
          <h1>Ese acceso no existe en la minga.</h1>
          <p className="lede">
            La URL que abriste no coincide con una ruta válida. Podés volver al inicio o entrar al login.
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
          <p className="panel-label">404</p>
          <h2>Hash inválido</h2>
          <p>Usá una ruta canónica para evitar navegar a pantallas muertas.</p>
        </aside>
      </section>
    </main>
  );
}
