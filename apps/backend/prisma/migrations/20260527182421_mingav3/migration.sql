/*
  Warnings:

  - You are about to drop the column `isSold` on the `Beat` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Beat` table. All the data in the column will be lost.
  - You are about to drop the column `sellerId` on the `Beat` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `VerificationToken` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `Beat` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tokenHash]` on the table `VerificationToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `priceCents` to the `Beat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `producerId` to the `Beat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Beat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokenHash` to the `VerificationToken` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BeatStatus" AS ENUM ('draft', 'pending_audio', 'processing', 'ready', 'published', 'sold', 'archived', 'deleted');

-- DropForeignKey
ALTER TABLE "Beat" DROP CONSTRAINT "Beat_sellerId_fkey";

-- DropIndex
DROP INDEX "VerificationToken_token_key";

-- AlterTable
ALTER TABLE "Beat" DROP COLUMN "isSold",
DROP COLUMN "price",
DROP COLUMN "sellerId",
ADD COLUMN     "bpm" INTEGER,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "genre" TEXT,
ADD COLUMN     "key" TEXT,
ADD COLUMN     "playsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "previewUrl" TEXT,
ADD COLUMN     "priceCents" INTEGER NOT NULL,
ADD COLUMN     "producerId" TEXT NOT NULL,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "salesCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "status" "BeatStatus" NOT NULL DEFAULT 'draft',
ADD COLUMN     "streamUrl" TEXT,
ADD COLUMN     "tags" TEXT[],
ALTER COLUMN "audioUrl" DROP NOT NULL,
ALTER COLUMN "coverUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "VerificationToken" DROP COLUMN "token",
ADD COLUMN     "tokenHash" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_slug_key" ON "Genre"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Beat_slug_key" ON "Beat"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_tokenHash_key" ON "VerificationToken"("tokenHash");

-- AddForeignKey
ALTER TABLE "Beat" ADD CONSTRAINT "Beat_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
