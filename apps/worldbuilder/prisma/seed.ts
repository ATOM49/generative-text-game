import { PrismaClient } from '@prisma/client';
import { MIDDLE_EARTH_WORLD, MIDDLE_EARTH_FACTIONS } from './seed-data';
import { clearDatabase, generateWorldMap, seedFactions } from './seed-helpers';
import { GridService } from '../src/lib/api/grid.service';

const prisma = new PrismaClient();

async function seedWorld() {
  console.log('🌍 Creating Middle-earth world...');

  const imageUrl = await generateWorldMap(MIDDLE_EARTH_WORLD);

  const world = await prisma.world.create({
    data: {
      ...MIDDLE_EARTH_WORLD,
      mapImageUrl: imageUrl,
    },
  });

  await new GridService(prisma).createDefaultGrid(world.id);

  console.log(`✅ Created world: ${world.name} (${world.id})`);
  if (imageUrl) {
    console.log(`   Map URL: ${imageUrl}`);
  }

  return world;
}

async function main() {
  console.log('🌱 Starting complete database seed...\n');

  await clearDatabase(prisma);
  const world = await seedWorld();
  await seedFactions(prisma, world.id, MIDDLE_EARTH_FACTIONS);

  console.log('\n✨ Complete seeding finished!');
  console.log(`\n📍 World ID: ${world.id}`);
  console.log(`   Visit: http://localhost:3000/worlds/${world.id}/map`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
