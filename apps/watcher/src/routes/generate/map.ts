import { FastifyPluginAsync } from 'fastify';
import { mapPromptTemplate } from '../../prompts/generate-map.js';
import { type World } from '@talespin/schema';

interface GenerateMapResponse {
  imageUrl: string;
  revisedPrompt?: string;
}
interface ErrorResponse {
  error: string;
  details?: string;
}

const generateMap: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: World;
    Reply: GenerateMapResponse | ErrorResponse;
  }>(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            theme: { type: 'string' },
            contextWindowLimit: { type: 'number' },
          },
          required: ['name', 'theme'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              imageUrl: { type: 'string' },
              revisedPrompt: { type: 'string' },
            },
            required: ['imageUrl'],
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              details: { type: 'string' },
            },
            required: ['error'],
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              details: { type: 'string' },
            },
            required: ['error'],
          },
        },
      },
    },
    async (req, reply) => {
      const startTime = Date.now();

      try {
        const world = req.body;

        // Validate required fields
        if (!world.name || !world.theme) {
          return reply.status(400).send({
            error: 'Missing required fields',
            details: 'Both name and theme are required',
          });
        }

        // Validate OpenAI API key
        if (!process.env.OPENAI_API_KEY) {
          fastify.log.error('OPENAI_API_KEY is not configured');
          return reply.status(500).send({
            error: 'Service configuration error',
            details: 'Image generation service is not properly configured',
          });
        }

        fastify.log.info({
          msg: 'Starting map generation',
          world: { name: world.name, theme: world.theme },
        });

        const prompt = await mapPromptTemplate.format({
          name: world.name,
          theme: world.theme,
          description: world.description ?? '–',
          settings: world.settings ?? '–',
        });

        fastify.log.debug({
          msg: 'Generated prompt for DALL-E',
          prompt: prompt.substring(0, 200), // Log first 200 chars
        });

        // Use shared image generation plugin (uploads to CDN/MinIO)
        let imageUrl: string;
        try {
          const slug = world.name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

          const res = await fastify.imageGen.generateImageToCdn({
            prompt,
            keyPrefix: `maps/${slug}/`,
            size: '1024x1024',
          });
          imageUrl = res.url;
        } catch (openaiError) {
          fastify.log.error({
            msg: 'OpenAI API error',
            error: openaiError,
          });

          // Handle specific upstream errors (OpenAI / CDN)
          if (openaiError instanceof Error) {
            if (openaiError.message.includes('rate limit')) {
              return reply.status(429).send({
                error: 'Rate limit exceeded',
                details: 'Too many requests to image generation service',
              });
            }
            if (openaiError.message.includes('timeout')) {
              return reply.status(504).send({
                error: 'Request timeout',
                details: 'Image generation took too long',
              });
            }
            if (
              openaiError.message.includes('content policy') ||
              openaiError.message.includes('safety')
            ) {
              return reply.status(400).send({
                error: 'Content policy violation',
                details: 'The provided content was rejected by safety filters',
              });
            }
          }

          throw openaiError;
        }

        // Validate the generated URL
        if (!imageUrl || typeof imageUrl !== 'string') {
          fastify.log.error({
            msg: 'Invalid image URL received',
            imageUrl,
          });
          return reply.status(500).send({
            error: 'Invalid response from image generation service',
            details: 'No valid image URL was generated',
          });
        }

        const duration = Date.now() - startTime;
        fastify.log.info({
          msg: 'Map generation completed',
          duration,
          imageUrl,
        });

        reply.send({
          imageUrl,
          revisedPrompt: undefined,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        fastify.log.error({
          msg: 'Failed to generate map image',
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });

        return reply.status(500).send({
          error: 'Failed to generate map image',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  );
};

export default generateMap;
