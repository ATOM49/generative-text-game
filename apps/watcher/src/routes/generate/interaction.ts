import { FastifyPluginAsync } from 'fastify';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';

const generateInteraction: FastifyPluginAsync = async (fastify) => {
  fastify.post('/', async (req, reply) => {
    const { worldContext, chapter } = req.body;
    const prompt = new PromptTemplate({
      template:
        'Given the world context "{context}" and current chapter "{chapter}", generate a meaningful player interaction.',
      inputVariables: ['context', 'chapter'],
    });
    const model = new ChatOpenAI({ temperature: 0.7 });
    const chain = new LLMChain({ llm: model, prompt });
    const result = await chain.call({ context: worldContext, chapter });
    reply.send({ interaction: result.text });
  });
};

export default generateInteraction;
