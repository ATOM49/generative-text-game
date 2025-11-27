import { PrismaClient } from '@prisma/client';
import { MIDDLE_EARTH_FACTIONS } from './seed-data';
import { getWorldOrFirst, seedFactions } from './seed-helpers';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding factions for existing world...');

  const worldId = process.argv[2];
  const world = await getWorldOrFirst(prisma, worldId);

  console.log(`📍 Using world: ${world.name} (${world.id})`);

  await seedFactions(prisma, world.id, MIDDLE_EARTH_FACTIONS, 'upsert');

  console.log('\n✨ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
