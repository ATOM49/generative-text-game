import { Runnable } from '@langchain/core/runnables';
import { DallEAPIWrapper } from '@langchain/openai';

type InArgs = {
  prompt: string;
  size: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
};

type OutArgs = {
  imageBuffer: Buffer;
  revisedPrompt?: string;
  providerMeta: {
    provider: 'openai';
    model: string;
    size: string;
    quality: string;
    style: string;
  };
};

export class OpenAIImageGenerateRunnable extends Runnable<InArgs, OutArgs> {
  lc_namespace = ['talespin', 'ai', 'runnables'];

  private apiKey: string;
  private model: string;

  constructor(opts?: { apiKey?: string; model?: string }) {
    super();
    this.apiKey = opts?.apiKey ?? process.env.OPENAI_API_KEY!;
    this.model = opts?.model ?? 'dall-e-3';
  }

  async invoke(input: InArgs): Promise<OutArgs> {
    // Create a new wrapper instance with the specific configuration for this request
    const wrapper = new DallEAPIWrapper({
      openAIApiKey: this.apiKey,
      modelName: this.model,
      size: input.size,
      quality: input.quality ?? 'standard',
      style: input.style ?? 'vivid',
      n: 1,
      responseFormat: 'b64_json',
    });

    const b64Json = await wrapper.invoke(input.prompt);

    const imageBuffer = Buffer.from(b64Json, 'base64');

    return {
      imageBuffer,
      revisedPrompt: undefined, // DallEAPIWrapper doesn't expose revised_prompt
      providerMeta: {
        provider: 'openai',
        model: this.model,
        size: input.size,
        quality: input.quality ?? 'standard',
        style: input.style ?? 'vivid',
      },
    };
  }
}
