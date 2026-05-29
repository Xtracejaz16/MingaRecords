import { useState } from 'react';
import { useBeatLicenses } from '../hooks/useBeatLicenses';
import {
  LICENSE_TYPE_INFO,
  PRICE_RANGES,
  centsToDollars,
  dollarsToCents,
  isPriceInRange,
} from '../../../domain/licenses/entities/license';
import type { LicenseTypeValue } from '../../../domain/licenses/entities/license';

interface LicenseFormEntry {
  type: LicenseTypeValue;
  priceCents: number;
  isActive: boolean;
}

interface Props {
  beatId: string;
  onClose: () => void;
}

const LICENSE_TYPES: LicenseTypeValue[] = ['BASIC', 'PREMIUM', 'EXCLUSIVE'];

function buildDefaultEntries(): LicenseFormEntry[] {
  return LICENSE_TYPES.map((type) => ({
    type,
    priceCents: PRICE_RANGES[type].minCents,
    isActive: false,
  }));
}

function buildEntriesFromLicenses(licenses: LicenseFormEntry[]): LicenseFormEntry[] {
  return LICENSE_TYPES.map((type) => {
    const existing = licenses.find((l) => l.type === type);
    return {
      type,
      priceCents: existing?.priceCents ?? PRICE_RANGES[type].minCents,
      isActive: existing?.isActive ?? false,
    };
  });
}

