import { Prisma, PrismaClient } from '@prisma/client';
import type { WorldQueryParams } from './types';
import { ApiError } from './errors';
import type { World, WorldForm } from '@talespin/schema';
import { WorldQueryParamsSchema } from './types';

type PrismaWorld = {
  id: string;
  name: string;
  description: string | null;
  theme: string | null;
  contextWindowLimit: number | null;
  mapImageUrl: string | null;
  settings: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};

const worldSelect = {
  select: {
    id: true,
    name: true,
    description: true,
    theme: true,
    contextWindowLimit: true,
    mapImageUrl: true,
    settings: true,
    createdAt: true,
    updatedAt: true,
  },
} as const;

export class WorldService {
  constructor(private prisma: PrismaClient) {}

  private async generateMapImageUrl(data: WorldForm): Promise<string | null> {
    try {
      const watcherApiUrl =
        process.env.WATCHER_API_URL || 'http://localhost:3001';

      // Validate input data matches the API schema
      const requestBody = {
        name: data.name,
        description: data.description,
        theme: data.theme,
        contextWindowLimit: data.contextWindowLimit,
      };

      console.log('Generating map image with data:', requestBody);

      const response = await fetch(`${watcherApiUrl}/generate/map`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `Failed to generate map image (${response.status}):`,
          errorText,
        );
        return null;
      }

      // Validate response matches expected structure
      const result = (await response.json()) as
        | { imageUrl: string; revisedPrompt?: string }
        | { error: string; details?: string };

      if ('error' in result) {
        console.error('Map generation error:', result.error, result.details);
        return null;
      }

      if (!result.imageUrl) {
        console.error('No imageUrl in response:', result);
        return null;
      }

      console.log('Map image generated successfully:', result.imageUrl);
      if (result.revisedPrompt) {
        console.log('Revised prompt:', result.revisedPrompt);
      }

      return result.imageUrl;
    } catch (error) {
      console.error('Error generating map image:', error);
      return null;
    }
  }

  async listWorlds(queryParams: WorldQueryParams) {
    const parsedParams = WorldQueryParamsSchema.parse(queryParams);
    const { page, limit, sortBy, sortOrder, search } = parsedParams;

    const where: Prisma.WorldWhereInput = {};

    if (search) {
      where.name = {
        contains: search as string,
        mode: 'insensitive' as const,
      };
    }

    const [total, worlds] = await Promise.all([
      this.prisma.world.count({ where }),
      this.prisma.world.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: {
          [sortBy as string]: sortOrder,
        },
        select: worldSelect.select,
      }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    return {
      data: worlds.map((world) => this.mapWorldToDto(world as PrismaWorld)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async getWorld(id: string): Promise<World> {
    const world = await this.prisma.world.findUnique({
      where: { id },
      select: worldSelect.select,
    });

    if (!world) {
      throw new ApiError(404, 'World not found');
    }

    return this.mapWorldToDto(world as PrismaWorld);
  }

  async createWorld(data: WorldForm): Promise<World> {
    // Generate map image and create world in parallel
    const [mapImageUrl, world] = await Promise.all([
      this.generateMapImageUrl(data),
      this.prisma.world.create({
        data: {
          name: data.name,
          description: data.description || null,
          theme: data.theme || null,
          contextWindowLimit: data.contextWindowLimit || 1024,
          settings: data.settings || null,
        },
        select: worldSelect.select,
      }),
    ]);

    // Update world with the generated map image URL if successfully generated
    if (mapImageUrl) {
      const updatedWorld = await this.prisma.world.update({
        where: { id: world.id },
        data: { mapImageUrl },
        select: worldSelect.select,
      });
      return this.mapWorldToDto(updatedWorld as unknown as PrismaWorld);
    }

    return this.mapWorldToDto(world as unknown as PrismaWorld);
  }

  async updateWorld(id: string, data: WorldForm): Promise<World> {
    try {
      const world = await this.prisma.world.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description || null,
          theme: data.theme || null,
          contextWindowLimit: data.contextWindowLimit || 1024,
          settings: data.settings || null,
          mapImageUrl: data.mapImageUrl || null,
        },
        select: worldSelect.select,
      });

      return this.mapWorldToDto(world as unknown as PrismaWorld);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new ApiError(404, 'World not found');
        }
      }
      throw error;
    }
  }

  async deleteWorld(id: string): Promise<void> {
    try {
      await this.prisma.world.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new ApiError(404, 'World not found');
        }
      }
      throw error;
    }
  }

  private mapWorldToDto(world: PrismaWorld): World {
    return {
      _id: world.id,
      name: world.name,
      description: world.description || undefined,
      theme: world.theme as World['theme'],
      contextWindowLimit: world.contextWindowLimit ?? 1024,
      mapImageUrl: world.mapImageUrl || undefined,
      settings: world.settings as World['settings'],
      createdAt: world.createdAt.toISOString(),
      updatedAt: world.updatedAt.toISOString(),
    };
  }
}
