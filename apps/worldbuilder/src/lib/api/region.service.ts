import { Prisma, PrismaClient } from '@prisma/client';
import { ApiError } from './errors';
import {
  RegionFormSchema,
  type Region,
  type RegionForm,
} from '@talespin/schema';

type PrismaRegion = {
  id: string;
  worldId: string;
  name: string;
  parentRegionId: string | null;
  geom: Prisma.JsonValue;
  tags: string[];
};

const regionSelect = {
  select: {
    id: true,
    worldId: true,
    name: true,
    parentRegionId: true,
    geom: true,
    tags: true,
  },
} as const;

export class RegionService {
  constructor(private prisma: PrismaClient) {}

  async listRegions(worldId: string): Promise<Region[]> {
    const regions = await this.prisma.region.findMany({
      where: { worldId },
      select: regionSelect.select,
    });

    return regions.map((region) => this.mapRegionToDto(region as PrismaRegion));
  }

  async getRegion(id: string): Promise<Region> {
    const region = await this.prisma.region.findUnique({
      where: { id },
      select: regionSelect.select,
    });

    if (!region) {
      throw new ApiError(404, 'Region not found');
    }

    return this.mapRegionToDto(region as PrismaRegion);
  }

  async createRegion(worldId: string, data: RegionForm): Promise<Region> {
    try {
      const validated = RegionFormSchema.parse(data);

      const region = (await this.prisma.region.create({
        data: {
          worldId,
          name: validated.name,
          parentRegionId: validated.parentRegionId || null,
          geom: validated.geom as Prisma.InputJsonValue,
          tags: validated.tags || [],
        },
        select: regionSelect.select,
      })) as PrismaRegion;

      return this.mapRegionToDto(region);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ApiError(409, 'Region with this name already exists');
        }
      }
      throw error;
    }
  }

  async updateRegion(id: string, data: RegionForm): Promise<Region> {
    try {
      const validated = RegionFormSchema.parse(data);

      const region = await this.prisma.region.update({
        where: { id },
        data: {
          name: validated.name,
          parentRegionId: validated.parentRegionId || null,
          geom: validated.geom as Prisma.InputJsonValue,
          tags: validated.tags || [],
        },
        select: regionSelect.select,
      });

      return this.mapRegionToDto(region as PrismaRegion);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new ApiError(404, 'Region not found');
        }
      }
      throw error;
    }
  }

  async deleteRegion(id: string): Promise<void> {
    try {
      await this.prisma.region.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new ApiError(404, 'Region not found');
        }
      }
      throw error;
    }
  }

  private mapRegionToDto(region: PrismaRegion): Region {
    return {
      _id: region.id,
      worldId: region.worldId,
      name: region.name,
      parentRegionId: region.parentRegionId || undefined,
      geom: region.geom as Region['geom'],
      tags: region.tags,
    };
  }
}
