import type { CreateBeatInput, UpdateBeatInput, Beat } from './types.js';
import * as beatsRepo from './repository.js';
import type { StorageProvider } from './storage.js';

// --- Errors ---

export class BeatNotFoundError extends Error {
  constructor(id: string) {
    super(`Beat not found: ${id}`);
    this.name = 'BeatNotFoundError';
  }
}

export class BeatForbiddenError extends Error {
  constructor() {
    super('You are not allowed to modify this beat');
    this.name = 'BeatForbiddenError';
  }
}

// --- Service Functions ---

export async function createBeat(
  input: CreateBeatInput,
  files: { audio: Buffer; audioName: string; cover: Buffer; coverName: string },
  sellerId: string,
  storage: StorageProvider,
): Promise<Beat> {
  const audioUrl = await storage.uploadFile(files.audio, files.audioName, 'audio/mpeg');
  const coverUrl = await storage.uploadFile(files.cover, files.coverName, 'image/jpeg');

  return beatsRepo.createBeat({
    ...input,
    audioUrl,
    coverUrl,
    sellerId,
  });
}

export async function getBeat(id: string): Promise<Beat> {
  const beat = await beatsRepo.getBeatById(id);
  if (!beat) throw new BeatNotFoundError(id);
  return beat;
}

export async function listCatalog(options?: { skip?: number; take?: number }): Promise<Beat[]> {
  return beatsRepo.listBeats(options);
}

export async function updateBeat(
  id: string,
  input: UpdateBeatInput,
  currentUserId: string,
): Promise<Beat> {
  const beat = await getBeat(id);
  if (beat.sellerId !== currentUserId) throw new BeatForbiddenError();
  return beatsRepo.updateBeat(id, input);
}

export async function deleteBeat(
  id: string,
  currentUserId: string,
  storage: StorageProvider,
): Promise<void> {
  const beat = await getBeat(id);
  if (beat.sellerId !== currentUserId) throw new BeatForbiddenError();

  await beatsRepo.deleteBeat(id);

  // Best-effort cleanup of stored files (already deleted from DB)
  try {
    await storage.deleteFile(beat.audioUrl);
  } catch (err) {
    console.warn(`Failed to delete audio file for beat ${id}:`, err);
  }

  try {
    await storage.deleteFile(beat.coverUrl);
  } catch (err) {
    console.warn(`Failed to delete cover file for beat ${id}:`, err);
  }
}
