import { FastifyPluginAsync } from 'fastify';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';

const generateWorldContext: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', async (req, reply) => {
    const { seed } = req.body;
    const prompt = new PromptTemplate({
      template:
        'Given the seed "{seed}", generate a detailed world context for a fantasy setting.',
      inputVariables: ['seed'],
    });
    const model = new ChatOpenAI({ temperature: 0.7 });
    const chain = new LLMChain({ llm: model, prompt });
    const result = await chain.call({ seed });
    reply.send({ worldContext: result.text });
  });
};

export default generateWorldContext;
