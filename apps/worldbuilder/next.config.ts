import type { NextConfig } from 'next';

type RemotePattern = NonNullable<
  NonNullable<NextConfig['images']>['remotePatterns']
>[number];

// Allow next/image to optimize generated art from the configured CDN. Next
// reads this config at both `next build` and `next start`, so set
// MINIO_PUBLIC_HOST and MINIO_BUCKET in both environments.
const cdnImagePattern = (): RemotePattern => {
  const publicHost = new URL(
    process.env.MINIO_PUBLIC_HOST || 'http://localhost:9000',
  );
  const bucket = process.env.MINIO_BUCKET || 'images';
  const basePath = publicHost.pathname.replace(/\/+$/, '');

  return {
    protocol: publicHost.protocol === 'https:' ? 'https' : 'http',
    hostname: publicHost.hostname,
    port: publicHost.port,
    pathname: `${basePath}/${bucket}/**`,
  };
};

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [cdnImagePattern()],
  },
};

export default nextConfig;
