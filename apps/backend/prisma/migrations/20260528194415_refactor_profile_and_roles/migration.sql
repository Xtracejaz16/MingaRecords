/*
  Data-preserving migration:
  - Rename avatarUrl → profileImage (keeps existing data)
  - Rename beatmakerGenre → genre (keeps existing data)
  - Convert role from TEXT to Role enum (maps existing values)
*/

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('BEATMAKER', 'BUYER', 'ADMIN');

-- Step 1: Rename columns (preserve existing data)
ALTER TABLE "User" RENAME COLUMN "avatarUrl" TO "profileImage";
ALTER TABLE "User" RENAME COLUMN "beatmakerGenre" TO "genre";

-- Step 2: Update existing role string values to new enum values before changing column type
UPDATE "User" SET role = 'BEATMAKER' WHERE role = 'producer';
UPDATE "User" SET role = 'BUYER' WHERE role = 'artist';
-- ADMIN doesn't exist yet but we handle it if it does
UPDATE "User" SET role = 'ADMIN' WHERE role = 'admin';

-- Step 3: Change role column type from TEXT to Role enum
ALTER TABLE "User" ALTER COLUMN "role" SET DATA TYPE "Role" USING "role"::text::"Role";
ALTER TABLE "User" ALTER COLUMN "role" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'BEATMAKER';
