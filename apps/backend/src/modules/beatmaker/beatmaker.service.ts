// apps/backend/src/modules/beatmaker/beatmaker.service.ts

import { PrismaClient } from '../../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '@/config/env.js';
import type { UpdateBeatmakerProfileDto, BeatmakerProfileResponse } from './beatmaker.types.js';

const adapter = new PrismaPg({
  connectionString: env.databaseUrl,
});

const prisma = new PrismaClient({ adapter });

export async function updateBeatmakerProfile(
  userId: string,
  input: UpdateBeatmakerProfileDto,
): Promise<BeatmakerProfileResponse> {
  const { profileImage, genre, artistName } = input;

  const updateData: Record<string, string> = {};

  if (profileImage !== undefined) {
    validateFieldLength('profileImage', profileImage);
    updateData.profileImage = profileImage;
  }

  if (genre !== undefined) {
    validateFieldLength('genre', genre);
    updateData.genre = genre;
  }

  if (artistName !== undefined) {
    validateFieldLength('artistName', artistName);
    updateData.artistName = artistName;
  }

  if (Object.keys(updateData).length === 0) {
    throw new Error('NO_FIELDS_TO_UPDATE');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      alias: true,
      email: true,
      artistName: true,
      genre: true,
      profileImage: true,
      role: true,
    },
  });

  return updatedUser as unknown as BeatmakerProfileResponse;
}

function validateFieldLength(fieldName: string, value: string): void {
  const MAX_LENGTH = 500;

  if (value.length > MAX_LENGTH) {
    throw new Error(`${fieldName} too long (max ${MAX_LENGTH} characters)`);
  }
}
