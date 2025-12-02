import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError } from '@/lib/api/errors';
import { CharacterService } from '@/lib/api/character.service';
import { CharacterQueryParamsSchema } from '@/lib/api/types';
import { requireUser, BUILDER_ONLY } from '@/lib/auth/guards';

const characterService = new CharacterService(prisma);

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
    const query = CharacterQueryParamsSchema.parse(searchParams);
    const characters = await characterService.listCharacters(worldId, query);
    return NextResponse.json(characters);
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
    const character = await characterService.createCharacter(worldId, body);
    return NextResponse.json(character, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
