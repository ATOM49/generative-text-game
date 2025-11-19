import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const BodySchema = z.object({
  imageUrl: z.string().url(),
  polygon: z.object({
    points: z
      .array(
        z.object({
          x: z.number().min(0).max(1),
          y: z.number().min(0).max(1),
        }),
      )
      .min(3),
  }),
});

const EDIT_PROMPT =
  'Enhance the selected region with richer topography, seamless blending, and story-driven landmarks consistent with the surrounding map style.';

export async function POST(request: NextRequest) {
  try {
    const parsed = BodySchema.parse(await request.json());
    const watcherBaseUrl =
      process.env.WATCHER_API_URL ?? 'http://localhost:4000';

    const editEndpoint = new URL('/generate/edit-image', watcherBaseUrl);

    const watcherResponse = await fetch(editEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: EDIT_PROMPT,
        imageUrl: parsed.imageUrl,
        polygon: parsed.polygon,
        size: '1024x1024',
        keyPrefix: 'world-edits/',
      }),
    });

    const responseText = await watcherResponse.text();

    if (!watcherResponse.ok) {
      console.error('[Image Edit API] Watcher edit failed', {
        status: watcherResponse.status,
        body: responseText,
      });

      let errorPayload: { error?: string; details?: string } | undefined;
      try {
        errorPayload = JSON.parse(responseText);
      } catch {
        // noop
      }

      return NextResponse.json(
        {
          error: 'Image edit request failed',
          details: errorPayload?.details || errorPayload?.error || responseText,
        },
        { status: watcherResponse.status },
      );
    }

    return NextResponse.json(JSON.parse(responseText));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: error.flatten() },
        { status: 400 },
      );
    }

    console.error('[Image Edit API] Unexpected error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
