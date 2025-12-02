import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api/errors';
import { FactionService } from '@/lib/api/faction.service';
import { FactionQueryParamsSchema } from '@/lib/api/types';
import { requireUser, BUILDER_ONLY } from '@/lib/auth/guards';

const factionService = new FactionService(prisma);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser();
    const { id: worldId } = await context.params;
    const searchParams = Object.fromEntries(
      new URL(request.url).searchParams.entries(),
    );
    const query = FactionQueryParamsSchema.parse(searchParams);
    const factions = await factionService.listFactions(worldId, query);
    return NextResponse.json(factions);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireUser(BUILDER_ONLY);
    const { id: worldId } = await context.params;
    const body = await request.json();
    const faction = await factionService.createFaction(worldId, body);
    return NextResponse.json(faction, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
