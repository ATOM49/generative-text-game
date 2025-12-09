import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api/errors';
import { CharacterService } from '@/lib/api/character.service';
import { requireUser } from '@/lib/auth/guards';

const characterService = new CharacterService(prisma);

type Params = Promise<{ id: string }>;

export async function GET(_request: NextRequest, context: { params: Params }) {
  try {
    const user = await requireUser();
    const { id: worldId } = await context.params;
    const character = await characterService.getPlayerCharacter(
      worldId,
      user.id,
    );
    return NextResponse.json(character);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, context: { params: Params }) {
  try {
    const user = await requireUser();
    const { id: worldId } = await context.params;
    const body = await request.json();
    const character = await characterService.upsertPlayerCharacter(
      worldId,
      user.id,
      body,
    );
    return NextResponse.json(character);
  } catch (error) {
    return handleApiError(error);
  }
}
