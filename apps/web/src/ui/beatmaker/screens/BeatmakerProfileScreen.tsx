import { useBeatmakerProfile } from '../hooks/useBeatmakerProfile';
import { SideNavBar } from '../../shared/components/SideNavBar';
import { TopNavBar } from '../../shared/components/TopNavBar';

export function BeatmakerProfileScreen() {
  const { form, updateField, save, saving, error, success, session } = useBeatmakerProfile();

  return (
    <main className="page-shell page-shell--dashboard min-h-screen bg-obsidian font-body text-koguiCream mineral-grain">
      <TopNavBar />
      <SideNavBar />
      <div className="page-shell__grain" />
      <div className="page-shell__pattern" />

      <div className="relative ml-64 mt-20 flex max-w-7xl flex-1 flex-col gap-12 bg-transparent p-12 pattern-vueltiao-subtle">
        {/* Header */}
        <section className="relative flex flex-col gap-6">
          <h1 className="font-headline text-6xl font-black leading-none tracking-tighter text-koguiCream md:text-7xl">
            TU <span className="text-muiscaGold">PERFIL</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-px flex-1 bg-muiscaGold/30" />
            <span className="font-headline text-xl italic uppercase tracking-[0.4em] text-taironaTerracotta">
              Beatmaker
            </span>
            <div className="h-px w-12 bg-muiscaGold/30" />
          </div>
        </section>

        {/* Status messages */}
        {success && (
          <div className="rounded border border-green-500/30 bg-green-500/10 p-4 font-body text-sm text-green-300">
            {success}
          </div>
        )}
        {error && (
          <div className="rounded border border-red-500/30 bg-red-500/10 p-4 font-body text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Profile Form */}
        <div className="stone-tablet tunjo-clip p-8">
          <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Profile Image */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 scale-75 transform rotate-45 rounded-sm border border-muiscaGold/40" />
                {form.profileImage ? (
                  <img
                    src={form.profileImage}
                    alt="Profile"
                    className="relative z-10 h-32 w-32 border border-muiscaGold object-cover brightness-90 grayscale"
                  />
                ) : (
                  <div className="relative z-10 flex h-32 w-32 items-center justify-center border border-muiscaGold/30 bg-taironaTerracotta/10">
                    <span className="material-symbols-outlined text-4xl text-koguiCream/30">person</span>
                  </div>
                )}
              </div>
              <label className="cursor-pointer rounded border border-muiscaGold/30 px-4 py-2 text-xs uppercase tracking-widest text-muiscaGold transition-colors hover:bg-muiscaGold/10">
                Subir imagen
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // For now, create an object URL as a preview
                      // In production, upload to storage/Cloudinary first
                      const url = URL.createObjectURL(file);
                      updateField('profileImage', url);
                    }
                  }}
                />
              </label>
            </div>

            {/* Form Fields */}
            <div className="md:col-span-2 flex flex-col gap-6">
              {/* Artist Name */}
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest text-muiscaGold/70">
                  Nombre artístico
                </label>
                <input
                  type="text"
                  value={form.artistName}
                  onChange={(e) => updateField('artistName', e.target.value)}
                  placeholder="Tu nombre artístico"
                  className="w-full border border-taironaTerracotta/20 bg-obsidian/50 px-4 py-3 font-body text-sm text-koguiCream placeholder-koguiCream/30 outline-none transition-colors focus:border-muiscaGold/60"
                  maxLength={100}
                />
              </div>

              {/* Genre */}
              <div className="flex flex-col gap-2">
                <label className="text-xs uppercase tracking-widest text-muiscaGold/70">
                  Género musical
                </label>
                <select
                  value={form.genre}
                  onChange={(e) => updateField('genre', e.target.value)}
                  className="w-full appearance-none border border-taironaTerracotta/20 bg-obsidian/50 px-4 py-3 font-body text-sm text-koguiCream outline-none transition-colors focus:border-muiscaGold/60"
                >
                  <option value="">Seleccioná un género</option>
                  <option value="Hip Hop">Hip Hop</option>
                  <option value="Trap">Trap</option>
                  <option value="Reggaeton">Reggaeton</option>
                  <option value="Dancehall">Dancehall</option>
                  <option value="R&B">R&B</option>
                  <option value="Afrobeat">Afrobeat</option>
                  <option value="Electronic">Electronic</option>
                  <option value="Lo-fi">Lo-fi</option>
                  <option value="Pop">Pop</option>
                  <option value="Rock">Rock</option>
                  <option value="Jazz">Jazz</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              {/* Save Button */}
              <button
                onClick={save}
                disabled={saving}
                className="mt-4 self-start border border-muiscaGold bg-muiscaGold/10 px-8 py-3 font-headline text-sm uppercase tracking-[0.3em] text-muiscaGold transition-all hover:bg-muiscaGold/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? 'GUARDANDO...' : 'GUARDAR PERFIL'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
