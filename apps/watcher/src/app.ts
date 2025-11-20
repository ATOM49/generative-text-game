import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload';
import { FastifyPluginAsync, FastifyServerOptions } from 'fastify';
import type { CDNPluginOptions } from './plugins/cdn.js';
import type { ImageGenOptions } from './plugins/image-generation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface AppOptions
  extends FastifyServerOptions,
    Partial<AutoloadPluginOptions> {
  cdn?: CDNPluginOptions;
  imageGen?: ImageGenOptions;
}

// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {
  cdn: {
    bucket: process.env.MINIO_BUCKET, // optional; defaults to "images"
    publicHost: process.env.MINIO_PUBLIC_HOST, // optional; defaults to http://localhost:9000
  },
  imageGen: {
    defaultSize: '1024x1024',
  },
};

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts,
): Promise<void> => {
  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts,
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: opts,
  });
};

export default app;
export { app, options };
