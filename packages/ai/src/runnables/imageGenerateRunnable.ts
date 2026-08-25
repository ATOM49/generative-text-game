import { Runnable } from '@langchain/core/runnables';
import { DallEAPIWrapper } from '@langchain/openai';
import type { GeneratedImage, ImageGenerationInput } from '../contracts.js';

export class OpenAIImageGenerateRunnable extends Runnable<
  ImageGenerationInput,
  GeneratedImage
> {
  lc_namespace = ['talespin', 'ai', 'runnables'];

  private apiKey: string;
  private model: string;

  constructor(opts?: { apiKey?: string; model?: string }) {
    super();
    this.apiKey = opts?.apiKey ?? process.env.OPENAI_API_KEY!;
    this.model = opts?.model ?? 'dall-e-3';
  }

  async invoke(input: ImageGenerationInput): Promise<GeneratedImage> {
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
      contentType: 'image/png',
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
