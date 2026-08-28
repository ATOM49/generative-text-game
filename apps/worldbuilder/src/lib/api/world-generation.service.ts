import { Prisma, PrismaClient } from '@prisma/client';
import {
  WorldBlueprintSchema,
  WorldCreationResultSchema,
  WorldCreationSeedSchema,
  type ParsedWorldCreationSeed,
  type WorldBlueprint,
  type WorldCreationResult,
} from '@talespin/schema';
import { CharacterService } from './character.service';
import { ApiError } from './errors';
import { FactionService } from './faction.service';
import {
  DEFAULT_GRID_HEIGHT,
  DEFAULT_GRID_WIDTH,
  GridService,
  type GridCellTemplate,
} from './grid.service';
import { RegionService } from './region.service';
import { WorldService } from './world.service';

type GenerationOptions = {
  watcherBaseUrl?: string;
  generationTimeoutMs?: number;
};

const coordinateKey = (x: number, y: number) => `${x}:${y}`;

export class WorldGenerationService {
  private readonly watcherBaseUrl: string;
  private readonly generationTimeout: number;

  constructor(
    private readonly prisma: PrismaClient,
    options?: GenerationOptions,
  ) {
    const configuredTimeout = Number(
      process.env.WATCHER_WORLD_GENERATION_TIMEOUT_MS ||
        process.env.WATCHER_GENERATION_TIMEOUT_MS ||
        600000,
    );

    this.watcherBaseUrl = (
      options?.watcherBaseUrl ||
      process.env.WATCHER_API_URL ||
      'http://localhost:4000'
    ).replace(/\/$/, '');
    this.generationTimeout =
      options?.generationTimeoutMs ??
      (Number.isFinite(configuredTimeout) && configuredTimeout > 0
        ? configuredTimeout
        : 600000);
  }

  async createWorld(seedInput: unknown): Promise<WorldCreationResult> {
    const seed = WorldCreationSeedSchema.parse(seedInput);
    const blueprint = await this.requestBlueprint(seed);
    this.validateBlueprint(seed, blueprint);

    return this.persistBlueprint(seed, blueprint);
  }

