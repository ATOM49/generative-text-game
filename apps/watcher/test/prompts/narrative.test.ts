import assert from 'node:assert/strict';
import test from 'node:test';
import { narrativePrompt } from '../../src/prompts/narrative.js';

test('outline prompt fixes the arc at three chapters without choosing a finale cell', () => {
  const prompt = narrativePrompt({
    kind: 'OUTLINE',
    input: {
      storyId: 'story-1',
      world: { name: 'Morrowmere' },
      character: { name: 'Ilyra', traits: [] },
      regionHooks: [],
    },
  });
  assert.match(prompt, /exactly three sequential chapters/i);
  assert.match(prompt, /Do not choose a finale map cell/i);
});

test('transport prompts require every generated option to support the terrain', () => {
  const prompt = narrativePrompt({
    kind: 'TRANSPORT',
    input: {
      storyTitle: 'The Threefold Road',
      missionTitle: 'Across the Singing Sea',
      medium: 'WATER',
      terrainTags: ['storm-tossed'],
      situation: 'The route enters open water.',
    },
  });
  assert.match(prompt, /exact required traversal medium/i);
  assert.match(prompt, /Ownership is not required/i);
});

test('action resolution asks for clarification without state changes for unsupported free text', () => {
  const prompt = narrativePrompt({
    kind: 'ACTION_RESOLUTION',
    input: {
      situation: 'A guide asks which trail to follow.',
      action: { type: 'FREE_TEXT', text: 'Launch a spaceship.' },
      objectiveIds: ['speak-to-guide'],
    },
  });
  assert.match(prompt, /accepted=false/i);
  assert.match(prompt, /no state changes/i);
});
