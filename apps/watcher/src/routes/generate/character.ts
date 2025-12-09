import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import {
  CharacterGallerySchema,
  CharacterGeneratedDetailsSchema,
  CharacterProfileRequestSchema,
  type CharacterProfileRequestInput,
} from '@talespin/schema';
import { createGenerateCharacterFunction } from '../../chains/generateCharacter.js';

type CharacterGenerationResponse = {
  profile: z.infer<typeof CharacterGeneratedDetailsSchema>;
  gallery: z.infer<typeof CharacterGallerySchema>;
  coverImage: string;
  revisedPrompt?: string;
};

interface ErrorResponse {
  error: string;
  details?: string;
}

const generateCharacter: FastifyPluginAsync = async (fastify) => {
  const generateCharacterFlow = createGenerateCharacterFunction(fastify);

  fastify.post<{
    Body: CharacterProfileRequestInput;
    Reply: CharacterGenerationResponse | ErrorResponse;
  }>(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            species: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  summary: { type: 'string' },
                },
                required: ['name'],
              },
            },
          },
          required: ['name', 'species'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              coverImage: { type: 'string' },
              revisedPrompt: { type: 'string' },
              profile: {
                type: 'object',
                properties: {
                  biography: { type: 'string' },
                  promptHint: { type: 'string' },
                  traits: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  meta: {
                    type: 'object',
                    properties: {
                      descriptors: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            label: { type: 'string' },
                            detail: { type: 'string' },
                          },
                          required: ['label', 'detail'],
                        },
                      },
                      notes: { type: 'string' },
                    },
                    required: ['descriptors'],
                  },
                },
                required: ['biography', 'traits', 'meta'],
              },
              gallery: {
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
            required: ['profile', 'gallery', 'coverImage'],
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
        const parsed = CharacterProfileRequestSchema.safeParse(req.body);

        if (!parsed.success) {
          return reply.status(400).send({
            error: 'Invalid character payload',
            details: JSON.stringify(parsed.error.flatten().fieldErrors),
          });
        }

        const result = await generateCharacterFlow(parsed.data);
        const coverImage = result.gallery[0]?.imageUrl;
        const revisedPrompt = result.gallery[0]?.revisedPrompt;

        if (!coverImage) {
          return reply.status(500).send({
            error: 'Invalid response from image generation service',
            details: 'No primary image was returned by the gallery chain',
          });
        }

        const duration = Date.now() - startTime;
        fastify.log.info({
          msg: 'Character generated',
          duration,
          coverImage,
          imageCount: result.gallery.length,
        });

        return reply.send({
          profile: result.profile,
          gallery: result.gallery,
          coverImage,
          revisedPrompt,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        fastify.log.error({
          msg: 'Failed to generate character',
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });

        return reply.status(500).send({
          error: 'Failed to generate character',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  );
};

export default generateCharacter;
