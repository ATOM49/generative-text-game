import { NextRequest, NextResponse } from 'next/server';
import { RegionService } from '@/lib/api/region.service';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api/errors';

const regionService = new RegionService(prisma);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: worldId } = await context.params;
    const regions = await regionService.listRegions(worldId);
    return NextResponse.json(regions);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error('Error listing regions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: worldId } = await context.params;
    const body = await request.json();
    const region = await regionService.createRegion(worldId, body);
    return NextResponse.json(region, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error('Error creating region:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
