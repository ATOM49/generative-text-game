import assert from 'node:assert/strict';
import test from 'node:test';
import type { Prisma, PrismaClient } from '@prisma/client';
import { CharacterService } from '../src/lib/api/character.service';
import { ApiError } from '../src/lib/api/errors';
import { StoryService } from '../src/lib/api/story.service';

const now = new Date('2026-09-04T10:00:00.000Z');

const worldRecord = {
  id: 'world-1',
  version: 1,
  name: 'The Amber Expanse',
  description: 'A desert world crossed by singing roads.',
  theme: 'fantasy',
  contextWindowLimit: 1024,
  mapImageUrl: null,
  settings: null,
  lore: null,
  createdAt: now,
  updatedAt: now,
};

const characterRecord = {
  id: 'character-1',
  worldId: worldRecord.id,
  userId: null as string | null,
  name: 'Ilyra Vale',
  description: 'A guide who follows echoes in the dunes.',
  biography: null,
  previewUrl: null,
  gallery: null,
  promptHint: null,
  traits: [],
  factionIds: [],
  cultureIds: [],
  speciesIds: [],
  archetypeIds: [],
  meta: { descriptors: [] },
  createdAt: now,
  updatedAt: now,
};

const storyRecord = {
  id: 'story-1',
  worldId: worldRecord.id,
  startedByUserId: 'explorer-1',
  title: `${characterRecord.name} in ${worldRecord.name}`,
  status: 'ACTIVE' as const,
  setupStatus: 'QUEUED' as const,
  setupError: null,
  premise: null,
  state: {
    knownFacts: [],
    consequences: [],
    unresolvedThreads: [],
    inventory: [],
    usedItemKeys: [],
    relationships: [],
    visitedCellIds: [],
    travelHistory: [],
  },
  startedAt: now,
  createdAt: now,
  updatedAt: now,
  completedAt: null,
  participants: [
    {
      id: 'participant-1',
      storyId: 'story-1',
      userId: 'explorer-1',
      characterId: characterRecord.id,
      joinedAt: now,
    },
  ],
};

test('starting a story associates a world character without taking ownership', async () => {
  let upsertArgs: Prisma.StoryUpsertArgs | undefined;
  const fakePrisma = {
    world: {
      findUnique: async () => worldRecord,
    },
    character: {
      findUnique: async () => characterRecord,
    },
    story: {
      upsert: async (args: Prisma.StoryUpsertArgs) => {
        upsertArgs = args;
        return storyRecord;
      },
    },
    narrativeJob: {
      upsert: async () => ({}),
    },
  } as unknown as PrismaClient;

  const story = await new StoryService(fakePrisma).startStory(
    worldRecord.id,
    'explorer-1',
    { characterId: characterRecord.id },
  );

  assert.equal(story._id, storyRecord.id);
  assert.equal(story.participants[0]?.character._id, characterRecord.id);
  assert.equal(story.participants[0]?.character.userId, undefined);
  assert.deepEqual(upsertArgs?.create.participants, {
    create: { userId: 'explorer-1', characterId: characterRecord.id },
  });
  assert.equal(characterRecord.userId, null);
});

test('an explorer cannot start a story with another player-owned character', async () => {
  let attemptedStoryWrite = false;
  const fakePrisma = {
    world: {
      findUnique: async () => worldRecord,
    },
    character: {
      findUnique: async () => ({
        ...characterRecord,
        userId: 'another-explorer',
      }),
    },
    story: {
      upsert: async () => {
        attemptedStoryWrite = true;
        return storyRecord;
      },
    },
  } as unknown as PrismaClient;

  await assert.rejects(
    new StoryService(fakePrisma).startStory(worldRecord.id, 'explorer-1', {
      characterId: characterRecord.id,
    }),
    (error: unknown) => error instanceof ApiError && error.statusCode === 403,
  );
  assert.equal(attemptedStoryWrite, false);
});

test('player character creation persists a lightweight owned character', async () => {
  let createArgs: Prisma.CharacterCreateArgs | undefined;
  const playerCharacter = {
    ...characterRecord,
    id: 'player-character-1',
    userId: 'explorer-1',
    name: 'Sable North',
    description: 'A patient keeper of impossible maps.',
  };
  const fakePrisma = {
    world: {
      findUnique: async () => ({ id: worldRecord.id }),
    },
    character: {
      create: async (args: Prisma.CharacterCreateArgs) => {
        createArgs = args;
        return playerCharacter;
      },
    },
  } as unknown as PrismaClient;

  const character = await new CharacterService(
    fakePrisma,
  ).createPlayerCharacter(worldRecord.id, 'explorer-1', {
    name: 'Sable North',
    description: 'A patient keeper of impossible maps.',
  });

  assert.equal(character.userId, 'explorer-1');
  assert.equal(createArgs?.data.worldId, worldRecord.id);
  assert.equal(createArgs?.data.userId, 'explorer-1');
  assert.deepEqual(createArgs?.data.meta, { descriptors: [] });
});

test('playable character listing excludes characters owned by other users', async () => {
  let queryArgs: Prisma.CharacterFindManyArgs | undefined;
  const fakePrisma = {
    character: {
      findMany: async (args: Prisma.CharacterFindManyArgs) => {
        queryArgs = args;
        return [characterRecord];
      },
    },
  } as unknown as PrismaClient;

  await new CharacterService(fakePrisma).listPlayableCharacters(
    worldRecord.id,
    'explorer-1',
  );

  assert.deepEqual(queryArgs?.where, {
    worldId: worldRecord.id,
    OR: [
      { userId: null },
      { userId: { isSet: false } },
      { userId: 'explorer-1' },
    ],
  });
});
