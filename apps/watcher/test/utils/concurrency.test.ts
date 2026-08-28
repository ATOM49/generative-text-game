import assert from 'node:assert/strict';
import test from 'node:test';
import { mapWithConcurrency } from '../../src/utils/concurrency.js';

test('limits concurrency while preserving input order', async () => {
  let active = 0;
  let maximumActive = 0;

  const results = await mapWithConcurrency([3, 1, 2, 0], 2, async (value) => {
    active += 1;
    maximumActive = Math.max(maximumActive, active);
    await new Promise((resolve) => setTimeout(resolve, value * 2));
    active -= 1;
    return value * 10;
  });

  assert.deepEqual(results, [30, 10, 20, 0]);
  assert.equal(maximumActive, 2);
});

test('rejects an invalid concurrency limit', async () => {
  await assert.rejects(() =>
    mapWithConcurrency([1], 0, async (value) => value),
  );
});
