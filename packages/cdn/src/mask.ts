import sharp from 'sharp';

export type BuildInpaintMaskArgs = {
  imageBuffer: Buffer;
  polygon: { points: { x: number; y: number }[] };
  featherPx?: number;
  dilatePx?: number;
};

/**
 * Builds an inpainting mask PNG from a polygon region on an image.
 *
 * The resulting mask has:
 * - White (opaque) areas: preserved/protected regions
 * - Transparent areas: regions to be edited/inpainted
 *
 * @param args - Configuration for mask generation
 * @param args.imageBuffer - Original image buffer to base dimensions on
 * @param args.polygon - Polygon with relative coordinates (0-1) defining the edit region
 * @param args.featherPx - Feather/blur amount in pixels (default: 8)
 * @param args.dilatePx - Dilation amount in pixels to grow the mask (default: 2)
 * @returns PNG buffer with transparency mask
 *
 * @example
 * ```typescript
 * const maskBuffer = await buildInpaintMaskPNG({
 *   imageBuffer: originalImage,
 *   polygon: {
 *     points: [
 *       { x: 0.1, y: 0.1 },
 *       { x: 0.9, y: 0.1 },
 *       { x: 0.9, y: 0.9 },
 *       { x: 0.1, y: 0.9 },
 *     ],
 *   },
 *   featherPx: 8,
 *   dilatePx: 2,
 * });
 * ```
 */
export async function buildInpaintMaskPNG(
  args: BuildInpaintMaskArgs,
): Promise<Buffer> {
  const { imageBuffer, polygon, featherPx = 8, dilatePx = 2 } = args;

  const img = sharp(imageBuffer);
  const { width, height } = await img.metadata();
  if (!width || !height) throw new Error('Unable to read image dimensions');

  // Convert relative points to absolute SVG path
  const path =
    polygon.points
      .map((p, i) => {
        const X = Math.round(p.x * width);
        const Y = Math.round(p.y * height);
        return `${i === 0 ? 'M' : 'L'} ${X} ${Y}`;
      })
      .join(' ') + ' Z';

  // Start with fully opaque white (kept area)
  const base = Buffer.from(
    `<svg width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="white"/>
    </svg>`,
  );

  // Cut a transparent hole where we want to edit (polygon)
  const hole = Buffer.from(
    `<svg width="${width}" height="${height}">
      <path d="${path}" fill="black"/>
    </svg>`,
  );

  // Build alpha: white=opaque, black=edit. We want transparent inside polygon ⇒ invert later.
  const matte = await sharp(base)
    .composite([{ input: hole, blend: 'dest-out' }]) // cuts a hole
    .png()
    .toBuffer();

  // Optional dilation to grow the hole a bit
  const dilated =
    dilatePx > 0
      ? await sharp(matte)
          .blur(0.3)
          .threshold(254)
          .convolve({
            // crude dilation via a simple kernel; for more control, consider morphology lib
            width: 3,
            height: 3,
            kernel: [1, 1, 1, 1, 1, 1, 1, 1, 1],
          })
          .png()
          .toBuffer()
      : matte;

  // Feather edges via blur (convert to RGBA with alpha = matte)
  const feathered =
    featherPx > 0
      ? await sharp({
          create: {
            width,
            height,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 1 },
          },
        })
          .composite([{ input: dilated, blend: 'dest-in' }]) // use dilated as alpha
          .blur(featherPx)
          .png()
          .toBuffer()
      : dilated;

  // Ensure final mask is white background with an alpha hole (transparent where to edit)
  // If feather result has color, normalize to white with alpha from it:
  const finalMask = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: feathered, blend: 'dest-in' }])
    .png()
    .toBuffer();

  return finalMask;
}
