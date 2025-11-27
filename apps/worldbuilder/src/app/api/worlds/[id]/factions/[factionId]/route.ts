import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api/errors';
import { FactionService } from '@/lib/api/faction.service';

const factionService = new FactionService(prisma);

type Params = Promise<{ id: string; factionId: string }>;

export async function GET(request: NextRequest, context: { params: Params }) {
  try {
    const { id: worldId, factionId } = await context.params;
    const faction = await factionService.getFaction(worldId, factionId);
    return NextResponse.json(faction);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, context: { params: Params }) {
  try {
    const { id: worldId, factionId } = await context.params;
    const body = await request.json();
    const faction = await factionService.updateFaction(
      worldId,
      factionId,
      body,
    );
    return NextResponse.json(faction);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Params },
) {
  try {
    const { id: worldId, factionId } = await context.params;
    await factionService.deleteFaction(worldId, factionId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
