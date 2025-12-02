import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/api/errors';
import { GridService } from '@/lib/api/grid.service';

const gridService = new GridService(prisma);

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: worldId } = await context.params;
    const payload = await gridService.getWorldGrid(worldId);
    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode },
      );
    }

    console.error('Error fetching world grid:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
