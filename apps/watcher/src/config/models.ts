import {
  OpenAIMultimodalStructuredOutputRunnable,
  OpenAIStructuredOutputRunnable,
  type MultimodalStructuredOutputModel,
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

export const createMultimodalStructuredOutputModel = <
  T,
>(): MultimodalStructuredOutputModel<T> => {
  const config = loadAIConfig().text;
  assertAIModelConfigured('text', config);

  if (config.provider === 'segmind') {
    throw missingSegmindAdapterError('text', config);
  }

  return new OpenAIMultimodalStructuredOutputRunnable<T>({
    apiKey: config.apiKey,
    model: config.model,
  });
};
