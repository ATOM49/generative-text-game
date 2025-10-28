import fp from 'fastify-plugin';
import cors, { FastifyCorsOptions } from '@fastify/cors';

/**
 * This plugin enables CORS (Cross-Origin Resource Sharing) support.
 *
 * @see https://github.com/fastify/fastify-cors
 */
export default fp<FastifyCorsOptions>(async (fastify, opts) => {
  fastify.register(cors, opts);
});