export function BeatLicenseManager({ beatId, onClose }: Props) {
  const { licenses, isLoading, error, isSaving, updateLicenses, loadLicenses } = useBeatLicenses(beatId);
  const [formEntries, setFormEntries] = useState<LicenseFormEntry[]>(buildDefaultEntries);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [synced, setSynced] = useState(false);

  // Sync form with API data once loading completes (render-time, safe pattern)
  if (!synced && !isLoading) {
    setFormEntries(
      licenses.length > 0
        ? buildEntriesFromLicenses(licenses)
        : buildDefaultEntries(),
    );
    setSynced(true);
  }

  function updateEntry(type: LicenseTypeValue, field: keyof LicenseFormEntry, value: boolean | number) {
    setFormEntries((prev) =>
      prev.map((e) => (e.type === type ? { ...e, [field]: value } : e)),
    );
    setSaveSuccess(false);
    setSaveError(null);
  }

  async function handleSave() {
    setSaveError(null);
    setSaveSuccess(false);

    // Validate
    for (const entry of formEntries) {
      if (entry.isActive && !isPriceInRange(entry.type, entry.priceCents)) {
        const range = PRICE_RANGES[entry.type];
        setSaveError(
          `El precio para ${LICENSE_TYPE_INFO[entry.type].displayName} debe estar entre $${centsToDollars(range.minCents).toFixed(2)} y $${centsToDollars(range.maxCents).toFixed(2)}`,
        );
        return;
      }
    }

    try {
      await updateLicenses(
        formEntries
          .filter((e) => e.isActive)
          .map((e) => ({
            type: e.type,
            priceCents: e.priceCents,
            isActive: e.isActive,
          })),
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar');
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border border-koguiCream/20 bg-obsidian/80 p-6">
        <div className="flex items-center justify-center py-8">
          <span className="h-2 w-2 animate-pulse bg-muiscaGold" />
          <span className="ml-3 font-headline text-sm uppercase tracking-widest text-koguiCream/60">
            Cargando licencias...
          </span>
        </div>
      </div>
    );
  }

  if (error && formEntries.length === 0) {
    return (
      <div className="rounded-lg border border-koguiCream/20 bg-obsidian/80 p-6">
        <div className="rounded-lg border border-taironaTerracotta/30 bg-taironaTerracotta/10 px-6 py-4 text-sm text-taironaTerracotta">
          Error al cargar: {error}
          <button
            onClick={loadLicenses}
            className="ml-4 underline hover:text-koguiCream"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-koguiCream/20 bg-obsidian/80 p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-headline text-xl font-bold text-muiscaGold">
            Licencias / Ofrendas
          </h2>
          <p className="mt-1 text-xs text-koguiCream/50">
            Configurá los tipos de licencia que ofrecés para este beat
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg border border-koguiCream/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-koguiCream/60 transition-colors hover:border-taironaTerracotta/50 hover:text-taironaTerracotta"
        >
          ✕ Cerrar
        </button>
      </div>

      {/* License entries */}
      <div className="space-y-4">
        {formEntries.map((entry) => {
          const info = LICENSE_TYPE_INFO[entry.type];
          const range = PRICE_RANGES[entry.type];
          const priceInRange = !entry.isActive || isPriceInRange(entry.type, entry.priceCents);

          return (
            <div
              key={entry.type}
              className={`rounded-lg border p-4 transition-colors ${
                entry.isActive
                  ? 'border-muiscaGold/30 bg-muiscaGold/5'
                  : 'border-koguiCream/10 bg-transparent opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-headline text-sm font-bold uppercase tracking-wider text-koguiCream">
                    {info.displayName}
                  </span>
                  <p className="mt-0.5 text-xs text-koguiCream/40">{info.description}</p>
                </div>
                {/* Toggle */}
                <button
                  onClick={() => updateEntry(entry.type, 'isActive', !entry.isActive)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    entry.isActive ? 'bg-muiscaGold' : 'bg-koguiCream/20'
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-obsidian transition-transform ${
                      entry.isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Price input (only when active) */}
              {entry.isActive && (
                <div className="mt-4">
                  <label className="block text-xs font-bold uppercase tracking-widest text-koguiCream/60">
                    Precio
                  </label>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-koguiCream/60">$</span>
                    <input
                      type="number"
                      value={centsToDollars(entry.priceCents)}
                      onChange={(e) => {
                        const dollars = parseFloat(e.target.value) || 0;
                        updateEntry(entry.type, 'priceCents', dollarsToCents(dollars));
                      }}
                      min={centsToDollars(range.minCents)}
                      max={centsToDollars(range.maxCents)}
                      step="0.01"
                      className={`w-32 rounded-lg border px-3 py-1.5 font-body text-sm outline-none transition-colors ${
                        priceInRange
                          ? 'border-koguiCream/20 bg-koguiCream/5 text-koguiCream focus:border-muiscaGold'
                          : 'border-taironaTerracotta/50 bg-taironaTerracotta/10 text-taironaTerracotta focus:border-taironaTerracotta'
                      }`}
                    />
                    <span className="text-xs text-koguiCream/40">
                      Rango: ${centsToDollars(range.minCents).toFixed(2)} – ${centsToDollars(range.maxCents).toFixed(2)}
                    </span>
                  </div>
                  {!priceInRange && (
                    <p className="mt-1 text-xs text-taironaTerracotta">
                      El precio está fuera del rango permitido
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error / Success messages */}
      {saveError && (
        <div className="mt-4 rounded-lg border border-taironaTerracotta/30 bg-taironaTerracotta/10 px-4 py-3 text-sm text-taironaTerracotta">
          {saveError}
        </div>
      )}

      {saveSuccess && (
        <div className="mt-4 rounded-lg border border-wayuuJade/30 bg-wayuuJade/10 px-4 py-3 text-sm text-wayuuJade">
          Licencias guardadas exitosamente
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-taironaTerracotta/30 bg-taironaTerracotta/10 px-4 py-3 text-sm text-taironaTerracotta">
          {error}
        </div>
      )}

      {/* Save button */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-lg border border-koguiCream/20 px-5 py-2.5 font-headline text-xs font-bold uppercase tracking-widest text-koguiCream/60 transition-colors hover:border-koguiCream/40 hover:text-koguiCream"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-lg bg-muiscaGold px-5 py-2.5 font-headline text-xs font-bold uppercase tracking-widest text-obsidian transition-all hover:bg-muiscaGold/80 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
