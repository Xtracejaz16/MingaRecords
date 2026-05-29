import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required — asegurate de tener src/.env con DATABASE_URL');
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // ── Clean existing data ──
  await prisma.license.deleteMany();
  await prisma.beat.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // ── Create users ──
  const passwordHash = await bcrypt.hash('test123', 10);

  const beatmaker = await prisma.user.create({
    data: {
      email: 'test@mingarecords.com',
      passwordHash,
      alias: 'BeatMaker Pro',
      role: 'BEATMAKER',
      artistName: 'DJ Prueba',
      bio: 'Productor musical de prueba para verificar el sistema',
      genre: 'Hip Hop',
      profileImage: null,
      emailVerified: true,
    },
  });
  console.log(`  ✅ Beatmaker: test@mingarecords.com / test123`);

  const buyer = await prisma.user.create({
    data: {
      email: 'buyer@test.com',
      passwordHash,
      alias: 'Comprador Test',
      role: 'BUYER',
      emailVerified: true,
    },
  });
  console.log(`  ✅ Buyer: buyer@test.com / test123`);

  // ── Create genres ──
  const genres = ['Hip Hop', 'Trap', 'Reggaeton', 'R&B', 'Electronic', 'Lo-Fi', 'Jazz', 'Rock'];
  await Promise.all(
    genres.map((name) =>
      prisma.genre.create({
        data: {
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
        },
      }),
    ),
  );
  console.log(`  ✅ ${genres.length} genres created`);

  // ── Create beats ──
  const beats = [
    { title: 'Midnight Vibes', priceCents: 2999, genre: 'Lo-Fi', bpm: 85, key: 'Am', status: 'published' as const },
    { title: 'Bass Drop', priceCents: 4999, genre: 'Trap', bpm: 140, key: 'Fm', status: 'published' as const },
    { title: 'Sunset Groove', priceCents: 1999, genre: 'R&B', bpm: 92, key: 'C', status: 'draft' as const },
  ];

  const createdBeats = await Promise.all(
    beats.map((b) =>
      prisma.beat.create({
        data: {
          title: b.title,
          slug: b.title.toLowerCase().replace(/\s+/g, '-'),
          description: `Un beat increíble titulado ${b.title}`,
          priceCents: b.priceCents,
          genre: b.genre,
          bpm: b.bpm,
          key: b.key,
          status: b.status,
          producerId: beatmaker.id,
          tags: [b.genre.toLowerCase(), 'beat', 'instrumental'],
          publishedAt: b.status === 'published' ? new Date() : null,
        },
      }),
    ),
  );
  console.log(`  ✅ ${createdBeats.length} beats created`);

  // ── Create licenses for published beats ──
  for (const beat of createdBeats.filter((b) => b.status === 'published')) {
    await prisma.license.createMany({
      data: [
        { type: 'BASIC', priceCents: 2900, isActive: true, beatId: beat.id },
        { type: 'PREMIUM', priceCents: 9900, isActive: true, beatId: beat.id },
        { type: 'EXCLUSIVE', priceCents: 49900, isActive: true, beatId: beat.id },
      ],
    });
  }
  console.log(`  ✅ Licenses created for published beats`);

  console.log('');
  console.log('🎉 Seed complete!');
  console.log('');
  console.log('┌──────────────────────────────┬─────────────┐');
  console.log('│ Email                        │ Password     │');
  console.log('├──────────────────────────────┼─────────────┤');
  console.log('│ test@mingarecords.com        │ test123      │');
  console.log('│ buyer@test.com               │ test123      │');
  console.log('└──────────────────────────────┴─────────────┘');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
