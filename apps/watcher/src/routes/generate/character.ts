import { FastifyPluginAsync } from 'fastify';
import { CharacterGalleryImageSchema } from '@talespin/schema';
import { z } from 'zod';
import { createCharacterGalleryChain } from '../../chains/generateCharacterGallery.js';
import { characterPromptTemplate } from '../../prompts/characterPrompt.js';
import { CharacterImageRequestSchema } from '@talespin/schema';

type CharacterGroup = z.infer<
  typeof CharacterImageRequestSchema
>['factions'][number];

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

type CharacterGalleryImage = z.infer<typeof CharacterGalleryImageSchema>;

interface CharacterImageResponse {
  imageUrl: string;
  revisedPrompt?: string;
  images: CharacterGalleryImage[];
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

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '') || 'character';

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
              images: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    angle: { type: 'string' },
                    description: { type: 'string' },
                    imageUrl: { type: 'string' },
                    revisedPrompt: { type: 'string' },
                  },
                  required: ['angle', 'imageUrl'],
                },
              },
            },
            required: ['imageUrl', 'images'],
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

        const characterBrief = await characterPromptTemplate.format({
          name,
          description: req.body.description ?? '–',
          biography: req.body.biography ?? '–',
          factions: factionsText,
          species: speciesText,
          archetypes: archetypesText,
          traits: traitsText,
          promptHint:
            req.body.promptHint ?? 'Use 8-bit style art. No text overlay.',
        });

        const slug = slugify(name);

        const galleryChain = createCharacterGalleryChain(fastify);

        const result = await galleryChain.invoke({
          characterBrief,
          slug,
        });

        const images = result.images;
        const imageUrl = images[0]?.imageUrl;
        const revisedPrompt = images[0]?.revisedPrompt;

        if (!imageUrl) {
          return reply.status(500).send({
            error: 'Invalid response from image generation service',
            details: 'No valid image URL was present in the gallery',
          });
        }

        const duration = Date.now() - startTime;
        fastify.log.info({
          msg: 'Character gallery generated',
          duration,
          coverImage: imageUrl,
          imageCount: images.length,
        });

        return reply.send({ imageUrl, revisedPrompt, images });
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
