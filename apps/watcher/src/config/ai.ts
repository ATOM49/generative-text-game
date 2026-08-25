import type { AIProvider } from '@talespin/ai';

export type AIModality = 'text' | 'image' | 'imageEdit';
export type ImagePurpose = 'map' | 'character' | 'faction';
export type SegmindApiVersion = 'v1' | 'v2';

export type AIModelConfig = {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  apiVersion?: SegmindApiVersion;
};

export type AIImageConfig = {
  provider: AIProvider;
  apiKey?: string;
  models: Record<ImagePurpose, string>;
};

export type AIConfig = {
  text: AIModelConfig;
  image: AIImageConfig;
  imageEdit: AIModelConfig;
};

const readProvider = (
  value: string | undefined,
  environmentName: string,
): AIProvider => {
  const provider = value ?? 'openai';
  if (provider !== 'openai' && provider !== 'segmind') {
    throw new Error(`${environmentName} must be either "openai" or "segmind"`);
  }
  return provider;
};

const readSegmindVersion = (
  value: string | undefined,
  environmentName: string,
): SegmindApiVersion | undefined => {
  if (value === undefined) return undefined;
  if (value !== 'v1' && value !== 'v2') {
    throw new Error(`${environmentName} must be either "v1" or "v2"`);
  }
  return value;
};

const createModelConfig = ({
  provider,
  openAIApiKey,
  openAIModel,
  segmindApiKey,
  segmindModel,
  segmindApiVersion,
}: {
  provider: AIProvider;
  openAIApiKey?: string;
  openAIModel: string;
  segmindApiKey?: string;
  segmindModel?: string;
  segmindApiVersion?: SegmindApiVersion;
}): AIModelConfig =>
  provider === 'segmind'
    ? {
        provider,
        apiKey: segmindApiKey,
        model: segmindModel,
        apiVersion: segmindApiVersion,
      }
    : { provider, apiKey: openAIApiKey, model: openAIModel };

export const loadAIConfig = (
  env: NodeJS.ProcessEnv = process.env,
): AIConfig => {
  const textProvider = readProvider(env.AI_TEXT_PROVIDER, 'AI_TEXT_PROVIDER');
  const imageProvider = readProvider(
    env.AI_IMAGE_PROVIDER ?? (env.SEGMIND_API_KEY ? 'segmind' : undefined),
    'AI_IMAGE_PROVIDER',
  );
  const imageEditProvider = readProvider(
    env.AI_IMAGE_EDIT_PROVIDER,
    'AI_IMAGE_EDIT_PROVIDER',
  );

  return {
    text: createModelConfig({
      provider: textProvider,
      openAIApiKey: env.OPENAI_API_KEY,
      openAIModel: env.OPENAI_TEXT_MODEL ?? 'gpt-4o-mini',
      segmindApiKey: env.SEGMIND_API_KEY,
      segmindModel: env.SEGMIND_TEXT_MODEL,
      segmindApiVersion: readSegmindVersion(
        env.SEGMIND_TEXT_API_VERSION,
        'SEGMIND_TEXT_API_VERSION',
      ),
    }),
    image:
      imageProvider === 'segmind'
        ? {
            provider: imageProvider,
            apiKey: env.SEGMIND_API_KEY,
            models: {
              map: env.SEGMIND_MAP_MODEL ?? 'nano-banana-pro',
              character: env.SEGMIND_CHARACTER_MODEL ?? 'seedream-4.5',
              faction: env.SEGMIND_FACTION_MODEL ?? 'ideogram-4',
            },
          }
        : {
            provider: imageProvider,
            apiKey: env.OPENAI_API_KEY,
            models: {
              map: env.OPENAI_IMAGE_MODEL ?? 'dall-e-3',
              character: env.OPENAI_IMAGE_MODEL ?? 'dall-e-3',
              faction: env.OPENAI_IMAGE_MODEL ?? 'dall-e-3',
            },
          },
    imageEdit: createModelConfig({
      provider: imageEditProvider,
      openAIApiKey: env.OPENAI_API_KEY,
      openAIModel: env.OPENAI_IMAGE_EDIT_MODEL ?? 'dall-e-2',
      segmindApiKey: env.SEGMIND_API_KEY,
      segmindModel: env.SEGMIND_IMAGE_EDIT_MODEL,
      segmindApiVersion: readSegmindVersion(
        env.SEGMIND_IMAGE_EDIT_API_VERSION,
        'SEGMIND_IMAGE_EDIT_API_VERSION',
      ),
    }),
  };
};

export function assertAIImageConfigured(
  config: AIImageConfig,
): asserts config is AIImageConfig & { apiKey: string } {
  if (!config.apiKey) {
    const keyName =
      config.provider === 'segmind' ? 'SEGMIND_API_KEY' : 'OPENAI_API_KEY';
    throw new Error(`${keyName} is not configured for image generation`);
  }
}

export function assertAIModelConfigured(
  modality: AIModality,
  config: AIModelConfig,
): asserts config is AIModelConfig & { apiKey: string; model: string } {
  if (!config.apiKey) {
    const keyName =
      config.provider === 'segmind' ? 'SEGMIND_API_KEY' : 'OPENAI_API_KEY';
    throw new Error(`${keyName} is not configured for ${modality}`);
  }
  if (!config.model) {
    throw new Error(`Segmind ${modality} model slug is not configured`);
  }
  if (config.provider === 'segmind' && !config.apiVersion) {
    throw new Error(`Segmind ${modality} API version is not configured`);
  }
}

export const missingSegmindAdapterError = (
  modality: AIModality,
  config: AIModelConfig & { model: string },
): Error =>
  new Error(
    `Segmind ${modality} adapter for model "${config.model}" is not installed`,
  );
