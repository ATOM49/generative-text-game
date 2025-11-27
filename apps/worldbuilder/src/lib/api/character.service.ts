import { Prisma, PrismaClient } from '@prisma/client';
import {
  Character,
  CharacterForm,
  CharacterFormSchema,
  CharacterMetaSchema,
} from '@talespin/schema';
import { ApiError } from './errors';
import { CharacterQueryParams, CharacterQueryParamsSchema } from './types';
import {
  CharacterImageRequestSchema,
  CharacterImageRequestInput,
  ImageGenerationService,
} from './ai-image.service';

const characterSelect = {
  select: {
    id: true,
    worldId: true,
    name: true,
    description: true,
    biography: true,
    previewUrl: true,
    promptHint: true,
    traits: true,
    factionIds: true,
    cultureIds: true,
    speciesIds: true,
    archetypeIds: true,
    meta: true,
    createdAt: true,
    updatedAt: true,
  },
} as const;

type PrismaCharacter = Prisma.CharacterGetPayload<typeof characterSelect>;

export class CharacterService {
  constructor(private prisma: PrismaClient) {}

  async listCharacters(
    worldId: string,
    query?: CharacterQueryParams,
  ): Promise<Character[]> {
    const parsed = CharacterQueryParamsSchema.parse(query ?? {});

    const where: Prisma.CharacterWhereInput = {
      worldId,
    };

    const associationFilters: Prisma.CharacterWhereInput[] = [];

    if (parsed.search) {
      where.OR = [
        {
          name: { contains: parsed.search, mode: 'insensitive' },
        },
        {
          description: { contains: parsed.search, mode: 'insensitive' },
        },
      ];
    }

    if (parsed.factionId) {
      associationFilters.push({ factionIds: { has: parsed.factionId } });
    }

    if (parsed.cultureId) {
      associationFilters.push({ cultureIds: { has: parsed.cultureId } });
    }

    if (parsed.speciesId) {
      associationFilters.push({ speciesIds: { has: parsed.speciesId } });
    }

    if (parsed.archetypeId) {
      associationFilters.push({ archetypeIds: { has: parsed.archetypeId } });
    }

    if (associationFilters.length) {
      where.AND = [...(where.AND ?? []), ...associationFilters];
    }

    const characters = await this.prisma.character.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: characterSelect.select,
    });

    return characters.map((character) => this.mapCharacterToDto(character));
  }

  async getCharacter(worldId: string, id: string): Promise<Character> {
    const character = await this.prisma.character.findUnique({
      where: { id },
      select: characterSelect.select,
    });

    if (!character || character.worldId !== worldId) {
      throw new ApiError(404, 'Character not found');
    }

    return this.mapCharacterToDto(character);
  }

  async createCharacter(
    worldId: string,
    data: CharacterForm,
  ): Promise<Character> {
    const validated = CharacterFormSchema.parse(data);

    const previewUrl =
      validated.previewUrl || (await this.generatePortrait(worldId, validated));

    const character = await this.prisma.character.create({
      data: {
        worldId,
        name: validated.name,
        description: validated.description || null,
        biography: validated.biography || null,
        previewUrl: previewUrl || null,
        promptHint: validated.promptHint || null,
        traits: validated.traits,
        factionIds: validated.factionIds,
        cultureIds: validated.cultureIds,
        speciesIds: validated.speciesIds,
        archetypeIds: validated.archetypeIds,
        meta: (validated.meta as Prisma.InputJsonValue) || null,
      },
      select: characterSelect.select,
    });

    return this.mapCharacterToDto(character);
  }

  async updateCharacter(
    worldId: string,
    id: string,
    data: CharacterForm,
  ): Promise<Character> {
    const validated = CharacterFormSchema.parse(data);

    const existing = await this.prisma.character.findUnique({
      where: { id },
      select: { worldId: true, previewUrl: true },
    });

    if (!existing || existing.worldId !== worldId) {
      throw new ApiError(404, 'Character not found');
    }

    const previewUrl =
      validated.previewUrl ??
      existing.previewUrl ??
      (await this.generatePortrait(worldId, validated));

    const character = await this.prisma.character.update({
      where: { id },
      data: {
        name: validated.name,
        description: validated.description || null,
        biography: validated.biography || null,
        previewUrl: previewUrl || null,
        promptHint: validated.promptHint || null,
        traits: validated.traits,
        factionIds: validated.factionIds,
        cultureIds: validated.cultureIds,
        speciesIds: validated.speciesIds,
        archetypeIds: validated.archetypeIds,
        meta: (validated.meta as Prisma.InputJsonValue) || null,
      },
      select: characterSelect.select,
    });

    return this.mapCharacterToDto(character);
  }

  async deleteCharacter(worldId: string, id: string): Promise<void> {
    const existing = await this.prisma.character.findUnique({
      where: { id },
      select: { worldId: true },
    });

    if (!existing || existing.worldId !== worldId) {
      throw new ApiError(404, 'Character not found');
    }

    await this.prisma.character.delete({ where: { id } });
  }

  private mapCharacterToDto(character: PrismaCharacter): Character {
    const meta = CharacterMetaSchema.parse(
      character.meta || { descriptors: [] },
    );

    return {
      _id: character.id,
      worldId: character.worldId,
      name: character.name,
      description: character.description || undefined,
      biography: character.biography || undefined,
      previewUrl: character.previewUrl || undefined,
      promptHint: character.promptHint || undefined,
      traits: character.traits || [],
      factionIds: character.factionIds || [],
      cultureIds: character.cultureIds || [],
      speciesIds: character.speciesIds || [],
      archetypeIds: character.archetypeIds || [],
      meta,
      createdAt: character.createdAt.toISOString(),
      updatedAt: character.updatedAt.toISOString(),
    };
  }

  private async generatePortrait(
    worldId: string,
    data: CharacterForm,
  ): Promise<string | null> {
    if (!data.description && !data.biography && data.traits.length === 0) {
      const hasAssociations =
        data.factionIds.length > 0 ||
        data.cultureIds.length > 0 ||
        data.speciesIds.length > 0 ||
        data.archetypeIds.length > 0;

      if (!hasAssociations && !data.promptHint) {
        return null;
      }
    }

    const payload = await this.buildImagePayload(worldId, data);

    if (!payload) {
      return null;
    }

    try {
      return await new ImageGenerationService().generateImageUrl(
        '/generate/character',
        payload,
        CharacterImageRequestSchema,
      );
    } catch (error) {
      console.error('Failed to generate character portrait:', error);
      return null;
    }
  }

  private async buildImagePayload(
    worldId: string,
    data: CharacterForm,
  ): Promise<CharacterImageRequestInput> {
    const associationIds = new Set([
      ...data.factionIds,
      ...data.cultureIds,
      ...data.speciesIds,
      ...data.archetypeIds,
    ]);

    const references = associationIds.size
      ? await this.prisma.faction.findMany({
          where: {
            worldId,
            id: { in: Array.from(associationIds) },
          },
          select: {
            id: true,
            name: true,
            summary: true,
            description: true,
            category: true,
          },
        })
      : [];

    const refs = new Map(references.map((ref) => [ref.id, ref]));

    const toGroup = (ids: string[], categories: string[]) =>
      ids
        .map((id) => refs.get(id))
        .filter((ref): ref is (typeof references)[number] => Boolean(ref))
        .filter((ref) => categories.includes(ref.category))
        .map((ref) => ({
          name: ref.name,
          summary: ref.summary || ref.description || undefined,
        }));

    const factions = toGroup(data.factionIds, ['faction']);
    const cultures = toGroup(data.cultureIds, ['culture']);
    const species = toGroup(data.speciesIds, ['species', 'entity']);
    const archetypes = toGroup(data.archetypeIds, ['archetype', 'entity']);

    if (
      factions.length === 0 &&
      cultures.length === 0 &&
      species.length === 0 &&
      archetypes.length === 0 &&
      !data.promptHint
    ) {
      // Still allow generation with base description/traits
    }

    return {
      name: data.name,
      description: data.description,
      biography: data.biography,
      factions,
      cultures,
      species,
      archetypes,
      traits: data.traits,
      promptHint: data.promptHint,
    };
  }
}
