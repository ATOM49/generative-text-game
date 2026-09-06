import assert from 'node:assert/strict';
import test from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { ApiError } from '../src/lib/api/errors';
import { GameplayService } from '../src/lib/api/gameplay.service';

const action = {
  actionId: 'action-1',
  expectedVersion: 2,
  action: { type: 'CONTINUE_TRAVEL' as const },
};

test('mission actions are authorized before idempotency records are exposed', async () => {
  let duplicateRead = false;
  const fakePrisma = {
    mission: { findFirst: async () => null },
    missionAction: {
      findUnique: async () => {
        duplicateRead = true;
        return null;
      },
    },
  } as unknown as PrismaClient;

  await assert.rejects(
    new GameplayService(fakePrisma).submitAction(
      'mission-1',
      'intruder',
      action,
    ),
    (error: unknown) => error instanceof ApiError && error.statusCode === 404,
  );
  assert.equal(duplicateRead, false);
});

test('a stale expected version is rejected before an action record is written', async () => {
  let actionWritten = false;
  const fakePrisma = {
    mission: { findFirst: async () => ({ version: 3 }) },
    missionAction: {
      findUnique: async () => null,
      create: async () => {
        actionWritten = true;
      },
    },
  } as unknown as PrismaClient;

  await assert.rejects(
    new GameplayService(fakePrisma).submitAction(
      'mission-1',
      'explorer-1',
      action,
    ),
    (error: unknown) => error instanceof ApiError && error.statusCode === 409,
  );
  assert.equal(actionWritten, false);
});

test('a duplicate action still being processed returns conflict without applying it again', async () => {
  let actionWritten = false;
  const fakePrisma = {
    mission: { findFirst: async () => ({ version: 2 }) },
    missionAction: {
      findUnique: async () => ({
        status: 'PENDING',
        response: null,
        error: null,
      }),
      create: async () => {
        actionWritten = true;
      },
    },
  } as unknown as PrismaClient;

  await assert.rejects(
    new GameplayService(fakePrisma).submitAction(
      'mission-1',
      'explorer-1',
      action,
    ),
    (error: unknown) => error instanceof ApiError && error.statusCode === 409,
  );
  assert.equal(actionWritten, false);
});
