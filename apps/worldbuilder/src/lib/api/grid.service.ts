import { Prisma, PrismaClient } from '@prisma/client';
import { ApiError } from './errors';
import type { GridCell, WorldGrid } from '@talespin/schema';

export const DEFAULT_GRID_WIDTH = 8;
export const DEFAULT_GRID_HEIGHT = 8;
const PENDING_HOME_CELL_ID = '__pending_home_cell__';

export type GridCellTemplate = {
  x: number;
  y: number;
  walkable?: boolean;
  biome?: string;
  name?: string;
  description?: string;
  tags?: string[];
};

export type GridTemplate = {
  width: number;
  height: number;
  home?: { x: number; y: number };
  cells?: GridCellTemplate[];
};

const gridSelect = {
  select: {
    id: true,
    worldId: true,
    width: true,
    height: true,
    homeCellId: true,
    cells: {
      select: {
        id: true,
        gridId: true,
        x: true,
        y: true,
        walkable: true,
        biome: true,
        name: true,
        description: true,
        tags: true,
      },
      orderBy: {
        y: 'asc' as const,
      },
    },
  },
} as const;

type PrismaGrid = {
  id: string;
  worldId: string;
  width: number;
  height: number;
  homeCellId: string;
  cells: Array<{
    id: string;
    gridId: string;
    x: number;
    y: number;
    walkable: boolean;
    biome: string | null;
    name: string | null;
    description: string | null;
    tags: string[];
  }>;
};

export class GridService {
  constructor(private readonly prisma: PrismaClient) {}

  async getWorldGrid(
    worldId: string,
  ): Promise<{ grid: WorldGrid; cells: GridCell[] }> {
    const grid = await this.prisma.worldGrid.findUnique({
      where: { worldId },
      select: gridSelect.select,
    });

    if (!grid) {
      throw new ApiError(404, 'World grid not found');
    }

    return this.mapGrid(grid as PrismaGrid);
  }

  async updateCell(cellId: string, data: Partial<GridCell>) {
    const cell = await this.prisma.gridCell.update({
      where: { id: cellId },
      data: {
        walkable: data.walkable,
        biome: data.biome,
        name: data.name,
        description: data.description,
        tags: data.tags,
      },
    });

    return {
      _id: cell.id,
      gridId: cell.gridId,
      x: cell.x,
      y: cell.y,
      walkable: cell.walkable,
      biome: cell.biome ?? undefined,
      name: cell.name ?? undefined,
      description: cell.description ?? undefined,
      tags: cell.tags ?? [],
    };
  }

  async createDefaultGrid(
    worldId: string,
    options?: { width?: number; height?: number },
  ) {
    const template: GridTemplate = {
      width: options?.width ?? DEFAULT_GRID_WIDTH,
      height: options?.height ?? DEFAULT_GRID_HEIGHT,
    };

    return this.createGrid(worldId, template);
  }

  async createGrid(worldId: string, template: GridTemplate) {
    console.log(
      `[grid] Creating ${template.width}x${template.height} grid for world ${worldId}...`,
    );

    return this.persistGrid(worldId, template);
  }

  async replaceGrid(worldId: string, template: GridTemplate) {
    await this.cleanup(worldId);
    return this.createGrid(worldId, template);
  }

  async cleanup(worldId: string) {
    const grid = await this.prisma.worldGrid.findUnique({
      where: { worldId },
      select: { id: true },
    });

    if (!grid) {
      console.log(
        `[grid] No grid found for world ${worldId}, nothing to clean up`,
      );
      return;
    }

    await this.prisma.gridCell.deleteMany({ where: { gridId: grid.id } });
    await this.prisma.worldGrid.delete({ where: { id: grid.id } });
    console.log(
      `[grid] Deleted grid ${grid.id} and associated cells for world ${worldId}`,
    );
  }

  private async persistGrid(worldId: string, template: GridTemplate) {
    const grid = await this.prisma.worldGrid.create({
      data: {
        worldId,
        width: template.width,
        height: template.height,
        homeCellId: PENDING_HOME_CELL_ID,
      },
      select: { id: true },
    });

    const cellPayload = this.buildCells(grid.id, template);
    await this.prisma.gridCell.createMany({ data: cellPayload });
    console.log(
      `[grid] Inserted ${cellPayload.length} cells for grid ${grid.id}`,
    );

    const home = template.home ?? {
      x: Math.floor(template.width / 2),
      y: Math.floor(template.height / 2),
    };

    const homeCell = await this.prisma.gridCell.findFirst({
      where: {
        gridId: grid.id,
        x: home.x,
        y: home.y,
      },
      select: { id: true },
    });

    if (!homeCell) {
      throw new Error('Failed to locate home cell for new grid');
    }

    await this.prisma.worldGrid.update({
      where: { id: grid.id },
      data: { homeCellId: homeCell.id },
    });

    console.log(`[grid] Home cell for grid ${grid.id} set to ${homeCell.id}`);

    return this.getWorldGrid(worldId);
  }

  private buildCells(
    gridId: string,
    template: GridTemplate,
  ): Prisma.GridCellCreateManyInput[] {
    const overrides = new Map<string, GridCellTemplate>();
    template.cells?.forEach((cell) => {
      overrides.set(`${cell.x}:${cell.y}`, cell);
    });

    const payload: Prisma.GridCellCreateManyInput[] = [];
    for (let y = 0; y < template.height; y += 1) {
      for (let x = 0; x < template.width; x += 1) {
        const override = overrides.get(`${x}:${y}`);
        payload.push({
          gridId,
          x,
          y,
          walkable: override?.walkable ?? true,
          biome: override?.biome ?? null,
          name: override?.name ?? null,
          description: override?.description ?? null,
          tags: override?.tags ?? [],
        });
      }
    }

    return payload;
  }

  private mapGrid(grid: PrismaGrid): { grid: WorldGrid; cells: GridCell[] } {
    return {
      grid: {
        _id: grid.id,
        worldId: grid.worldId,
        width: grid.width,
        height: grid.height,
        homeCellId: grid.homeCellId,
      },
      cells: grid.cells.map((cell) => ({
        _id: cell.id,
        gridId: cell.gridId,
        x: cell.x,
        y: cell.y,
        walkable: cell.walkable,
        biome: cell.biome ?? undefined,
        name: cell.name ?? undefined,
        description: cell.description ?? undefined,
        tags: cell.tags ?? [],
      })),
    };
  }
}
