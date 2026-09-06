import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyStoryStateChanges,
  evaluateObjectives,
  requiredObjectivesComplete,
} from '../dist/index.js';

test('accepted story changes are idempotent', () => {
  const state = {
    knownFacts: [],
    consequences: [],
    unresolvedThreads: [],
    inventory: [],
    usedItemKeys: [],
    relationships: [],
    visitedCellIds: [],
    travelHistory: [],
  };
  const changes = [
    { type: 'DISCOVER_FACT', key: 'old-road', summary: 'The road remembers.' },
    { type: 'ADD_ITEM', key: 'amber-key', name: 'Amber Key' },
  ];
  const once = applyStoryStateChanges(state, changes);
  const twice = applyStoryStateChanges(once, changes);
  assert.deepEqual(twice.knownFacts, ['old-road']);
  assert.deepEqual(
    twice.inventory.map((item) => item.key),
    ['amber-key'],
  );
});

test('item use and relationships are constrained by authoritative story state', () => {
  const state = {
    knownFacts: [],
    consequences: [],
    unresolvedThreads: [],
    inventory: [{ key: 'amber-key', name: 'Amber Key' }],
    usedItemKeys: [],
    relationships: [],
    visitedCellIds: [],
    travelHistory: [],
  };
  const next = applyStoryStateChanges(
    state,
    [
      { type: 'USE_ITEM', key: 'missing-key' },
      { type: 'USE_ITEM', key: 'amber-key' },
      {
        type: 'UPDATE_RELATIONSHIP',
        characterRef: 'invented-character',
        delta: 100,
      },
      {
        type: 'UPDATE_RELATIONSHIP',
        characterRef: 'guide-1',
        delta: 100,
        summary: 'The guide trusts the explorer.',
      },
      {
        type: 'UPDATE_RELATIONSHIP',
        characterRef: 'guide-1',
        delta: 20,
      },
    ],
    { allowedCharacterRefs: ['guide-1'] },
  );
  assert.deepEqual(next.usedItemKeys, ['amber-key']);
  assert.equal(next.relationships.length, 1);
  assert.equal(next.relationships[0]?.disposition, 100);
});

test('objective completion comes from authoritative state', () => {
  const objectives = evaluateObjectives({
    objectives: [
      {
        id: 'reach-end',
        type: 'REACH_CELL',
        label: 'Reach the end',
        required: true,
        complete: false,
        cellId: 'end',
      },
      {
        id: 'learn-clue',
        type: 'LEARN_FACT',
        label: 'Learn the clue',
        required: true,
        complete: false,
        factKey: 'clue',
      },
    ],
    currentCellId: 'end',
    knownFacts: ['clue'],
    inventoryItemKeys: [],
  });
  assert.equal(requiredObjectivesComplete(objectives), true);
});
