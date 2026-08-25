import { test } from 'node:test';
import * as assert from 'node:assert';
import { build } from '../helper.js';

test('unknown routes return not found', async (t) => {
  const app = await build(t);

  const res = await app.inject({
    url: '/example',
  });

  assert.equal(res.statusCode, 404);
});