  private async requestBlueprint(
    seed: ParsedWorldCreationSeed,
  ): Promise<WorldBlueprint> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.generationTimeout,
    );

    try {
      const response = await fetch(
        `${this.watcherBaseUrl}/generate/world-blueprint`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(seed),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const details = await response.text();
        throw new ApiError(502, 'World blueprint generation failed', {
          watcherStatus: response.status,
          details,
        });
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        throw new ApiError(
          502,
          'World blueprint generator returned invalid JSON',
        );
      }

      const parsed = WorldBlueprintSchema.safeParse(payload);
      if (!parsed.success) {
        throw new ApiError(502, 'World blueprint failed validation', {
          issues: parsed.error.issues,
        });
      }

      return parsed.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiError(504, 'World blueprint generation timed out');
      }
      throw new ApiError(502, 'Unable to reach the world blueprint generator');
    } finally {
      clearTimeout(timeout);
    }
  }

  private validateBlueprint(
    seed: ParsedWorldCreationSeed,
    blueprint: WorldBlueprint,
  ) {
    const issues: string[] = [];

    if (blueprint.context.theme !== seed.theme) {
      issues.push(
        'The generated world theme does not match the requested theme.',
      );
    }
    if (blueprint.regions.length !== seed.regionCount) {
      issues.push(
        `Expected ${seed.regionCount} regions, received ${blueprint.regions.length}.`,
      );
    }
    if (blueprint.factions.length !== seed.factionCount) {
      issues.push(
        `Expected ${seed.factionCount} factions, received ${blueprint.factions.length}.`,
      );
    }

    const expectedCharacterCount =
      seed.factionCount * seed.charactersPerFaction;
    if (blueprint.characters.length !== expectedCharacterCount) {
      issues.push(
        `Expected ${expectedCharacterCount} characters, received ${blueprint.characters.length}.`,
      );
    }

    const regionKeys = this.collectUniqueKeys(
      blueprint.regions,
      'region',
      issues,
    );
    const factionKeys = this.collectUniqueKeys(
      blueprint.factions,
      'faction',
      issues,
    );
    this.collectUniqueKeys(blueprint.characters, 'character', issues);

    const coveredCells = new Set<string>();
    for (const region of blueprint.regions) {
      for (const coordinate of region.cellCoordinates) {
        if (
          coordinate.x < 0 ||
          coordinate.x >= DEFAULT_GRID_WIDTH ||
          coordinate.y < 0 ||
          coordinate.y >= DEFAULT_GRID_HEIGHT
        ) {
          issues.push(
            `Region ${region.key} contains out-of-bounds cell ${coordinateKey(coordinate.x, coordinate.y)}.`,
          );
          continue;
        }

        const key = coordinateKey(coordinate.x, coordinate.y);
        if (coveredCells.has(key)) {
          issues.push(`Grid cell ${key} is assigned more than once.`);
        }
        coveredCells.add(key);
      }
    }

    const expectedCellCount = DEFAULT_GRID_WIDTH * DEFAULT_GRID_HEIGHT;
    if (coveredCells.size !== expectedCellCount) {
      issues.push(
        `Regions cover ${coveredCells.size} of ${expectedCellCount} grid cells.`,
      );
    }

    const assignmentRegionKeys = new Set<string>();
    const assignedFactionKeys = new Set<string>();
    for (const assignment of blueprint.assignments) {
      if (!regionKeys.has(assignment.regionKey)) {
        issues.push(
          `Assignment references unknown region key ${assignment.regionKey}.`,
        );
      }
      if (assignmentRegionKeys.has(assignment.regionKey)) {
        issues.push(
          `Region ${assignment.regionKey} has more than one assignment record.`,
        );
      }
      assignmentRegionKeys.add(assignment.regionKey);

      const assignmentFactionKeys = new Set<string>();
      for (const presence of assignment.factions) {
        if (!factionKeys.has(presence.factionKey)) {
          issues.push(
            `Assignment references unknown faction key ${presence.factionKey}.`,
          );
        }
        if (assignmentFactionKeys.has(presence.factionKey)) {
          issues.push(
            `Region ${assignment.regionKey} repeats faction ${presence.factionKey}.`,
          );
        }
        assignmentFactionKeys.add(presence.factionKey);
        assignedFactionKeys.add(presence.factionKey);
      }
    }

    for (const regionKey of regionKeys) {
      if (!assignmentRegionKeys.has(regionKey)) {
        issues.push(`Region ${regionKey} does not have a faction assignment.`);
      }
    }
    for (const factionKey of factionKeys) {
      if (!assignedFactionKeys.has(factionKey)) {
        issues.push(`Faction ${factionKey} is not present in any region.`);
      }
    }

    const charactersByFaction = new Map<string, number>();
    for (const character of blueprint.characters) {
      if (!factionKeys.has(character.factionKey)) {
        issues.push(
          `Character ${character.key} references unknown faction key ${character.factionKey}.`,
        );
      }
      charactersByFaction.set(
        character.factionKey,
        (charactersByFaction.get(character.factionKey) ?? 0) + 1,
      );
    }

    for (const factionKey of factionKeys) {
      const count = charactersByFaction.get(factionKey) ?? 0;
      if (count !== seed.charactersPerFaction) {
        issues.push(
          `Faction ${factionKey} has ${count} characters; expected ${seed.charactersPerFaction}.`,
        );
      }
    }

    if (issues.length) {
      throw new ApiError(502, 'World blueprint references are invalid', {
        issues,
      });
    }
  }

  private collectUniqueKeys(
    items: Array<{ key: string }>,
    label: string,
    issues: string[],
  ) {
    const keys = new Set<string>();
    for (const item of items) {
      if (keys.has(item.key)) {
        issues.push(`Duplicate ${label} key ${item.key}.`);
      }
      keys.add(item.key);
    }
    return keys;
  }

  private async persistBlueprint(
    seed: ParsedWorldCreationSeed,
    blueprint: WorldBlueprint,
  ): Promise<WorldCreationResult> {
    let worldId: string | undefined;

    try {
      const world = await this.prisma.world.create({
        data: {
          name: blueprint.context.name,
          description: blueprint.context.description,
          theme: blueprint.context.theme,
          contextWindowLimit: 1024,
          mapImageUrl: blueprint.mapImageUrl,
          lore: blueprint.context.lore as Prisma.InputJsonValue,
          settings: {
            generationSeed: seed,
          } as Prisma.InputJsonValue,
        },
        select: { id: true },
      });
      worldId = world.id;

      const gridPayload = this.buildGridCells(blueprint);
      const gridResult = await new GridService(this.prisma).createGrid(
        worldId,
        {
          width: DEFAULT_GRID_WIDTH,
          height: DEFAULT_GRID_HEIGHT,
          cells: gridPayload,
        },
      );

      const factionIds = new Map<string, string>();
      for (const generated of blueprint.factions) {
        const { faction } = generated;
        const created = await this.prisma.faction.create({
          data: {
            worldId,
            name: faction.name,
            summary: faction.summary || null,
            description: faction.description || null,
            previewUrl: faction.previewUrl || null,
            category: faction.category,
            meta: faction.meta as Prisma.InputJsonValue,
          },
          select: { id: true },
        });
        factionIds.set(generated.key, created.id);
      }

      const cellsByCoordinate = new Map(
        gridResult.cells.map((cell) => [
          coordinateKey(cell.x, cell.y),
          cell._id,
        ]),
      );
      const assignmentsByRegion = new Map(
        blueprint.assignments.map((assignment) => [
          assignment.regionKey,
          assignment,
        ]),
      );

      for (const region of blueprint.regions) {
        const assignment = assignmentsByRegion.get(region.key);
        if (!assignment) {
          throw new Error(`Missing validated assignment for ${region.key}`);
        }

        const cellIds = region.cellCoordinates.map((coordinate) => {
          const cellId = cellsByCoordinate.get(
            coordinateKey(coordinate.x, coordinate.y),
          );
          if (!cellId) {
            throw new Error(
              `Missing persisted grid cell ${coordinateKey(coordinate.x, coordinate.y)}`,
            );
          }
          return cellId;
        });

        const factionPresence = assignment.factions.map((presence) => {
          const factionId = factionIds.get(presence.factionKey);
          if (!factionId) {
            throw new Error(`Missing persisted faction ${presence.factionKey}`);
          }
          return {
            factionId,
            influence: presence.influence,
            rationale: presence.rationale,
          };
        });

        await this.prisma.region.create({
          data: {
            worldId,
            gridId: gridResult.grid._id,
            cellIds,
            name: region.name,
            summary: region.summary,
            description: region.description,
            biome: region.biome,
            atmosphere: region.atmosphere,
            mapBounds: region.mapBounds as Prisma.InputJsonValue,
            missionHooks: region.missionHooks,
            factionPresence: factionPresence as Prisma.InputJsonValue,
          },
        });
      }

      for (const generated of blueprint.characters) {
        const factionId = factionIds.get(generated.factionKey);
        if (!factionId) {
          throw new Error(`Missing persisted faction ${generated.factionKey}`);
        }

        await this.prisma.character.create({
          data: {
            worldId,
            name: generated.name,
            description: generated.description,
            biography: generated.biography,
            previewUrl: generated.previewUrl || null,
            gallery: null,
            promptHint: generated.promptHint,
            traits: generated.traits,
            factionIds: [factionId],
            cultureIds: [],
            speciesIds: [],
            archetypeIds: [],
            meta: generated.meta as Prisma.InputJsonValue,
          },
        });
      }

      const result = {
        world: await new WorldService(this.prisma).getWorld(worldId),
        regions: await new RegionService(this.prisma).listRegions(worldId),
        factions: await new FactionService(this.prisma).listFactions(worldId),
        characters: await new CharacterService(this.prisma).listCharacters(
          worldId,
        ),
      };

      return WorldCreationResultSchema.parse(result);
    } catch (error) {
      if (worldId) {
        try {
          await new WorldService(this.prisma).deleteWorld(worldId);
        } catch (cleanupError) {
          console.error(
            `Failed to compensate world generation for ${worldId}:`,
            cleanupError,
          );
        }
      }
      throw error;
    }
  }

  private buildGridCells(blueprint: WorldBlueprint): GridCellTemplate[] {
    return blueprint.regions.flatMap((region) =>
      region.cellCoordinates.map((coordinate) => ({
        x: coordinate.x,
        y: coordinate.y,
        walkable: true,
        biome: region.biome,
        name: region.name,
        description: region.summary,
        tags: [
          `region:${region.key}`,
          `atmosphere:${region.atmosphere}`,
          ...region.visualDetails,
        ],
      })),
    );
  }
}
