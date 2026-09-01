import { NextResponse } from 'next/server';
import { WorldGenerationService } from '@/lib/api/world-generation.service';
import { handleApiError } from '@/lib/api/errors';
import { requireUser, BUILDER_ONLY } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

const worldGenerationService = new WorldGenerationService(prisma);

export async function GET(
  _request: Request,
  context: { params: Promise<{ jobId: string }> },
) {
  try {
    const user = await requireUser(BUILDER_ONLY);
    const { jobId } = await context.params;
    const job = await worldGenerationService.getJob(jobId, user.id);
    return NextResponse.json(job);
  } catch (error) {
    return handleApiError(error);
  }
}
