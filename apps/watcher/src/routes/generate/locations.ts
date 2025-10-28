import { PromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { FastifyPluginAsync } from 'fastify';
import { LLMChain } from 'langchain/chains';

const generateLocations: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', async (req, reply) => {
    const { worldTheme, mapDescription } = req.body;

    const prompt = new PromptTemplate({
      template:
        'Based on the context "{mapDescription}", generate unique {worldTheme} locations.',
      inputVariables: ['mapDescription', 'worldTheme'],
    });

    const model = new ChatOpenAI({ temperature: 0.7 });

    const chain = new LLMChain({ llm: model, prompt });

    const result = await chain.call({ mapDescription, worldTheme });

    reply.send({ locations: result.text });
  });
};

export default generateLocations;
