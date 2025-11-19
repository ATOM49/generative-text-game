import { Client as MinioClient } from 'minio';
import { randomUUID } from 'crypto';

export type MinioClientOptions = {
  bucket?: string;
  publicHost?: string;
};

export type UploadBufferArgs = {
  buffer: Buffer;
  keyPrefix?: string;
  contentType?: string;
};

export type MinioClientInstance = {
  uploadBuffer: (
    args: UploadBufferArgs,
  ) => Promise<{ key: string; url: string }>;
  getPublicURL: (key: string) => string;
  bucket: string;
};

/**
 * Creates a MinIO client instance for CDN operations
 *
 * @param options - Configuration options
 * @returns MinIO client instance with upload and URL generation methods
 *
 * @example
 * ```typescript
 * const client = createMinioClient({
 *   bucket: 'images',
 *   publicHost: 'http://localhost:9000'
 * });
 *
 * const { url } = await client.uploadBuffer({
 *   buffer: imageBuffer,
 *   keyPrefix: 'maps/'
 * });
 * ```
 */
export function createMinioClient(
  options: MinioClientOptions = {},
): MinioClientInstance {
  const client = new MinioClient({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: Number(process.env.MINIO_PORT || 9000),
    useSSL: (process.env.MINIO_USE_SSL || 'false').toLowerCase() === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
  });

  const bucket = options.bucket || process.env.MINIO_BUCKET || 'images';
  const publicHost =
    options.publicHost ||
    process.env.MINIO_PUBLIC_HOST ||
    'http://localhost:9000';

  const getPublicURL = (key: string): string => {
    return `${publicHost}/${bucket}/${encodeURI(key)}`;
  };

  const uploadBuffer = async ({
    buffer,
    keyPrefix = 'maps/',
    contentType = 'image/png',
  }: UploadBufferArgs): Promise<{ key: string; url: string }> => {
    const key = `${keyPrefix}${randomUUID()}.png`;

    await client.putObject(bucket, key, buffer, buffer.length, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    });

    return { key, url: getPublicURL(key) };
  };

  return {
    uploadBuffer,
    getPublicURL,
    bucket,
  };
}
