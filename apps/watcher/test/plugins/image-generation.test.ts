import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createImageCacheFingerprint } from '../../src/utils/image-cache.js';

describe('image generation cache fingerprint', () => {
  const base = {
    provider: 'segmind',
    model: 'nano-banana-pro',
    purpose: 'map' as const,
    prompt: 'A fantasy map',
    size: '1024x1024' as const,
  };

  it('is stable for the same generation request', () => {
    assert.equal(
      createImageCacheFingerprint(base),
      createImageCacheFingerprint(base),
    );
  });

  it('changes when provider, model, prompt, or parameters change', () => {
    const fingerprint = createImageCacheFingerprint(base);

    assert.notEqual(
      fingerprint,
      createImageCacheFingerprint({ ...base, model: 'another-model' }),
    );
    assert.notEqual(
      fingerprint,
      createImageCacheFingerprint({ ...base, prompt: 'A sci-fi map' }),
    );
    assert.notEqual(
      fingerprint,
      createImageCacheFingerprint({ ...base, size: '1792x1024' }),
    );
  });
});
