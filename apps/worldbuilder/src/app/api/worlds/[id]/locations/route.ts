import { NextRequest, NextResponse } from 'next/server';
import { LocationService } from '@/lib/api/location.service';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api/errors';

const locationService = new LocationService(prisma);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: worldId } = await context.params;
    const locations = await locationService.listLocations(worldId);
    return NextResponse.json(locations);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error('Error listing locations:', error);
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
    const location = await locationService.createLocation(worldId, body);
    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }
    console.error('Error creating location:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
