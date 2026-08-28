import { NextRequest, NextResponse } from 'next/server';
import { WorldGenerationService } from '@/lib/api/world-generation.service';
import { handleApiError } from '@/lib/api/errors';
import { requireUser, BUILDER_ONLY } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

const worldGenerationService = new WorldGenerationService(prisma);

export async function POST(request: NextRequest) {
  try {
    await requireUser(BUILDER_ONLY);
    const body = await request.json();
    const result = await worldGenerationService.createWorld(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
