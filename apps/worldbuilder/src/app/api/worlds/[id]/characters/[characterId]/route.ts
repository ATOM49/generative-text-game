import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api/errors';
import { CharacterService } from '@/lib/api/character.service';
import { requireUser, BUILDER_ONLY } from '@/lib/auth/guards';

const characterService = new CharacterService(prisma);

type Params = Promise<{ id: string; characterId: string }>;

export async function GET(_request: NextRequest, context: { params: Params }) {
  try {
    await requireUser();
    const { id: worldId, characterId } = await context.params;
    const character = await characterService.getCharacter(worldId, characterId);
    return NextResponse.json(character);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest, context: { params: Params }) {
  try {
    await requireUser(BUILDER_ONLY);
    const { id: worldId, characterId } = await context.params;
    const body = await request.json();
    const character = await characterService.updateCharacter(
      worldId,
      characterId,
      body,
    );
    return NextResponse.json(character);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Params },
) {
  try {
    await requireUser(BUILDER_ONLY);
    const { id: worldId, characterId } = await context.params;
    await characterService.deleteCharacter(worldId, characterId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
