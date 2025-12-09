import { OpenAIStructuredOutputRunnable } from '@talespin/ai';
import { CharacterGalleryImageSchema } from '@talespin/schema';
import { RunnableSequence, RunnableLambda } from '@langchain/core/runnables';
import { z } from 'zod';
import turnaroundPlannerTemplate from '../prompts/turnaroundPlannerTemplate.js';
import type { FastifyInstance } from 'fastify';

const plannerChain = new OpenAIStructuredOutputRunnable({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o-mini',
});

const TurnaroundShotSchema = z.object({
  angle: z.string().min(1),
  summary: z.string().min(1),
  prompt: z.string().min(1),
});

const TurnaroundPlanSchema = z.object({
  shots: z.array(TurnaroundShotSchema).min(2).max(3),
});

export const createCharacterGalleryChain = (fastify: FastifyInstance) =>
  RunnableSequence.from([
    RunnableLambda.from(
      async (input: { characterBrief: string; slug: string }) => {
        const plannerPrompt = await turnaroundPlannerTemplate.format({
          characterBrief: input.characterBrief,
        });

        const { structuredResponse: plan } = await plannerChain.invoke({
          prompt: plannerPrompt,
          schema: TurnaroundPlanSchema,
          temperature: 0.6,
        });

        return { plan, slug: input.slug, characterBrief: input.characterBrief };
      },
    ),
    RunnableLambda.from(
      async ({
        plan,
        slug,
        characterBrief,
      }: {
        plan: z.infer<typeof TurnaroundPlanSchema>;
        slug: string;
        characterBrief: string;
      }) => {
        const images: z.infer<typeof CharacterGalleryImageSchema>[] = [];

        for (const shot of plan.shots) {
          // Enforce single-subject, full-body portrait orientation and neutral background
          const enforcedPrompt = `${characterBrief}. ${shot.summary}. ${shot.angle} angle. Render a single instance of the character only (no other figures, duplicates, reflections, or crowd). Full-body, portrait-oriented composition (taller-than-wide). Neutral studio background, no text, logos, or UI elements.`;

          const { url: imageUrl, revisedPrompt } =
            await fastify.imageGen.generateImageToCdn({
              prompt: enforcedPrompt,
              keyPrefix: `characters/${slug}/${shot.angle}`,
              // Request a portrait orientation (taller-than-wide) to keep images consistent
              size: '1024x1792',
            });

          images.push({
            angle: shot.angle,
            description: shot.summary,
            imageUrl,
            revisedPrompt: revisedPrompt ?? shot.prompt,
          });
        }
        console.log({ images });
        return { images };
      },
    ),
  ]);
