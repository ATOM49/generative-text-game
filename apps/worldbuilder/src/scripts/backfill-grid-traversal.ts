import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { GridService } from '../lib/api/grid.service';

const prisma = new PrismaClient();

new GridService(prisma)
  .backfillTraversalProfiles()
  .then((updated) => {
    console.info(`[grid-traversal] Backfilled ${updated} grid cells.`);
  })
  .catch((error) => {
    console.error(
      '[grid-traversal] Backfill failed:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
