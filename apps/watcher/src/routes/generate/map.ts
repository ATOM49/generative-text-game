import { FastifyPluginAsync } from 'fastify';
import OpenAI from 'openai';

interface WorldData {
  name: string;
  description?: string;
  theme: string;
  contextWindowLimit?: number;
}

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
    Body: WorldData;
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
      try {
        // Type-safe body
        const world = req.body;

        // Compose a prompt based on the world theme and description
        const descriptionText = world.description
          ? `\n\nWorld Description: ${world.description}`
          : '';
        const prompt = `Create a detailed fantasy map for a ${world.theme} world named "${world.name}".${descriptionText}\n\nThe map should be artistic, detailed, and evoke the atmosphere of a ${world.theme} setting. Include terrain features, regions, and landmarks appropriate for this theme.`;

        // Use OpenAI's DALL·E 3 for image generation
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
          response_format: 'url',
        });

        if (!response.data || response.data.length === 0) {
          throw new Error('No image data returned from OpenAI');
        }

        const imageUrl = response.data[0].url;
        const revisedPrompt = response.data[0].revised_prompt;

        if (!imageUrl) {
          throw new Error('No image URL returned from OpenAI');
        }

        reply.send({
          imageUrl,
          revisedPrompt,
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          error: 'Failed to generate map image',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  );
};

export default generateMap;
