import type {
  CreateBeatInput,
  UpdateBeatInput,
  Beat,
  ListBeatsQuery,
  PaginatedBeats,
  BeatStatus,
  ProducerStats,
  GenreRecord,
} from './types.js';
import { VALID_STATUS_TRANSITIONS } from './types.js';
import * as beatsRepo from './repository.js';

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

export class InvalidStatusTransitionError extends Error {
  constructor(from: BeatStatus, to: BeatStatus) {
    super(`Invalid status transition: ${from} → ${to}`);
    this.name = 'InvalidStatusTransitionError';
  }
}

export class ProducerRoleRequiredError extends Error {
  constructor() {
    super('Producer role required');
    this.name = 'ProducerRoleRequiredError';
  }
}

// --- Service Functions ---

export async function createBeat(
  input: CreateBeatInput,
  producerId: string,
): Promise<Beat> {
  return beatsRepo.createBeat({
    ...input,
    producerId,
  });
}

export async function getBeat(id: string): Promise<Beat> {
  const beat = await beatsRepo.getBeatById(id);
  if (!beat) throw new BeatNotFoundError(id);
  return beat;
}

export async function listCatalog(query: ListBeatsQuery): Promise<PaginatedBeats> {
  return beatsRepo.listBeats(query);
}

export async function updateBeat(
  id: string,
  input: UpdateBeatInput,
  currentUserId: string,
): Promise<Beat> {
  const beat = await getBeat(id);
  if (beat.producerId !== currentUserId) throw new BeatForbiddenError();

  if (input.status) {
    const allowed = VALID_STATUS_TRANSITIONS[beat.status];
    if (!allowed.includes(input.status)) {
      throw new InvalidStatusTransitionError(beat.status, input.status);
    }
  }

  return beatsRepo.updateBeat(id, input);
}

export async function deleteBeat(
  id: string,
  currentUserId: string,
): Promise<void> {
  const beat = await getBeat(id);
  if (beat.producerId !== currentUserId) throw new BeatForbiddenError();

  await beatsRepo.deleteBeat(id);
}

export async function getProducerBeats(
  producerId: string,
  options?: { skip?: number; take?: number },
): Promise<Beat[]> {
  return beatsRepo.getBeatsByProducerId(producerId, options);
}

export async function getProducerProfile(producerId: string): Promise<{ id: string; beats: Beat[] }> {
  const beats = await beatsRepo.getBeatsByProducerId(producerId, { take: 10 });
  return { id: producerId, beats };
}

export async function getGenres(): Promise<GenreRecord[]> {
  return beatsRepo.getGenres();
}

export async function getDashboard(producerId: string): Promise<ProducerStats> {
  return beatsRepo.getProducerStats(producerId);
}

export async function markAudioReady(
  beatId: string,
  urls: { audioUrl: string; previewUrl?: string; streamUrl?: string },
): Promise<Beat> {
  const beat = await getBeat(beatId);
  // No auth check — this is called internally by Storage module

  const allowed = VALID_STATUS_TRANSITIONS[beat.status];
  if (!allowed.includes('ready')) {
    throw new InvalidStatusTransitionError(beat.status, 'ready');
  }

  return beatsRepo.updateBeat(beatId, {
    audioUrl: urls.audioUrl,
    previewUrl: urls.previewUrl,
    streamUrl: urls.streamUrl,
    status: 'ready',
  });
}

export async function markBeatCover(
  beatId: string,
  coverUrl: string,
): Promise<Beat> {
  const beat = await getBeat(beatId);
  // No auth check — this is called internally by Storage module

  return beatsRepo.updateBeat(beatId, {
    coverUrl,
  });
}

export async function markAsSold(beatId: string): Promise<Beat> {
  const beat = await getBeat(beatId);
  // No auth check — this is called internally by Payments module

  const allowed = VALID_STATUS_TRANSITIONS[beat.status];
  if (!allowed.includes('sold')) {
    throw new InvalidStatusTransitionError(beat.status, 'sold');
  }

  return beatsRepo.updateBeat(beatId, {
    status: 'sold',
    salesCount: beat.salesCount + 1,
  });
}
