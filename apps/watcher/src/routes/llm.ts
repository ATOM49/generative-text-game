import { FastifyPluginAsync } from 'fastify';
import { config } from 'dotenv';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';

config();

const chatResponseSchema = z.object({
  answer: z.string().describe("The answer to the user's question"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('Confidence level between 0 and 1'),
  source: z.string().nullable().describe('Optional URL or source for context'),
});

type ChatResponse = z.infer<typeof chatResponseSchema>;

const llmRoutes: FastifyPluginAsync = async (app, _opts) => {
  const model = new ChatOpenAI({
    model: 'gpt-4o', // or whichever model you prefer
    temperature: 0.7, // Adjust temperature for creativity
  });

  const structuredModel = model.withStructuredOutput(chatResponseSchema, {
    name: 'ChatResponse',
  });

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are the Watcher. Provide structured JSON response.'],
    ['human', '{question}'],
  ]);

  const chain = prompt.pipe(structuredModel);

  app.post<{ Body: { question: string } }>('/llm', async (req, reply) => {
    const { question } = req.body;
    const result = await chain.invoke({ question });
    // result is guaranteed to match ChatResponse
    return result as ChatResponse;
  });
};

export default llmRoutes;
