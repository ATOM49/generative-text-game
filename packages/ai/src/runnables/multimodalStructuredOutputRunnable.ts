import { HumanMessage } from '@langchain/core/messages';
import { Runnable } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import type {
  MultimodalImageInput,
  MultimodalStructuredOutputInput,
  StructuredOutputResult,
} from '../contracts.js';

const resolveImageUrl = (image: MultimodalImageInput): string => {
  if (image.type === 'url') {
    return image.url;
  }

  return `data:${image.mediaType};base64,${image.data}`;
};

export class OpenAIMultimodalStructuredOutputRunnable<
  T = unknown,
> extends Runnable<
  MultimodalStructuredOutputInput<T>,
  StructuredOutputResult<T>
> {
  lc_namespace = ['talespin', 'ai', 'runnables'];

  private apiKey: string;
  private model: string;

  constructor(opts?: { apiKey?: string; model?: string }) {
    super();
    this.apiKey = opts?.apiKey ?? process.env.OPENAI_API_KEY!;
    this.model = opts?.model ?? 'gpt-4o-mini';
  }

  async invoke(
    input: MultimodalStructuredOutputInput<T>,
  ): Promise<StructuredOutputResult<T>> {
    const llm = new ChatOpenAI({
      apiKey: this.apiKey,
      model: this.model,
      temperature: input.temperature ?? 0.7,
      maxRetries: input.maxRetries ?? 2,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const structuredLlm = llm.withStructuredOutput(input.schema as any, {
      method: 'jsonSchema',
    });
    const message = new HumanMessage({
      content: [
        { type: 'text', text: input.text },
        {
          type: 'image_url',
          image_url: { url: resolveImageUrl(input.image) },
        },
      ],
    });
    const structuredResponse = await structuredLlm.invoke([message]);

    return {
      structuredResponse: input.schema.parse(structuredResponse),
      providerMeta: {
        provider: 'openai',
        model: this.model,
      },
    };
  }
}
