import { Runnable } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import type {
  StructuredOutputInput,
  StructuredOutputResult,
} from '../contracts.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class OpenAIStructuredOutputRunnable<T = any> extends Runnable<
  StructuredOutputInput<T>,
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
    input: StructuredOutputInput<T>,
  ): Promise<StructuredOutputResult<T>> {
    const llm = new ChatOpenAI({
      apiKey: this.apiKey,
      model: this.model,
      temperature: input.temperature ?? 0.7,
      maxRetries: input.maxRetries ?? 2,
    });

    // Use withStructuredOutput for native structured output support
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const structuredLlm = llm.withStructuredOutput(input.schema as any, {
      method: 'jsonSchema',
    });

    const structuredResponse = await structuredLlm.invoke(input.prompt);

    return {
      structuredResponse: structuredResponse as T,
      providerMeta: {
        provider: 'openai',
        model: this.model,
        // Note: Token counts would need to be extracted from response metadata
        // This requires accessing the underlying response which isn't directly
        // available through withStructuredOutput
      },
    };
  }
}
