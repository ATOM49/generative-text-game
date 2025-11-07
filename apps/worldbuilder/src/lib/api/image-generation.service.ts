import { z } from 'zod';

export interface ImageGenerationOptions {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  baseUrl?: string;
}

export interface ImageGenerationResponse {
  imageUrl: string;
  revisedPrompt?: string;
}

/**
 * Generic service for generating images via external APIs
 * Supports any endpoint and data schema with Zod validation
 */
export class ImageGenerationService {
  private readonly timeout: number;
  private readonly maxRetries: number;
  private readonly retryDelay: number;
  private readonly baseUrl: string;

  constructor(options?: ImageGenerationOptions) {
    this.timeout = options?.timeout ?? 60000; // 60 seconds
    this.maxRetries = options?.maxRetries ?? 2;
    this.retryDelay = options?.retryDelay ?? 1000; // 1 second
    this.baseUrl =
      options?.baseUrl ||
      process.env.WATCHER_API_URL ||
      'http://localhost:4000';
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Generic method to generate an image URL by calling an external API
   * @param endpoint - The API endpoint to call (e.g., '/generate/map')
   * @param data - The data to send in the request
   * @param schema - Zod schema to validate the data before sending
   * @param retryCount - Current retry attempt (internal use)
   * @returns The generated image URL or null if generation fails
   */
  async generateImageUrl<T extends z.ZodType>(
    endpoint: string,
    data: unknown,
    schema: T,
    retryCount = 0,
  ): Promise<string | null> {
    try {
      // Validate input data with the provided schema
      const validatedData = schema.parse(data);

      console.log(
        `Generating image at ${endpoint} (attempt ${retryCount + 1}/${this.maxRetries + 1}):`,
        validatedData,
      );

      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(validatedData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `Failed to generate image (${response.status}):`,
            errorText,
          );

          // Retry on 5xx errors
          if (
            response.status >= 500 &&
            response.status < 600 &&
            retryCount < this.maxRetries
          ) {
            console.log(
              `Retrying after ${this.retryDelay}ms due to server error...`,
            );
            await this.sleep(this.retryDelay * (retryCount + 1));
            return this.generateImageUrl(
              endpoint,
              data,
              schema,
              retryCount + 1,
            );
          }

          return null;
        }

        // Validate response matches expected structure
        const result = (await response.json()) as
          | ImageGenerationResponse
          | { error: string; details?: string };

        if ('error' in result) {
          console.error(
            'Image generation error:',
            result.error,
            result.details,
          );
          return null;
        }

        if (!result.imageUrl) {
          console.error('No imageUrl in response:', result);
          return null;
        }

        console.log('Image generated successfully:', result.imageUrl);
        if (result.revisedPrompt) {
          console.log('Revised prompt:', result.revisedPrompt);
        }

        return result.imageUrl;
      } catch (fetchError) {
        clearTimeout(timeoutId);

        // Handle timeout
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error(`Image generation timed out after ${this.timeout}ms`);
          // Don't retry on timeout
          return null;
        }

        // Retry on network errors
        if (retryCount < this.maxRetries) {
          console.log(
            `Retrying after ${this.retryDelay}ms due to network error...`,
          );
          await this.sleep(this.retryDelay * (retryCount + 1));
          return this.generateImageUrl(endpoint, data, schema, retryCount + 1);
        }

        throw fetchError;
      }
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        return null;
      }

      console.error('Error generating image:', error);
      return null;
    }
  }
}
