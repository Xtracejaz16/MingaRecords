import type { Beat } from '../../../domain/dashboard/Beat';

interface BeatsTableProps {
  beats: Beat[];
}

const STATUS_STYLES = {
  public: 'bg-wayuuJade/10 text-wayuuJade border-wayuuJade/20',
  draft: 'bg-taironaTerracotta/10 text-taironaTerracotta border-taironaTerracotta/20',
} as const;

function formatCurrency(value: number) {
  return `$${value.toLocaleString('es-CO')}`;
}

export function BeatsTable({ beats }: BeatsTableProps) {
  return (
    <section className="tunjo-clip overflow-hidden border border-muiscaGold/10 bg-obsidian/40 backdrop-blur-sm">
      <div className="flex items-end justify-between border-b border-taironaTerracotta/20 bg-taironaTerracotta/5 p-8">
        <h2 className="font-headline text-3xl font-black uppercase tracking-widest text-koguiCream">Mis Beats</h2>
        <button className="flex items-center gap-2 text-xs italic uppercase tracking-widest text-muiscaGold transition-colors hover:text-koguiCream font-headline" type="button">
          View Archive
          <span className="material-symbols-outlined text-sm">arrow_right_alt</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead className="bg-obsidian font-headline text-[10px] uppercase tracking-[0.3em] text-taironaTerracotta">
            <tr>
              <th className="px-8 py-5">Track Name</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5">Price (COP)</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="font-body text-base">
            {beats.map((beat) => (
              <tr key={beat.id} className="border-b border-taironaTerracotta/10 transition-colors hover:bg-taironaTerracotta/10">
                <td className="flex items-center gap-4 px-8 py-6">
                  <div className="relative border border-muiscaGold/30 p-1">
                    <img alt={beat.title} className="h-12 w-12 brightness-75 grayscale" src={beat.coverUrl} />
                  </div>
                  <div>
                    <p className="font-bold text-koguiCream">{beat.title}</p>
                    <p className="text-xs italic text-muiscaGold/60">{beat.genre}</p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className={`border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${STATUS_STYLES[beat.status]}`}>
                    {beat.status === 'public' ? 'Public' : 'Draft'}
                  </span>
                </td>
                <td className="px-8 py-6 font-mono text-koguiCream">{formatCurrency(beat.priceCOP)}</td>
                <td className="px-8 py-6 text-right">
                  <button className="group ml-auto flex items-center justify-end gap-2 text-muiscaGold transition-transform hover:scale-105" type="button">
                    <span className="font-headline text-[10px] font-bold uppercase tracking-widest group-hover:underline">Edit Ritual</span>
                    <span className="material-symbols-outlined text-sm [font-variation-settings:'FILL'_1]">
                      architecture
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
