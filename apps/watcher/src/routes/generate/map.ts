import { FastifyPluginAsync } from 'fastify';
import { OpenAI } from '@langchain/openai';
import { WorldMap, WorldMapFormSchema } from '@talespin/schema';

const generateMap: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            map: WorldMapFormSchema.toJSON(),
          },
          required: ['map'],
        },
      },
    },
    async (req, reply) => {
      // Type-safe body
      const body = req.body as { map: WorldMap };
      const { map } = body;

      // Validate the map object (description is optional per schema)
      if (!map || !map.worldId) {
        return reply.status(400).send({ error: 'Invalid map data' });
      }

      // Compose a prompt based on the world theme and region configuration
      const prompt = `Draw a map of a land of a ${map.theme} these settings:\n\nWorld Description: ${map.description}.`;

      // Use LangChain's OpenAI image generation (DALL·E)
      const openai = new OpenAI({ model: 'dall-e-3' });
      const imageResult = await openai.call(prompt);

      // imageResult is a string (URL or base64)
      reply.send({ image: imageResult });
    },
  );
};

export default generateMap;
