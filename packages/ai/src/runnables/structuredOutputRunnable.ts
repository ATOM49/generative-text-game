import { Runnable } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';

type InArgs = {
  prompt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any; // Zod schema - using any to avoid deep instantiation issues
  temperature?: number;
  maxRetries?: number;
};

type OutArgs<T> = {
  structuredResponse: T;
  providerMeta: {
    provider: 'openai';
    model: string;
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class OpenAIStructuredOutputRunnable<T = any> extends Runnable<
  InArgs,
  OutArgs<T>
> {
  lc_namespace = ['talespin', 'ai', 'runnables'];

  private apiKey: string;
  private model: string;

  constructor(opts?: { apiKey?: string; model?: string }) {
    super();
    this.apiKey = opts?.apiKey ?? process.env.OPENAI_API_KEY!;
    this.model = opts?.model ?? 'gpt-4o-mini';
  }

  async invoke(input: InArgs): Promise<OutArgs<T>> {
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
