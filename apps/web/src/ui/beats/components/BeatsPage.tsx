import { useState, useEffect, useRef } from 'react';
import { SideNavBar } from '../../shared/components/SideNavBar';
import { TopNavBar } from '../../shared/components/TopNavBar';
import { useAuth } from '../../auth/hooks/useAuth';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

interface Beat {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  priceCents: number;
  genre: string | null;
  bpm: number | null;
  key: string | null;
  audioUrl: string | null;
  status: string;
  playsCount: number;
  salesCount: number;
  createdAt: string;
}

type UploadStatus = 'idle' | 'creating' | 'uploading' | 'done' | 'error';

export function BeatsPage() {
  const { session, isLoading: authLoading, getAccessToken } = useAuth();
  const [beats, setBeats] = useState<Beat[]>([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Formulario de subida
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceCents, setPriceCents] = useState(999);
  const [genre, setGenre] = useState('');
  const [bpm, setBpm] = useState<number | ''>('');
  const [beatKey, setBeatKey] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Mensaje de acción
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const actionTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const isProducer = session?.role === 'producer';

  // Cargar beats
  useEffect(() => {
    loadBeats();
  }, []);

  async function loadBeats() {
    setFetching(true);
    setFetchError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/beats`);
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      // La API devuelve { data: Beat[], pagination: ... }
      setBeats((data as { data: Beat[] }).data ?? []);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Error al cargar beats');
      setBeats([]);
    } finally {
      setFetching(false);
    }
  }

  function showMessage(type: 'success' | 'error', text: string) {
    if (actionTimer.current) clearTimeout(actionTimer.current);
    setActionMsg({ type, text });
    actionTimer.current = setTimeout(() => setActionMsg(null), 4000);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;

    const token = getAccessToken();
    if (!token) {
      showMessage('error', 'Necesitás iniciar sesión para subir beats');
      return;
    }

    setUploadStatus('creating');
    setUploadError(null);

    try {
      // 1. Crear el beat (metadata)
      const createRes = await fetch(`${API_BASE}/api/v1/beats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          priceCents,
          genre: genre || undefined,
          bpm: bpm || undefined,
          key: beatKey || undefined,
        }),
      });

      if (!createRes.ok) {
        const errBody = await createRes.json().catch(() => ({}));
        throw new Error((errBody as { detail?: string }).detail ?? `Error al crear beat (${createRes.status})`);
      }

      const beat = (await createRes.json()) as Beat;
      const beatId = beat.id;

      // 2. Subir el archivo de audio
      setUploadStatus('uploading');
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch(`${API_BASE}/api/v1/storage/upload/${beatId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) {
        const errBody = await uploadRes.json().catch(() => ({}));
        throw new Error((errBody as { error?: string }).error ?? `Error al subir archivo (${uploadRes.status})`);
      }

      setUploadStatus('done');
      showMessage('success', `¡"${title}" subido exitosamente!`);

      // Resetear formulario
      setTitle('');
      setDescription('');
      setPriceCents(999);
      setGenre('');
      setBpm('');
      setBeatKey('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      setShowForm(false);

      // Recargar lista
      loadBeats();
    } catch (err) {
      setUploadStatus('error');
      setUploadError(err instanceof Error ? err.message : 'Error inesperado');
      showMessage('error', err instanceof Error ? err.message : 'Error inesperado');
    }
  }

  async function handleDelete(beatId: string) {
    if (!confirm('¿Eliminar este beat definitivamente?')) return;

    const token = getAccessToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/beats/${beatId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Error al eliminar (${res.status})`);

      showMessage('success', 'Beat eliminado');
      loadBeats();
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Error al eliminar');
    }
  }

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  if (authLoading) {
    return (
      <main className="page-shell page-shell--dashboard min-h-screen bg-obsidian font-body text-koguiCream mineral-grain flex items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 bg-muiscaGold animate-pulse" />
          <span className="font-headline text-sm tracking-widest text-koguiCream/60 uppercase">Cargando...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell page-shell--dashboard min-h-screen bg-obsidian font-body text-koguiCream mineral-grain">
      <TopNavBar />
      <SideNavBar />
      <div className="page-shell__grain" />
      <div className="page-shell__pattern" />

      <div className="relative ml-64 mt-20 flex max-w-7xl flex-1 flex-col gap-8 bg-transparent p-12 bg-[url('data:image/svg+xml,%3Csvg%20width=%2760%27%20height=%2760%27%20viewBox=%270%200%2060%2060%27%20xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cpath%20d=%27M30%200L60%2030L30%2060L0%2030L30%200ZM30%2010L50%2030L30%2050L10%2030L30%2010Z%27%20fill=%27%23C8860A%27%20fill-opacity=%270.04%27/%3E%3C/svg%3E')]">
        {/* Encabezado */}
        <section className="flex items-center justify-between">
          <div>
            <h1 className="font-headline text-5xl font-black leading-none tracking-tighter text-koguiCream md:text-6xl">
              TUS <span className="text-muiscaGold">BEATS</span>
            </h1>
            <p className="mt-2 font-body text-sm text-koguiCream/50">Gestioná tu catálogo de beats</p>
          </div>
          {isProducer && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="rounded-lg bg-muiscaGold px-6 py-3 font-headline text-sm font-bold uppercase tracking-widest text-obsidian transition-all hover:bg-muiscaGold/80"
            >
              {showForm ? '✕ Cerrar' : '+ Nuevo Beat'}
            </button>
          )}
        </section>

        {/* Mensaje de acción */}
        {actionMsg && (
          <div
            className={`rounded-lg border px-6 py-4 text-sm font-medium ${
              actionMsg.type === 'success'
                ? 'border-wayuuJade/30 bg-wayuuJade/10 text-wayuuJade'
                : 'border-taironaTerracotta/30 bg-taironaTerracotta/10 text-taironaTerracotta'
            }`}
          >
            {actionMsg.text}
          </div>
        )}

        {/* Formulario de subida */}
        {showForm && (
          <form onSubmit={handleUpload} className="rounded-lg border border-koguiCream/20 bg-obsidian/80 p-6 space-y-4">
            <h2 className="font-headline text-xl font-bold text-muiscaGold">Subir nuevo beat</h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-koguiCream/60">Título *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full rounded-lg border border-koguiCream/20 bg-koguiCream/5 px-4 py-2 font-body text-sm text-koguiCream outline-none transition-colors focus:border-muiscaGold"
                  placeholder="Nombre del beat"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-koguiCream/60">Género</label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full rounded-lg border border-koguiCream/20 bg-koguiCream/5 px-4 py-2 font-body text-sm text-koguiCream outline-none transition-colors focus:border-muiscaGold"
                  placeholder="Ej: Hip Hop, Reggaetón"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-koguiCream/60">Precio (centavos)</label>
                <input
                  type="number"
                  value={priceCents}
                  onChange={(e) => setPriceCents(Number(e.target.value))}
                  min={1}
                  className="w-full rounded-lg border border-koguiCream/20 bg-koguiCream/5 px-4 py-2 font-body text-sm text-koguiCream outline-none transition-colors focus:border-muiscaGold"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-koguiCream/60">BPM</label>
                <input
                  type="number"
                  value={bpm}
                  onChange={(e) => setBpm(e.target.value ? Number(e.target.value) : '')}
                  className="w-full rounded-lg border border-koguiCream/20 bg-koguiCream/5 px-4 py-2 font-body text-sm text-koguiCream outline-none transition-colors focus:border-muiscaGold"
                  placeholder="140"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-koguiCream/60">Tonalidad</label>
                <input
                  type="text"
                  value={beatKey}
                  onChange={(e) => setBeatKey(e.target.value)}
                  className="w-full rounded-lg border border-koguiCream/20 bg-koguiCream/5 px-4 py-2 font-body text-sm text-koguiCream outline-none transition-colors focus:border-muiscaGold"
                  placeholder="Ej: Am, Cm"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-koguiCream/60">Descripción</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-koguiCream/20 bg-koguiCream/5 px-4 py-2 font-body text-sm text-koguiCream outline-none transition-colors focus:border-muiscaGold"
                  placeholder="Descripción opcional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-koguiCream/60">Archivo de audio * (MP3, WAV o FLAC, máx 50MB)</label>
              <input
                ref={fileRef}
                type="file"
                accept=".mp3,.wav,.flac,audio/mpeg,audio/wav,audio/flac"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
                className="w-full text-sm text-koguiCream/60 file:mr-4 file:rounded-lg file:border-0 file:bg-muiscaGold file:px-4 file:py-2 file:text-sm file:font-bold file:text-obsidian file:cursor-pointer hover:file:bg-muiscaGold/80"
              />
            </div>

            {uploadError && (
              <p className="text-sm text-taironaTerracotta">{uploadError}</p>
            )}

            <button
              type="submit"
              disabled={uploadStatus === 'creating' || uploadStatus === 'uploading'}
              className="w-full rounded-lg bg-muiscaGold px-6 py-3 font-headline text-sm font-bold uppercase tracking-widest text-obsidian transition-all hover:bg-muiscaGold/80 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadStatus === 'creating'
                ? 'Creando beat...'
                : uploadStatus === 'uploading'
                  ? 'Subiendo archivo...'
                  : 'Subir Beat'}
            </button>
          </form>
        )}

        {/* Error al cargar */}
        {fetchError && (
          <div className="rounded-lg border border-taironaTerracotta/30 bg-taironaTerracotta/10 px-6 py-4 text-sm text-taironaTerracotta">
            Error al cargar beats: {fetchError}
            <button onClick={loadBeats} className="ml-4 underline hover:text-koguiCream">
              Reintentar
            </button>
          </div>
        )}

        {/* Tabla de beats */}
        {fetching ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-2 h-2 bg-muiscaGold animate-pulse" />
            <span className="ml-3 font-headline text-sm tracking-widest text-koguiCream/60 uppercase">Cargando beats...</span>
          </div>
        ) : beats.length === 0 && !fetchError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="font-headline text-xl text-koguiCream/40">No hay beats todavía</p>
            {isProducer && (
              <button
                onClick={() => setShowForm(true)}
                className="rounded-lg bg-muiscaGold/20 px-6 py-3 font-headline text-sm font-bold uppercase tracking-widest text-muiscaGold transition-all hover:bg-muiscaGold/30"
              >
                Subí tu primer beat
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-lg border border-koguiCream/20 stone-tablet">
            <table className="w-full">
              <thead className="bg-obsidian/50 text-left text-sm uppercase tracking-wider text-koguiCream/70">
                <tr>
                  <th className="p-4">Título</th>
                  <th className="p-4">Género</th>
                  <th className="p-4">BPM</th>
                  <th className="p-4">Precio</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Reproducciones</th>
                  <th className="p-4">Audio</th>
                  {isProducer && <th className="p-4">Acción</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-koguiCream/10">
                {beats.map((beat) => (
                  <tr key={beat.id} className="hover:bg-muiscaGold/5 transition-colors">
                    <td className="p-4 font-medium text-koguiCream">{beat.title}</td>
                    <td className="p-4 text-koguiCream/80">{beat.genre ?? '—'}</td>
                    <td className="p-4 text-koguiCream/80">{beat.bpm ?? '—'}</td>
                    <td className="p-4 text-muiscaGold">{formatPrice(beat.priceCents)}</td>
                    <td className="p-4">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                        beat.status === 'published' || beat.status === 'ready'
                          ? 'bg-wayuuJade/20 text-wayuuJade'
                          : beat.status === 'draft' || beat.status === 'pending_audio'
                            ? 'bg-zenuCopper/20 text-zenuCopper'
                            : 'bg-taironaTerracotta/20 text-taironaTerracotta'
                      }`}>
                        {beat.status}
                      </span>
                    </td>
                    <td className="p-4 text-koguiCream/80">{beat.playsCount}</td>
                    <td className="p-4">
                      {beat.audioUrl ? (
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                const res = await fetch(`${API_BASE}/api/v1/storage/download/${encodeURIComponent(beat.audioUrl!)}`);
                                if (!res.ok) throw new Error('Error al obtener URL');
                                const data = (await res.json()) as { url: string };
                                window.open(data.url, '_blank');
                              } catch {
                                // En modo local, la URL es directa
                                window.open(`${API_BASE}${beat.audioUrl}`, '_blank');
                              }
                            }}
                            className="text-xs font-bold uppercase tracking-wider text-muiscaGold hover:text-muiscaGold/70 transition-colors"
                            title="Descargar"
                          >
                            ⬇ Descargar
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-koguiCream/30">Sin audio</span>
                      )}
                    </td>
                    {isProducer && (
                      <td className="p-4">
                        <button
                          onClick={() => handleDelete(beat.id)}
                          className="text-xs font-bold uppercase tracking-wider text-taironaTerracotta hover:text-taironaTerracotta/70 transition-colors"
                        >
                          ✕ Eliminar
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
