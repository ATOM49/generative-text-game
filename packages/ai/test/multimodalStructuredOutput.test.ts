import { HumanMessage } from '@langchain/core/messages';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  withStructuredOutput: vi.fn(),
  chatOpenAI: vi.fn(),
}));

vi.mock('@langchain/openai', () => ({
  ChatOpenAI: mocks.chatOpenAI,
}));

import { OpenAIMultimodalStructuredOutputRunnable } from '../src/runnables/multimodalStructuredOutputRunnable';

const ResultSchema = z.object({
  biome: z.string(),
});

describe('OpenAIMultimodalStructuredOutputRunnable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.invoke.mockResolvedValue({ biome: 'salt marsh' });
    mocks.withStructuredOutput.mockReturnValue({ invoke: mocks.invoke });
    mocks.chatOpenAI.mockImplementation(() => ({
      withStructuredOutput: mocks.withStructuredOutput,
    }));
  });

  it('sends text and a URL image in one human message', async () => {
    const runnable = new OpenAIMultimodalStructuredOutputRunnable({
      apiKey: 'test-key',
      model: 'gpt-4o-mini',
    });

    const result = await runnable.invoke({
      text: 'Describe this region.',
      image: { type: 'url', url: 'https://example.com/region.png' },
      schema: ResultSchema,
      temperature: 0.2,
      maxRetries: 1,
    });

    expect(mocks.chatOpenAI).toHaveBeenCalledWith({
      apiKey: 'test-key',
      model: 'gpt-4o-mini',
      temperature: 0.2,
      maxRetries: 1,
    });
    expect(mocks.withStructuredOutput).toHaveBeenCalledWith(ResultSchema, {
      method: 'jsonSchema',
    });

    const messages = mocks.invoke.mock.calls[0]?.[0] as HumanMessage[];
    expect(messages).toHaveLength(1);
    expect(messages[0]).toBeInstanceOf(HumanMessage);
    expect(messages[0]?.content).toEqual([
      { type: 'text', text: 'Describe this region.' },
      {
        type: 'image_url',
        image_url: { url: 'https://example.com/region.png' },
      },
    ]);
    expect(result).toEqual({
      structuredResponse: { biome: 'salt marsh' },
      providerMeta: { provider: 'openai', model: 'gpt-4o-mini' },
    });
  });

  it('converts base64 image content to a data URL', async () => {
    const runnable = new OpenAIMultimodalStructuredOutputRunnable({
      apiKey: 'test-key',
    });

    await runnable.invoke({
      text: 'Describe this cutout.',
      image: {
        type: 'base64',
        data: 'cGl4ZWxz',
        mediaType: 'image/png',
      },
      schema: ResultSchema,
    });

    const messages = mocks.invoke.mock.calls[0]?.[0] as HumanMessage[];
    expect(messages[0]?.content).toEqual([
      { type: 'text', text: 'Describe this cutout.' },
      {
        type: 'image_url',
        image_url: { url: 'data:image/png;base64,cGl4ZWxz' },
      },
    ]);
  });

  it('parses the model response with the caller schema', async () => {
    mocks.invoke.mockResolvedValue({ biome: 42 });
    const runnable = new OpenAIMultimodalStructuredOutputRunnable({
      apiKey: 'test-key',
    });

    await expect(
      runnable.invoke({
        text: 'Describe this region.',
        image: { type: 'url', url: 'https://example.com/region.png' },
        schema: ResultSchema,
      }),
    ).rejects.toBeInstanceOf(z.ZodError);
  });
});
