import { FastifyPluginAsync } from 'fastify';
import { characterPromptTemplate } from '../../prompts/generate-character.js';

type CharacterGroup = {
  name: string;
  summary?: string;
};

interface CharacterImageRequestBody {
  name: string;
  description?: string;
  biography?: string;
  factions?: CharacterGroup[];
  cultures?: CharacterGroup[];
  species?: CharacterGroup[];
  archetypes?: CharacterGroup[];
  traits?: string[];
  promptHint?: string;
}

interface CharacterImageResponse {
  imageUrl: string;
  revisedPrompt?: string;
}

interface ErrorResponse {
  error: string;
  details?: string;
}

const formatGroups = (groups?: CharacterGroup[]) => {
  if (!groups || groups.length === 0) return 'None provided';
  return groups
    .map((group) =>
      group.summary ? `${group.name}: ${group.summary}` : `${group.name}`,
    )
    .join('; ');
};

const formatList = (items?: string[]) => {
  if (!items || items.length === 0) return 'None provided';
  return items.join(', ');
};

const generateCharacter: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: CharacterImageRequestBody;
    Reply: CharacterImageResponse | ErrorResponse;
  }>(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            biography: { type: 'string' },
            factions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  summary: { type: 'string' },
                },
                required: ['name'],
              },
            },
            cultures: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  summary: { type: 'string' },
                },
                required: ['name'],
              },
            },
            species: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  summary: { type: 'string' },
                },
                required: ['name'],
              },
            },
            archetypes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  summary: { type: 'string' },
                },
                required: ['name'],
              },
            },
            traits: {
              type: 'array',
              items: { type: 'string' },
            },
            promptHint: { type: 'string' },
          },
          required: ['name'],
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

        const { name } = req.body;
        if (!name?.trim()) {
          return reply.status(400).send({
            error: 'Missing required fields',
            details: 'name is required to build a portrait prompt',
          });
        }

        const factionsText = formatGroups([
          ...(req.body.factions || []),
          ...(req.body.cultures || []),
        ]);
        const speciesText = formatGroups(req.body.species);
        const archetypesText = formatGroups(req.body.archetypes);
        const traitsText = formatList(req.body.traits);

        const prompt = await characterPromptTemplate.format({
          name,
          description: req.body.description ?? '–',
          biography: req.body.biography ?? '–',
          factions: factionsText,
          species: speciesText,
          archetypes: archetypesText,
          traits: traitsText,
          promptHint:
            req.body.promptHint ?? 'Use painterly realism. No text overlay.',
        });

        let imageUrl: string;
        let revisedPrompt: string | undefined;

        try {
          const slug = name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

          const result = await fastify.imageGen.generateImageToCdn({
            prompt,
            keyPrefix: `characters/${slug}/`,
          });
          imageUrl = result.url;
          revisedPrompt = result.revisedPrompt;
        } catch (openaiError) {
          fastify.log.error({
            msg: 'OpenAI API error while generating character portrait',
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
            msg: 'Invalid image URL received from portrait generation',
            imageUrl,
          });
          return reply.status(500).send({
            error: 'Invalid response from image generation service',
            details: 'No valid portrait URL was generated',
          });
        }

        const duration = Date.now() - startTime;
        fastify.log.info({
          msg: 'Character portrait generated',
          duration,
          imageUrl,
        });

        return reply.send({ imageUrl, revisedPrompt });
      } catch (error) {
        const duration = Date.now() - startTime;
        fastify.log.error({
          msg: 'Failed to generate character portrait',
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });

        return reply.status(500).send({
          error: 'Failed to generate character portrait',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  );
};

export default generateCharacter;
