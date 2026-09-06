import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api/errors';
import { StoryService } from '@/lib/api/story.service';
import { EXPLORER_ONLY, requireUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

const storyService = new StoryService(prisma);
type Params = Promise<{ worldId: string }>;

export async function GET(_request: NextRequest, context: { params: Params }) {
  try {
    const user = await requireUser(EXPLORER_ONLY);
    const { worldId } = await context.params;
    const story = await storyService.getStoryForWorld(worldId, user.id);
    return NextResponse.json(story);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, context: { params: Params }) {
  try {
    const user = await requireUser(EXPLORER_ONLY);
    const { worldId } = await context.params;
    const story = await storyService.startStory(
      worldId,
      user.id,
      await request.json(),
    );
    return NextResponse.json(story, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
