import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/guards';
import { handleApiError } from '@/lib/api/errors';
import { RegionService } from '@/lib/api/region.service';
import { prisma } from '@/lib/prisma';

const regionService = new RegionService(prisma);

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; regionId: string }> },
) {
  try {
    await requireUser();
    const { id: worldId, regionId } = await context.params;
    const region = await regionService.getRegion(worldId, regionId);
    return NextResponse.json(region);
  } catch (error) {
    return handleApiError(error);
  }
}
