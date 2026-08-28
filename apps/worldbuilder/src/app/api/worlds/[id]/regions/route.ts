import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/guards';
import { handleApiError } from '@/lib/api/errors';
import { RegionService } from '@/lib/api/region.service';
import { prisma } from '@/lib/prisma';

const regionService = new RegionService(prisma);

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser();
    const { id: worldId } = await context.params;
    const regions = await regionService.listRegions(worldId);
    return NextResponse.json(regions);
  } catch (error) {
    return handleApiError(error);
  }
}
