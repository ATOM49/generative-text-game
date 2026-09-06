import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { NarrativeGenerationService } from '../lib/api/narrative-generation.service';

const pollInterval = Number(
  process.env.NARRATIVE_GENERATION_WORKER_POLL_INTERVAL_MS ?? 1000,
);
const prisma = new PrismaClient();
const service = new NarrativeGenerationService(prisma, {});
let stopping = false;

process.once('SIGINT', () => {
  stopping = true;
});
process.once('SIGTERM', () => {
  stopping = true;
});

const wait = () =>
  new Promise<void>((resolve) => setTimeout(resolve, pollInterval));

async function run() {
  console.info(`[narrative-worker] Started with ${pollInterval}ms polling`);
  while (!stopping) {
    try {
      if (await service.runNextJob()) continue;
    } catch (error) {
      console.error(
        '[narrative-worker] Job polling failed:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
    await wait();
  }
}

run()
  .catch((error) => {
    console.error(
      '[narrative-worker] Fatal error:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
