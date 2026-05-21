import type { AuthSession } from '../../../domain/auth/entities/auth';

interface PanelScreenProps {
  session: AuthSession;
  onGoHome: () => void;
  onLogout: () => void;
}

export function PanelScreen({ session, onGoHome, onLogout }: PanelScreenProps) {
  return (
    <main className="page-shell page-shell--home">
      <div className="page-shell__grain" />
      <div className="page-shell__pattern" />

      <section className="home-hero">
        <div className="home-hero__copy">
          <p className="eyebrow">Acceso privado</p>
          <h1>Panel de productor listo para crecer.</h1>
          <p className="lede">
            La ruta privada responde solo cuando hay sesión activa. Desde acá podés volver al inicio o cerrar sesión.
          </p>

          <div className="home-actions">
            <button className="primary-button" type="button" onClick={onGoHome}>
              Volver al inicio
            </button>
            <button className="ghost-button" type="button" onClick={onLogout}>
              Cerrar sesión
            </button>
          </div>
        </div>

        <aside className="home-hero__panel">
          <p className="panel-label">Sesión activa</p>
          <h2>{session.alias}</h2>
          <p>{session.identifier}</p>
          <p className="panel-meta">Rol: {session.role === 'producer' ? 'Productor' : 'Artista'}</p>
        </aside>
      </section>
    </main>
  );
}
