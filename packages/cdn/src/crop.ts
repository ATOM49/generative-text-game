import sharp from 'sharp';

export type NormalizedImageBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const assertNormalizedBounds = (bounds: NormalizedImageBounds): void => {
  const values = [bounds.x, bounds.y, bounds.width, bounds.height];
  if (!values.every(Number.isFinite)) {
    throw new Error('Crop bounds must contain only finite numbers');
  }
  if (bounds.x < 0 || bounds.y < 0 || bounds.width <= 0 || bounds.height <= 0) {
    throw new Error(
      'Crop bounds must have a non-negative origin and positive size',
    );
  }
  if (bounds.x + bounds.width > 1 || bounds.y + bounds.height > 1) {
    throw new Error('Crop bounds must fit within normalized image coordinates');
  }
};

export async function cropImageByNormalizedBounds(
  imageBuffer: Buffer,
  bounds: NormalizedImageBounds,
): Promise<Buffer> {
  assertNormalizedBounds(bounds);

  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error('Unable to read image dimensions');
  }

  const left = Math.min(
    metadata.width - 1,
    Math.floor(bounds.x * metadata.width),
  );
  const top = Math.min(
    metadata.height - 1,
    Math.floor(bounds.y * metadata.height),
  );
  const right = Math.max(
    left + 1,
    Math.min(
      metadata.width,
      Math.ceil((bounds.x + bounds.width) * metadata.width),
    ),
  );
  const bottom = Math.max(
    top + 1,
    Math.min(
      metadata.height,
      Math.ceil((bounds.y + bounds.height) * metadata.height),
    ),
  );
  const width = right - left;
  const height = bottom - top;

  return image.extract({ left, top, width, height }).png().toBuffer();
}
