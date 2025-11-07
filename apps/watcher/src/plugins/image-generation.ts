import fp from 'fastify-plugin';
import { DallEAPIWrapper } from '@langchain/openai';

export type ImageGenOptions = {
  defaultSize?: '1024x1024' | '512x512' | '256x256';
};

declare module 'fastify' {
  interface FastifyInstance {
    imageGen: {
      generateMapToCdn: (args: {
        prompt: string;
        worldName: string;
        size?: '1024x1024' | '512x512' | '256x256';
      }) => Promise<{ url: string; key: string }>;
    };
  }
}

export default fp<ImageGenOptions>(async (fastify, opts) => {
  if (!process.env.OPENAI_API_KEY) {
    fastify.log.error('OPENAI_API_KEY missing');
    throw new Error('OPENAI_API_KEY not configured');
  }

  const defaultSize = opts.defaultSize || '1024x1024';

  fastify.decorate('imageGen', {
    async generateMapToCdn({ prompt, worldName, size = defaultSize }) {
      // 1) Initialize DALL-E wrapper
      const tool = new DallEAPIWrapper({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: 'dall-e-3',
        size,
        n: 1,
        responseFormat: 'b64_json',
      });

      // 2) Generate image and get base64 data
      const b64Json = await tool.invoke(prompt);

      console.log({ b64Json });

      // 3) Convert base64 to buffer
      const buffer = Buffer.from(b64Json, 'base64');

      console.log({ buffer });

      // 4) Upload via CDN plugin
      const slug = worldName
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      console.log({ slug });

      const { key, url } = await fastify.cdn.uploadBuffer({
        buffer,
        keyPrefix: `maps/${slug}/`,
        contentType: 'image/png',
      });

      console.log({ key, url });
      return { key, url };
    },
  });
});
