import { useState, useRef } from 'react';
import { SideNavBar } from '../../shared/components/SideNavBar';
import { TopNavBar } from '../../shared/components/TopNavBar';
import { useBeats } from '../hooks/useBeats';
import { BeatLicenseManager } from './BeatLicenseManager';
import type { CreateBeatInput } from '../../../domain/beats/entities/beat.js';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001';

export function BeatsPage() {
  const {
    beats,
    isLoading,
    error,
    uploadStatus,
    uploadError,
    uploadBeat,
    deleteBeat,
    resetUpload,
    actionMsg,
    isProducer,
  } = useBeats();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priceCents, setPriceCents] = useState(999);
  const [genre, setGenre] = useState('');
  const [bpm, setBpm] = useState<number | ''>('');
  const [beatKey, setBeatKey] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [licenseManagerBeatId, setLicenseManagerBeatId] = useState<string | null>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const coverFileRef = useRef<HTMLInputElement>(null);

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  function resetForm() {
    setTitle('');
    setDescription('');
    setPriceCents(999);
    setGenre('');
    setBpm('');
    setBeatKey('');
    setAudioFile(null);
    setCoverFile(null);
    if (audioFileRef.current) audioFileRef.current.value = '';
    if (coverFileRef.current) coverFileRef.current.value = '';
    setShowForm(false);
    resetUpload();
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!audioFile || !title.trim()) return;

    const input: CreateBeatInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      priceCents,
      genre: genre || undefined,
      bpm: bpm || undefined,
      key: beatKey || undefined,
    };

    await uploadBeat(input, audioFile, coverFile);
    if (uploadStatus !== 'error') {
      resetForm();
    }
  }

  async function handleDelete(beatId: string) {
    if (!confirm('¿Eliminar este beat definitivamente?')) return;
    await deleteBeat(beatId);
  }

  if (isLoading) {
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

      <div className="relative ml-64 mt-20 flex max-w-7xl flex-1 flex-col gap-8 bg-transparent p-12 pattern-vueltiao-subtle">
        {/* Header */}
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

        {/* Action message */}
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

        {/* Upload form */}
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
              <label className="block text-xs font-bold uppercase tracking-widest text-koguiCream/60">
                Archivo de audio * (MP3, WAV o FLAC, máx 50MB)
              </label>
              <input
                ref={audioFileRef}
                type="file"
                accept=".mp3,.wav,.flac,audio/mpeg,audio/wav,audio/flac"
                onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                required
                className="w-full text-sm text-koguiCream/60 file:mr-4 file:rounded-lg file:border-0 file:bg-muiscaGold file:px-4 file:py-2 file:text-sm file:font-bold file:text-obsidian file:cursor-pointer hover:file:bg-muiscaGold/80"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-koguiCream/60">
                Imagen de portada (opcional, JPG/PNG/WebP/GIF, máx 10MB)
              </label>
              <input
                ref={coverFileRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-koguiCream/60 file:mr-4 file:rounded-lg file:border-0 file:bg-muiscaGold file:px-4 file:py-2 file:text-sm file:font-bold file:text-obsidian file:cursor-pointer hover:file:bg-muiscaGold/80"
              />
            </div>

            {(uploadError) && (
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
                  ? 'Subiendo archivos...'
                  : 'Subir Beat'}
            </button>
          </form>
        )}

        {/* Error loading beats */}
        {error && (
          <div className="rounded-lg border border-taironaTerracotta/30 bg-taironaTerracotta/10 px-6 py-4 text-sm text-taironaTerracotta">
            Error al cargar beats: {error}
            <button onClick={() => window.location.reload()} className="ml-4 underline hover:text-koguiCream">
              Reintentar
            </button>
          </div>
        )}

        {/* Beats table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="w-2 h-2 bg-muiscaGold animate-pulse" />
            <span className="ml-3 font-headline text-sm tracking-widest text-koguiCream/60 uppercase">Cargando beats...</span>
          </div>
        ) : beats.length === 0 && !error ? (
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
                  <th className="p-4">Portada</th>
                  <th className="p-4">Género</th>
                  <th className="p-4">BPM</th>
                  <th className="p-4">Precio</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Reproducciones</th>
                  <th className="p-4">Audio</th>
                  {isProducer && <th className="p-4">Licencias</th>}
                  {isProducer && <th className="p-4">Acción</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-koguiCream/10">
                {beats.map((beat) => (
                  <tr key={beat.id} className="hover:bg-muiscaGold/5 transition-colors">
                    <td className="p-4 font-medium text-koguiCream">{beat.title}</td>
                    <td className="p-4">
                      {beat.coverUrl ? (
                        <img
                          src={`${API_BASE}${beat.coverUrl}`}
                          alt={`${beat.title} cover`}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <span className="text-xs text-koguiCream/30">—</span>
                      )}
                    </td>
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
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`${API_BASE}/api/v1/storage/download/${encodeURIComponent(beat.audioUrl!)}`);
                              if (!res.ok) throw new Error('Error al obtener URL');
                              const data = (await res.json()) as { url: string };
                              window.open(data.url, '_blank');
                            } catch {
                              window.open(`${API_BASE}${beat.audioUrl}`, '_blank');
                            }
                          }}
                          className="text-xs font-bold uppercase tracking-wider text-muiscaGold hover:text-muiscaGold/70 transition-colors"
                          title="Descargar"
                        >
                          ⬇ Descargar
                        </button>
                      ) : (
                        <span className="text-xs text-koguiCream/30">Sin audio</span>
                      )}
                    </td>
                    {isProducer && (
                      <td className="p-4">
                        <button
                          onClick={() => setLicenseManagerBeatId(beat.id)}
                          className="text-xs font-bold uppercase tracking-wider text-muiscaGold hover:text-muiscaGold/70 transition-colors"
                        >
                          ⚙ Licencias
                        </button>
                      </td>
                    )}
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

      {/* License Manager Modal */}
      {licenseManagerBeatId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/80 backdrop-blur-sm">
          <div className="w-full max-w-lg px-4">
            <BeatLicenseManager
              beatId={licenseManagerBeatId}
              onClose={() => setLicenseManagerBeatId(null)}
            />
          </div>
        </div>
      )}
    </main>
  );
}
