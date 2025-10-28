import { FastifyPluginAsync } from 'fastify';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';

const generateFactions: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', async (req, reply) => {
    const { worldContext } = req.body;
    const prompt = new PromptTemplate({
      template:
        'Based on the context "{context}", generate unique fantasy factions.',
      inputVariables: ['context'],
    });
    const model = new ChatOpenAI({ temperature: 0.7 });
    const chain = new LLMChain({ llm: model, prompt });
    const result = await chain.call({ context: worldContext });
    reply.send({ factions: result.text });
  });
};

export default generateFactions;
