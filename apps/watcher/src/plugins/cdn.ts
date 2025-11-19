import fp from 'fastify-plugin';
import {
  createMinioClient,
  type MinioClientOptions,
  type MinioClientInstance,
} from '@talespin/cdn';

export type CDNPluginOptions = MinioClientOptions;

declare module 'fastify' {
  interface FastifyInstance {
    cdn: MinioClientInstance;
  }
}

export default fp<CDNPluginOptions>(
  async (fastify, opts) => {
    const client = createMinioClient(opts);
    fastify.decorate('cdn', client);
  },
  {
    name: 'cdn',
  },
);
