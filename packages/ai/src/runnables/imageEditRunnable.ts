import { Runnable } from '@langchain/core/runnables';
import OpenAI from 'openai';
import { toFile } from 'openai/uploads';
import type { EditedImage, ImageEditInput } from '../contracts.js';

export class OpenAIImageEditRunnable extends Runnable<
  ImageEditInput,
  EditedImage
> {
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

  async invoke(input: ImageEditInput): Promise<EditedImage> {
    const imageFile = await toFile(input.image, 'image.png', {
      type: 'image/png',
    });
    const maskFile = await toFile(input.mask, 'mask.png', {
      type: 'image/png',
    });

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
      contentType: 'image/png',
      providerMeta: {
        provider: 'openai',
        model: this.model,
        size: input.size,
      },
    };
  }
}
