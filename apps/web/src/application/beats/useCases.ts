import type { Beat, CreateBeatInput } from '../../domain/beats/entities/beat.js';
import type { ApiBeatRepository } from '../../infrastructure/beats/adapters/apiBeatRepository.js';

export async function getBeatsUseCase(
  repo: ApiBeatRepository,
  params?: { page?: number; limit?: number },
) {
  return repo.getBeats(params ?? {});
}

export async function getBeatUseCase(
  repo: ApiBeatRepository,
  id: string,
): Promise<Beat> {
  return repo.getBeat(id);
}

export async function createBeatUseCase(
  repo: ApiBeatRepository,
  input: CreateBeatInput,
): Promise<Beat> {
  return repo.createBeat(input);
}

export async function deleteBeatUseCase(
  repo: ApiBeatRepository,
  id: string,
): Promise<void> {
  return repo.deleteBeat(id);
}

export async function uploadAudioUseCase(
  repo: ApiBeatRepository,
  beatId: string,
  file: File,
): Promise<{ key: string; url: string }> {
  return repo.uploadAudio(beatId, file);
}

export async function uploadCoverUseCase(
  repo: ApiBeatRepository,
  beatId: string,
  file: File,
): Promise<{ key: string; url: string }> {
  return repo.uploadCover(beatId, file);
}
