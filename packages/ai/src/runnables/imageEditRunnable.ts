import { Runnable } from '@langchain/core/runnables';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';

type InArgs = {
  prompt: string;
  negativePrompt?: string;
  image: Buffer;
  mask: Buffer;
  size: '256x256' | '512x512' | '1024x1024';
};

type OutArgs = {
  editedImageBuffer: Buffer;
  providerMeta: {
    provider: 'openai';
    model: string;
    size: string;
    requestId?: string;
  };
};

export class OpenAIImageEditRunnable extends Runnable<InArgs, OutArgs> {
  lc_namespace = ['talespin', 'ai', 'runnables'];

  private client: OpenAI;
  private model: string;

  constructor(opts?: { apiKey?: string; model?: string }) {
    super();
    this.client = new OpenAI({
      apiKey: opts?.apiKey ?? process.env.OPENAI_API_KEY!,
    });
    this.model = opts?.model ?? 'dall-e-2';
  }

  async invoke(input: InArgs): Promise<OutArgs> {
    const imageFile = await toFile(input.image, 'image.png');
    const maskFile = await toFile(input.mask, 'mask.png');

    const res = await this.client.images.edit({
      model: this.model,
      image: imageFile,
      mask: maskFile,
      prompt: input.prompt,
      size: input.size,
      response_format: 'b64_json',
    });

    if (!res.data || res.data.length === 0) {
      throw new Error('No image data returned from OpenAI');
    }

    const b64 = res.data[0].b64_json;
    if (!b64) {
      throw new Error('No base64 data in response');
    }

    const editedImageBuffer = Buffer.from(b64, 'base64');

    return {
      editedImageBuffer,
      providerMeta: {
        provider: 'openai',
        model: this.model,
        size: input.size,
      },
    };
  }
}
