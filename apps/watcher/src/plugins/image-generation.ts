/**
 * Image Generation Plugin
 *
 * Provides AI-powered image generation and editing capabilities via OpenAI's DALL-E.
 *
 * Features:
 * - generateImageToCdn: Generate new images from text prompts (DALL-E 3) with intelligent caching
 * - editImageToCdn: Edit existing images using inpainting masks (DALL-E 2)
 *
 * Dependencies:
 * - @talespin/ai: OpenAIImageGenerateRunnable and OpenAIImageEditRunnable
 * - @talespin/cdn: MinIO client for CDN uploads
 * - cdn plugin must be registered before this plugin
 *
 * @module image-generation
 */
import { File as NodeFile } from 'node:buffer';
import fp from 'fastify-plugin';
import type { MinioClientInstance } from '@talespin/cdn';

export type ImageGenOptions = {
  defaultSize?: '1024x1024' | '1792x1024' | '1024x1792';
};

// const slugify = (value: string | undefined, fallback: string) => {
//   const base = value && value.trim().length > 0 ? value : fallback;

//   return base
//     .toLowerCase()
//     .replace(/\s+/g, '-')
//     .replace(/[^a-z0-9-]/g, '');
// };

const ensureTrailingSlash = (prefix: string): string =>
  prefix.endsWith('/') ? prefix : `${prefix}/`;

declare module 'fastify' {
  interface FastifyInstance {
    imageGen: {
      /**
       * Generate an image from a text prompt and upload to CDN.
       * Automatically caches images by keyPrefix to avoid redundant OpenAI calls.
       *
       * @param prompt - The text prompt for image generation
       * @param keyPrefix - CDN storage prefix (e.g., 'maps/world-name/' or 'characters/hero/')
       * @param size - Image dimensions
       */
      generateImageToCdn: (args: {
        prompt: string;
        keyPrefix: string;
        size?: '1024x1024' | '1792x1024' | '1024x1792';
      }) => Promise<{ url: string; key: string; revisedPrompt?: string }>;
      editImageToCdn: (args: {
        prompt: string;
        image: Buffer;
        mask: Buffer;
        keyPrefix?: string;
        size?: '256x256' | '512x512' | '1024x1024';
      }) => Promise<{
        url: string;
        key: string;
        meta: {
          provider: string;
          model: string;
          size: string;
          requestId?: string;
        };
      }>;
    };
  }
}

type AIModule = typeof import('@talespin/ai');

let aiModulePromise: Promise<AIModule> | undefined;

const loadAiModule = () => {
  aiModulePromise ??= import('@talespin/ai');
  return aiModulePromise;
};

// Ensure File global exists for OpenAI SDKs that expect browser File objects
if (typeof globalThis.File === 'undefined') {
  (globalThis as typeof globalThis & { File: typeof NodeFile }).File = NodeFile;
}

export default fp<ImageGenOptions>(
  async (fastify, opts) => {
    if (!process.env.OPENAI_API_KEY) {
      fastify.log.error('OPENAI_API_KEY missing');
      throw new Error('OPENAI_API_KEY not configured');
    }

    const defaultSize = opts.defaultSize || '1024x1024';

    // Wait for CDN plugin to be registered
    if (!fastify.cdn) {
      throw new Error('CDN plugin must be registered before image-generation');
    }

    const cdnClient: MinioClientInstance = fastify.cdn;

    const { OpenAIImageEditRunnable, OpenAIImageGenerateRunnable } =
      await loadAiModule();

    // Initialize the image generate runnable
    const imageGenerateRunnable = new OpenAIImageGenerateRunnable({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'dall-e-3',
    });

    // Initialize the image edit runnable
    const imageEditRunnable = new OpenAIImageEditRunnable({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'dall-e-2',
    });

    type GenerateBufferArgs = {
      prompt: string;
      size: '1024x1024' | '1792x1024' | '1024x1792';
    };

    const generateImageBuffer = async ({
      prompt,
      size,
    }: GenerateBufferArgs): Promise<{
      buffer: Buffer;
      revisedPrompt?: string;
    }> => {
      const result = await imageGenerateRunnable.invoke({
        prompt,
        size,
      });

      fastify.log.debug({
        msg: 'Received image from DALL-E',
        revisedPrompt: result.revisedPrompt,
      });

      fastify.log.debug({
        msg: 'Image buffer ready',
        size: result.imageBuffer.length,
      });

      return {
        buffer: result.imageBuffer,
        revisedPrompt: result.revisedPrompt,
      };
    };

    const uploadBufferToCdn = async ({
      buffer,
      keyPrefix,
    }: {
      buffer: Buffer;
      keyPrefix: string;
    }) => {
      const uploadResult = await cdnClient.uploadBuffer({
        buffer,
        keyPrefix,
        contentType: 'image/png',
      });

      fastify.log.info({
        msg: 'Uploaded image to CDN',
        key: uploadResult.key,
        keyPrefix,
      });

      return uploadResult;
    };

    const maybeReuseOrUpload = async ({
      keyPrefix,
      generateBuffer,
    }: {
      keyPrefix: string;
      generateBuffer: () => Promise<{
        buffer: Buffer;
        revisedPrompt?: string;
      }>;
    }) => {
      const cached = await cdnClient.findObjectByPrefix({
        keyPrefix,
        select: 'latest',
      });

      if (cached) {
        fastify.log.info({
          msg: 'Reusing cached image from CDN',
          key: cached.key,
          keyPrefix,
        });

        return { ...cached, revisedPrompt: undefined };
      }

      const { buffer, revisedPrompt } = await generateBuffer();
      const uploadResult = await uploadBufferToCdn({ buffer, keyPrefix });

      return { ...uploadResult, revisedPrompt };
    };

    fastify.decorate('imageGen', {
      async generateImageToCdn({ prompt, keyPrefix, size = defaultSize }) {
        const resolvedPrefix = ensureTrailingSlash(keyPrefix);

        return maybeReuseOrUpload({
          keyPrefix: resolvedPrefix,
          generateBuffer: () => generateImageBuffer({ prompt, size }),
        });
      },

      async editImageToCdn({
        prompt,
        image,
        mask,
        keyPrefix,
        size = '1024x1024',
      }) {
        fastify.log.debug({ msg: 'Starting image edit operation' });

        // 1) Invoke the image edit runnable
        const result = await imageEditRunnable.invoke({
          prompt,
          image,
          mask,
          size,
        });

        fastify.log.debug({
          msg: 'Received edited image',
          size: result.editedImageBuffer.length,
        });

        const resolvedPrefix = ensureTrailingSlash(keyPrefix || 'edits/');
        const { key, url } = await uploadBufferToCdn({
          buffer: result.editedImageBuffer,
          keyPrefix: resolvedPrefix,
        });

        return {
          key,
          url,
          meta: result.providerMeta,
        };
      },
    });
  },
  {
    name: 'image-generation',
    dependencies: ['cdn'],
  },
);
