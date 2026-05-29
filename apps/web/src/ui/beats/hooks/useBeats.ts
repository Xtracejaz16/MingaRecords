import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { ApiBeatRepository } from '../../../infrastructure/beats/adapters/apiBeatRepository.js';
import type { Beat, CreateBeatInput } from '../../../domain/beats/entities/beat.js';
import {
  getBeatsUseCase,
  createBeatUseCase,
  deleteBeatUseCase,
  uploadAudioUseCase,
  uploadCoverUseCase,
} from '../../../application/beats/useCases.js';

export function useBeats() {
  const [repository] = useState(() => new ApiBeatRepository());
  const { session, isLoading: authLoading, getAccessToken } = useAuth();
  const [beats, setBeats] = useState<Beat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'creating' | 'uploading' | 'done' | 'error'>('idle');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Action message (success/error toast)
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const actionTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const isProducer = session?.role === 'BEATMAKER';

  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    if (actionTimer.current) clearTimeout(actionTimer.current);
    setActionMsg({ type, text });
    actionTimer.current = setTimeout(() => setActionMsg(null), 4000);
  }, []);

  const loadBeats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getBeatsUseCase(repository);
      setBeats(result.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar beats');
      setBeats([]);
    } finally {
      setIsLoading(false);
    }
  }, [repository]);

  useEffect(() => {
    loadBeats();
  }, [loadBeats]);

  const uploadBeat = useCallback(
    async (input: CreateBeatInput, audioFile: File, coverFile?: File | null) => {
      const token = getAccessToken();
      if (!token) {
        showMessage('error', 'Necesitás iniciar sesión para subir beats');
        return;
      }

      setUploadStatus('creating');
      setUploadError(null);

      try {
        // 1. Create beat metadata
        const beat = await createBeatUseCase(repository, input);
        const beatId = beat.id;

        // 2. Upload audio
        setUploadStatus('uploading');
        await uploadAudioUseCase(repository, beatId, audioFile);

        // 3. Upload cover if provided
        if (coverFile) {
          await uploadCoverUseCase(repository, beatId, coverFile);
        }

        setUploadStatus('done');
        showMessage('success', `¡"${input.title}" subido exitosamente!`);
        await loadBeats();
      } catch (err) {
        setUploadStatus('error');
        const message = err instanceof Error ? err.message : 'Error inesperado';
        setUploadError(message);
        showMessage('error', message);
      }
    },
    [repository, getAccessToken, showMessage, loadBeats],
  );

  const deleteBeat = useCallback(
    async (beatId: string) => {
      const token = getAccessToken();
      if (!token) return;

      try {
        await deleteBeatUseCase(repository, beatId);
        showMessage('success', 'Beat eliminado');
        await loadBeats();
      } catch (err) {
        showMessage('error', err instanceof Error ? err.message : 'Error al eliminar');
      }
    },
    [repository, getAccessToken, showMessage, loadBeats],
  );

  const resetUpload = useCallback(() => {
    setUploadStatus('idle');
    setUploadError(null);
  }, []);

  return {
    // State
    beats,
    isLoading: isLoading || authLoading,
    error,
    // Upload
    uploadStatus,
    uploadError,
    // Actions
    loadBeats,
    uploadBeat,
    deleteBeat,
    resetUpload,
    // UI helpers
    actionMsg,
    showMessage,
    isProducer,
    session,
  };
}
