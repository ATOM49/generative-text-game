import { NextRequest, NextResponse } from 'next/server';
import { WorldService } from '@/lib/api/world.service';
import { WorldFormSchema } from '@talespin/schema';
import { WorldQueryParamsSchema } from '@/lib/api/types';
import { handleApiError } from '@/lib/api/errors';
import { prisma } from '@/lib/prisma';

const worldService = new WorldService(prisma);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const validatedParams = WorldQueryParamsSchema.parse(params);

    const result = await worldService.listWorlds(validatedParams);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const validatedData = WorldFormSchema.parse(data);

    const world = await worldService.createWorld(validatedData);
    return NextResponse.json(world, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
