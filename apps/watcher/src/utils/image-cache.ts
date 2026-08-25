import { createHash } from 'node:crypto';
import type { ImageGenerationSize } from '@talespin/ai';
import type { ImagePurpose } from '../config/ai.js';

export const createImageCacheFingerprint = (input: {
  provider: string;
  model: string;
  purpose: ImagePurpose;
  prompt: string;
  size: ImageGenerationSize;
}): string =>
  createHash('sha256').update(JSON.stringify(input)).digest('hex').slice(0, 20);
