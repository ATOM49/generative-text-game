import { FastifyPluginAsync } from 'fastify';
import { OpenAIStructuredOutputRunnable } from '@talespin/ai';
import { PromptTemplate } from '@langchain/core/prompts';
import {
  FactionFormSchema,
  type FactionForm,
  type World,
} from '@talespin/schema';

const promptTemplate = PromptTemplate.fromTemplate(`
You are a creative world-builder assistant.
Generate a unique and interesting faction, culture, or species for the following world:

World Name: {name}
World Description: {description}
World Theme: {theme}

The faction should fit well within this world.
Ensure the "category" is one of the allowed values: 'faction', 'culture', 'species', 'entity', 'archetype'.
Fill in the "meta" fields including tone, keywords, and character hooks.
`);

const generateFactionDetails: FastifyPluginAsync = async (fastify) => {
  fastify.post<{
    Body: World;
    Reply: FactionForm | { error: string; details?: string };
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
            settings: { type: 'object' },
          },
          required: ['name'],
        },
      },
    },
    async (req, reply) => {
      try {
        if (!process.env.OPENAI_API_KEY) {
          fastify.log.error('OPENAI_API_KEY is not configured');
          return reply.status(500).send({
            error: 'Service configuration error',
            details: 'AI service is not properly configured',
          });
        }

        const world = req.body;

        const runnable = new OpenAIStructuredOutputRunnable<FactionForm>({
          apiKey: process.env.OPENAI_API_KEY,
          model: 'gpt-4o',
        });

        const prompt = await promptTemplate.format({
          name: world.name,
          description: world.description || 'No description provided',
          theme: world.theme || 'Generic Fantasy',
        });

        const result = await runnable.invoke({
          prompt,
          schema: FactionFormSchema,
        });

        return reply.send(result.structuredResponse);
      } catch (error) {
        fastify.log.error({
          msg: 'Failed to generate faction details',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        return reply.status(500).send({
          error: 'Failed to generate faction details',
          details: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
  );
};

export default generateFactionDetails;
