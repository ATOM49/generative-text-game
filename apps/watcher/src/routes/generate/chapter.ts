import { FastifyPluginAsync } from 'fastify';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';

const generateChapter: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: { worldContext: string; previousChapters: string } }>(
    '/',
    async (req, reply) => {
      const { worldContext, previousChapters } = req.body;
      const prompt = new PromptTemplate({
        template:
          'Given the world context "{context}" and previous chapters "{previousChapters}", generate the next chapter of the story.',
        inputVariables: ['context', 'previousChapters'],
      });
      const model = new ChatOpenAI({ temperature: 0.7 });
      const chain = new LLMChain({ llm: model, prompt });
      const result = await chain.call({
        context: worldContext,
        previousChapters,
      });
      reply.send({ chapter: result.text });
    },
  );
};

export default generateChapter;
