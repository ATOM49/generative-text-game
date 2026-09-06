import { NextRequest, NextResponse } from 'next/server';
import { CharacterService } from '@/lib/api/character.service';
import { handleApiError } from '@/lib/api/errors';
import { EXPLORER_ONLY, requireUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/prisma';

const characterService = new CharacterService(prisma);
type Params = Promise<{ worldId: string }>;

export async function GET(_request: NextRequest, context: { params: Params }) {
  try {
    const user = await requireUser(EXPLORER_ONLY);
    const { worldId } = await context.params;
    const characters = await characterService.listPlayableCharacters(
      worldId,
      user.id,
    );
    return NextResponse.json(characters);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, context: { params: Params }) {
  try {
    const user = await requireUser(EXPLORER_ONLY);
    const { worldId } = await context.params;
    const character = await characterService.createPlayerCharacter(
      worldId,
      user.id,
      await request.json(),
    );
    return NextResponse.json(character, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
