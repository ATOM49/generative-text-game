/**
 * Image Generation Plugin
 *
 * Provides AI-powered image generation and editing capabilities via OpenAI's DALL-E.
 *
 * Features:
 * - generateMapToCdn: Generate new images from text prompts (DALL-E 3)
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

declare module 'fastify' {
  interface FastifyInstance {
    imageGen: {
      generateMapToCdn: (args: {
        prompt: string;
        worldName: string;
        size?: '1024x1024' | '1792x1024' | '1024x1792';
      }) => Promise<{ url: string; key: string; revisedPrompt?: string }>;
      generatePortraitToCdn: (args: {
        prompt: string;
        characterName?: string;
        keyPrefix?: string;
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

    fastify.decorate('imageGen', {
      async generateMapToCdn({ prompt, worldName, size = defaultSize }) {
        // 1) Generate image using the runnable
        const result = await imageGenerateRunnable.invoke({
          prompt,
          size,
        });

        fastify.log.debug({
          msg: 'Received image from DALL-E',
          revisedPrompt: result.revisedPrompt,
        });

        const buffer = result.imageBuffer;

        fastify.log.debug({ msg: 'Image buffer ready', size: buffer.length });

        // 4) Upload via CDN client
        const slug = worldName
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');

        const { key, url } = await cdnClient.uploadBuffer({
          buffer,
          keyPrefix: `maps/${slug}/`,
          contentType: 'image/png',
        });

        fastify.log.info({ msg: 'Uploaded to CDN', key, url });
        return { key, url, revisedPrompt: result.revisedPrompt };
      },

      async generatePortraitToCdn({
        prompt,
        characterName,
        keyPrefix,
        size = defaultSize,
      }) {
        const result = await imageGenerateRunnable.invoke({
          prompt,
          size,
        });

        const buffer = result.imageBuffer;
        const slugSource = characterName?.length ? characterName : 'character';
        const slug = slugSource
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');

        const { key, url } = await cdnClient.uploadBuffer({
          buffer,
          keyPrefix: keyPrefix || `characters/${slug}/`,
          contentType: 'image/png',
        });

        fastify.log.info({ msg: 'Uploaded portrait to CDN', key, url });

        return { key, url, revisedPrompt: result.revisedPrompt };
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

        // 2) Upload edited image via CDN client
        const { key, url } = await cdnClient.uploadBuffer({
          buffer: result.editedImageBuffer,
          keyPrefix: keyPrefix || 'edits/',
          contentType: 'image/png',
        });

        fastify.log.info({ msg: 'Uploaded edited image to CDN', key, url });

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
