import { NextRequest, NextResponse } from 'next/server';
import { GameplayService } from '@/lib/api/gameplay.service';
import { ApiError, handleApiError } from '@/lib/api/errors';
import { EXPLORER_ONLY, requireUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

const gameplay = new GameplayService(prisma);
type Params = Promise<{ storyId: string; missionId: string }>;

export async function POST(request: NextRequest, context: { params: Params }) {
  try {
    const user = await requireUser(EXPLORER_ONLY);
    const { storyId, missionId } = await context.params;
    const current = await gameplay.getMission(missionId, user.id);
    if (current.story._id !== storyId)
      throw new ApiError(404, 'Mission not found');
    const view = await gameplay.submitAction(
      missionId,
      user.id,
      await request.json(),
    );
    return NextResponse.json(view);
  } catch (error) {
    return handleApiError(error);
  }
}
