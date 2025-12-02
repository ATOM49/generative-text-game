import { NextRequest, NextResponse } from 'next/server';
import {
  ImageGenerationService,
  type EditImageRequestInput,
} from '@/lib/api/ai-image.service';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { requireUser, BUILDER_ONLY } from '@/lib/auth/guards';

const EDIT_PROMPT =
  'Enhance the selected region with richer topography, seamless blending, and story-driven landmarks consistent with the surrounding map style.';

const imageGenerationService = new ImageGenerationService();

export async function POST(request: NextRequest) {
  try {
    await requireUser(BUILDER_ONLY);
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

    const result = await imageGenerationService.editImageRegion({
      ...(body as Record<string, unknown>),
      prompt: EDIT_PROMPT,
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
