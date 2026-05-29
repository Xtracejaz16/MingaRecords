import { useState, useEffect, useCallback } from 'react';
import { ApiLicenseRepository } from '../../../infrastructure/licenses/adapters/apiLicenseRepository.js';
import type { BeatLicense, LicenseTypeValue } from '../../../domain/licenses/entities/license.js';

export function useBeatLicenses(beatId: string) {
  const [repository] = useState(() => new ApiLicenseRepository());
  const [licenses, setLicenses] = useState<BeatLicense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadLicenses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await repository.getLicenses(beatId);
      setLicenses(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar licencias');
      setLicenses([]);
    } finally {
      setIsLoading(false);
    }
  }, [beatId, repository]);

  useEffect(() => {
    if (beatId) {
      loadLicenses();
    }
  }, [beatId, loadLicenses]);

  const updateLicenses = useCallback(
    async (
      data: Array<{ type: LicenseTypeValue; priceCents: number; isActive?: boolean }>,
    ): Promise<void> => {
      setIsSaving(true);
      setError(null);
      try {
        const result = await repository.upsertLicenses(beatId, data);
        setLicenses(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al guardar licencias';
        setError(message);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [beatId, repository],
  );

  return {
    licenses,
    isLoading,
    error,
    isSaving,
    updateLicenses,
    loadLicenses,
  };
}
