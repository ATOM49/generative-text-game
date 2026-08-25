import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assertAIModelConfigured, loadAIConfig } from '../../src/config/ai.js';

describe('AI provider configuration', () => {
  it('preserves the existing OpenAI defaults', () => {
    const config = loadAIConfig({ OPENAI_API_KEY: 'test-key' });

    assert.deepEqual(config.text, {
      provider: 'openai',
      apiKey: 'test-key',
      model: 'gpt-4o-mini',
    });
    assert.deepEqual(config.image.models, {
      map: 'dall-e-3',
      character: 'dall-e-3',
      faction: 'dall-e-3',
    });
    assert.equal(config.imageEdit.model, 'dall-e-2');
  });

  it('loads Segmind independently for every modality', () => {
    const config = loadAIConfig({
      SEGMIND_API_KEY: 'segmind-key',
      AI_TEXT_PROVIDER: 'segmind',
      SEGMIND_TEXT_MODEL: 'text-model',
      SEGMIND_TEXT_API_VERSION: 'v2',
      AI_IMAGE_PROVIDER: 'segmind',
    });

    assert.deepEqual(config.text, {
      provider: 'segmind',
      apiKey: 'segmind-key',
      model: 'text-model',
      apiVersion: 'v2',
    });
    assert.deepEqual(config.image, {
      provider: 'segmind',
      apiKey: 'segmind-key',
      models: {
        map: 'nano-banana-pro',
        character: 'seedream-4.5',
        faction: 'ideogram-4',
      },
    });
    assert.equal(config.imageEdit.provider, 'openai');
  });

  it('selects Segmind images when only its API key is added', () => {
    const config = loadAIConfig({ SEGMIND_API_KEY: 'segmind-key' });

    assert.equal(config.image.provider, 'segmind');
    assert.equal(config.text.provider, 'openai');
    assert.equal(config.imageEdit.provider, 'openai');
  });

  it('fails clearly when a selected Segmind model is incomplete', () => {
    const config = loadAIConfig({
      SEGMIND_API_KEY: 'segmind-key',
      AI_TEXT_PROVIDER: 'segmind',
    });

    assert.throws(
      () => assertAIModelConfigured('text', config.text),
      /model slug is not configured/,
    );
  });
});
