import 'dotenv/config';

import { PrismaClient } from '@prisma/client';
import { WorldGenerationService } from '../lib/api/world-generation.service';

const DEFAULT_POLL_INTERVAL_MS = 1_000;

const configuredPollInterval = Number(
  process.env.WORLD_GENERATION_WORKER_POLL_INTERVAL_MS ||
    DEFAULT_POLL_INTERVAL_MS,
);
const pollIntervalMs =
  Number.isFinite(configuredPollInterval) && configuredPollInterval > 0
    ? configuredPollInterval
    : DEFAULT_POLL_INTERVAL_MS;

const prisma = new PrismaClient();
const worldGenerationService = new WorldGenerationService(prisma);
let stopping = false;

const stop = () => {
  stopping = true;
};

process.once('SIGINT', stop);
process.once('SIGTERM', stop);

const waitForNextPoll = () =>
  new Promise<void>((resolve) => setTimeout(resolve, pollIntervalMs));

const run = async () => {
  console.info(
    `[world-generation-worker] Started with ${pollIntervalMs}ms polling`,
  );

  while (!stopping) {
    try {
      const jobId = await worldGenerationService.runNextJob();
      if (jobId) {
        console.info(`[world-generation-worker] Processed job ${jobId}`);
        continue;
      }
    } catch (error) {
      console.error(
        '[world-generation-worker] Job polling failed:',
        error instanceof Error ? error.message : 'Unknown error',
      );
    }

    await waitForNextPoll();
  }
};

run()
  .catch((error) => {
    console.error(
      '[world-generation-worker] Fatal error:',
      error instanceof Error ? error.message : 'Unknown error',
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.info('[world-generation-worker] Stopped');
  });
