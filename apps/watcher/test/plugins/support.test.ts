import { test } from 'node:test';
import * as assert from 'node:assert';

import Fastify from 'fastify';
import Sensible from '../../src/plugins/sensible.js';

test('sensible works standalone', async () => {
  const fastify = Fastify();
  void fastify.register(Sensible);
  await fastify.ready();

  assert.equal(fastify.httpErrors.notFound().statusCode, 404);
});
