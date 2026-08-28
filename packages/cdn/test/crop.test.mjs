import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import test from 'node:test';
import sharp from 'sharp';
import { cropImageByNormalizedBounds } from '../dist/index.js';

const sourceImage = Buffer.from(`
  <svg width="4" height="2" xmlns="http://www.w3.org/2000/svg">
    <rect width="2" height="2" x="0" y="0" fill="#ff0000" />
    <rect width="2" height="2" x="2" y="0" fill="#0000ff" />
  </svg>
`);

test('cropImageByNormalizedBounds extracts the requested image region', async () => {
  const result = await cropImageByNormalizedBounds(sourceImage, {
    x: 0.5,
    y: 0,
    width: 0.5,
    height: 1,
  });

  const { data, info } = await sharp(result)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  assert.equal(info.width, 2);
  assert.equal(info.height, 2);
  assert.deepEqual([...data.subarray(0, 3)], [0, 0, 255]);
});

test('cropImageByNormalizedBounds rejects out-of-range bounds', async () => {
  await assert.rejects(
    cropImageByNormalizedBounds(sourceImage, {
      x: 0.75,
      y: 0,
      width: 0.5,
      height: 1,
    }),
    /fit within normalized image coordinates/,
  );
});
