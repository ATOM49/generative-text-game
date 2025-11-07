import fp from 'fastify-plugin';
import { Client as MinioClient } from 'minio';

export type CDNPluginOptions = {
  bucket?: string;
  publicHost?: string; // e.g. http://localhost:9000
};

declare module 'fastify' {
  interface FastifyInstance {
    cdn: {
      uploadBuffer: (args: {
        buffer: Buffer;
        keyPrefix?: string;
        contentType?: string;
      }) => Promise<{ key: string; url: string }>;
      getPublicURL: (key: string) => string;
      bucket: string;
    };
  }
}

export default fp<CDNPluginOptions>(async (fastify, opts) => {
  const client = new MinioClient({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: Number(process.env.MINIO_PORT || 9000),
    useSSL: (process.env.MINIO_USE_SSL || 'false').toLowerCase() === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  });

  const bucket = opts.bucket || process.env.MINIO_BUCKET || 'images';
  const publicHost =
    opts.publicHost || process.env.MINIO_PUBLIC_HOST || 'http://localhost:9000';

  const getPublicURL = (key: string) =>
    `${publicHost}/${bucket}/${encodeURI(key)}`;

  fastify.decorate('cdn', {
    bucket,
    getPublicURL,
    async uploadBuffer({
      buffer,
      keyPrefix = 'maps/',
      contentType = 'image/png',
    }) {
      const { randomUUID } = await import('crypto');
      const key = `${keyPrefix}${randomUUID()}.png`;
      await client.putObject(bucket, key, buffer, buffer.length, {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      });
      return { key, url: getPublicURL(key) };
    },
  });
});
