import { NextRequest, NextResponse } from 'next/server';
import { handleApiError } from '@/lib/api/errors';
import { GameplayService } from '@/lib/api/gameplay.service';
import { EXPLORER_ONLY, requireUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

const gameplayService = new GameplayService(prisma);
type Params = Promise<{ storyId: string }>;

export async function GET(_request: NextRequest, context: { params: Params }) {
  try {
    const user = await requireUser(EXPLORER_ONLY);
    const { storyId } = await context.params;
    const story = await gameplayService.getStory(storyId, user.id);
    return NextResponse.json(story);
  } catch (error) {
    return handleApiError(error);
  }
}
