import { NextRequest, NextResponse } from 'next/server';
import {
  ImageGenerationService,
  type EditImageRequestInput,
} from '@/lib/api/ai-image.service';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { RegionFormSchema } from '@talespin/schema';

const imageGenerationService = new ImageGenerationService();

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError(400, 'Invalid JSON payload');
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ApiError(
        400,
        'Invalid request payload',
        'Body must be an object',
      );
    }

    // Extract and validate region data
    const { region, imageUrl } = body as Record<string, unknown>;

    if (!region || typeof region !== 'object') {
      throw new ApiError(400, 'Missing region data');
    }

    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new ApiError(400, 'Missing imageUrl');
    }

    console.log({ region });
    // Validate region against schema
    const regionValidation = RegionFormSchema.safeParse(region);
    if (!regionValidation.success) {
      throw new ApiError(
        400,
        'Invalid region data',
        regionValidation.error.errors,
      );
    }

    const validatedRegion = regionValidation.data;

    const result = await imageGenerationService.editImageRegion({
      region: validatedRegion,
      imageUrl,
      size: '1024x1024',
      keyPrefix: 'world-edits/',
    } as EditImageRequestInput);

    if (!result.ok) {
      console.error('[Image Edit API] Service request failed', result);
      throw new ApiError(result.status, result.error, result.details);
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('[Image Edit API] Unexpected error', error);
    return handleApiError(error);
  }
}
