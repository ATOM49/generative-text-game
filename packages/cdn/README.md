# @talespin/cdn

CDN utilities package for Talespin, providing MinIO storage abstraction and Sharp-based image processing.

## Features

- **MinIO Client**: Upload buffers to MinIO with automatic key generation and public URL access
- **Mask Generation**: Build inpainting masks from polygons using Sharp for AI image editing workflows

## Installation

```bash
pnpm add @talespin/cdn
```

## Environment Variables

```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=images
MINIO_PUBLIC_HOST=http://localhost:9000
```

## Usage

### MinIO Client

```typescript
import { createMinioClient } from '@talespin/cdn';

const client = createMinioClient({
  bucket: 'images',
  publicHost: 'http://localhost:9000',
});

// Upload a buffer
const { key, url } = await client.uploadBuffer({
  buffer: imageBuffer,
  keyPrefix: 'maps/',
  contentType: 'image/png',
});

// Get public URL
const publicUrl = client.getPublicURL('maps/some-key.png');
```

### Mask Generation

```typescript
import { buildInpaintMaskPNG } from '@talespin/cdn';

const maskBuffer = await buildInpaintMaskPNG({
  imageBuffer: originalImage,
  polygon: {
    points: [
      { x: 0.1, y: 0.1 },
      { x: 0.9, y: 0.1 },
      { x: 0.9, y: 0.9 },
      { x: 0.1, y: 0.9 },
    ],
  },
  featherPx: 8, // optional, default: 8
  dilatePx: 2, // optional, default: 2
});
```

## API Reference

### `createMinioClient(options)`

Creates a MinIO client instance with upload and URL generation capabilities.

**Options:**

- `bucket?: string` - MinIO bucket name (default: from env `MINIO_BUCKET`)
- `publicHost?: string` - Public host URL (default: from env `MINIO_PUBLIC_HOST`)

**Returns:**

```typescript
{
  uploadBuffer: (args: {
    buffer: Buffer;
    keyPrefix?: string;
    contentType?: string;
  }) => Promise<{ key: string; url: string }>;
  getPublicURL: (key: string) => string;
  bucket: string;
}
```

### `buildInpaintMaskPNG(args)`

Generates an inpainting mask PNG from a polygon region.

**Arguments:**

- `imageBuffer: Buffer` - Original image buffer
- `polygon: { points: { x: number; y: number }[] }` - Polygon with relative coordinates (0-1)
- `featherPx?: number` - Feather/blur amount in pixels (default: 8)
- `dilatePx?: number` - Dilation amount in pixels (default: 2)

**Returns:** `Promise<Buffer>` - PNG mask buffer with transparent region for editing
