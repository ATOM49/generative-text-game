import {
  OpenAIStructuredOutputRunnable,
  type StructuredOutputModel,
} from '@talespin/ai';
import {
  assertAIModelConfigured,
  loadAIConfig,
  missingSegmindAdapterError,
} from './ai.js';

export const createStructuredOutputModel = <T>(): StructuredOutputModel<T> => {
  const config = loadAIConfig().text;
  assertAIModelConfigured('text', config);

  if (config.provider === 'segmind') {
    throw missingSegmindAdapterError('text', config);
  }

  return new OpenAIStructuredOutputRunnable<T>({
    apiKey: config.apiKey,
    model: config.model,
  });
};
