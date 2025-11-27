import { FastifyPluginAsync } from 'fastify';
import { factionPromptTemplate } from '../../prompts/generate-faction';

interface FactionImageRequestBody {
  name: string;
  category: string;
  summary?: string;
  description?: string;
  tone?: string;
  keywords?: string[];
  promptHint?: string;
}

interface FactionImageResponse {
  imageUrl: string;
  revisedPrompt?: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

const formatList = (items?: string[]) => {
  if (!items || items.length === 0) return 'None provided';
  return items.join(', ');
};

const generateFaction: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: FactionImageRequestBody;
    Reply: FactionImageResponse | ErrorResponse;
  }>(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            category: { type: 'string' },
            summary: { type: 'string' },
            description: { type: 'string' },
            tone: { type: 'string' },
            keywords: {
              type: 'array',
              items: { type: 'string' },
            },
            promptHint: { type: 'string' },
          },
          required: ['name', 'category'],
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
        if (!process.env.OPENAI_API_KEY) {
          fastify.log.error('OPENAI_API_KEY is not configured');
          return reply.status(500).send({
            error: 'Service configuration error',
            details: 'Image generation service is not properly configured',
          });
        }

        const { name, category } = req.body;
        if (!name?.trim()) {
          return reply.status(400).send({
            error: 'Missing required fields',
            details: 'name is required to build a faction prompt',
          });
        }

        const keywordsText = formatList(req.body.keywords);

        const prompt = await factionPromptTemplate.format({
          name,
          category,
          summary: req.body.summary ?? '–',
          description: req.body.description ?? '–',
          tone: req.body.tone ?? '–',
          keywords: keywordsText,
          promptHint:
            req.body.promptHint ?? 'Use painterly realism. No text overlay.',
        });

        let imageUrl: string;
        let revisedPrompt: string | undefined;

        try {
          // Reuse generatePortraitToCdn but with a faction-specific key prefix
          // We use the name as the slug source
          const slug = name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

          const result = await fastify.imageGen.generatePortraitToCdn({
            prompt,
            characterName: name, // Used for slug generation if keyPrefix not provided, but we provide it
            keyPrefix: `factions/${slug}/`,
          });
          imageUrl = result.url;
          revisedPrompt = result.revisedPrompt;
        } catch (openaiError) {
          fastify.log.error({
            msg: 'OpenAI API error while generating faction image',
            error: openaiError,
          });

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

        if (!imageUrl) {
          fastify.log.error({
            msg: 'Invalid image URL received from faction generation',
            imageUrl,
          });
          return reply.status(500).send({
            error: 'Invalid response from image generation service',
            details: 'No valid image URL was generated',
          });
        }

        const duration = Date.now() - startTime;
        fastify.log.info({
          msg: 'Faction image generated',
          duration,
          imageUrl,
        });

        return reply.send({ imageUrl, revisedPrompt });
      } catch (error) {
        const duration = Date.now() - startTime;
        fastify.log.error({
          msg: 'Failed to generate faction image',
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });

        return reply.status(500).send({
          error: 'Failed to generate faction image',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  );
};

export default generateFaction;
