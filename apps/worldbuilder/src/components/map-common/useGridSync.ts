'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { GridCell, WorldGrid } from '@talespin/schema';
import { Canvas as FabricCanvas } from 'fabric';
import type { GridCellMetadata } from '@/components/FabricGrid/types';
import { useGridStore, type GridState } from '@/state/useGridStore';

export const DEFAULT_CANVAS_WIDTH = 1024;

interface GridInput {
  imageUrl: string;
  grid?: {
    grid: Pick<WorldGrid, 'width' | 'height'>;
    cells: GridCell[];
  };
  activeCellId?: string | null;
  showGrid?: boolean;
  interactionMode?: 'grid' | 'location' | undefined;
  onCellClick?: (cell: GridCell) => void;
  onCellSelected?: (cell: GridCell | null) => void;
  onCellsSelected?: (cells: GridCell[]) => void;
}

export function useGridSync({
  imageUrl,
  grid,
  activeCellId,
  showGrid = true,
  interactionMode,
  onCellClick,
  onCellSelected,
  onCellsSelected,
}: GridInput) {
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);

  const config = useGridStore((state: GridState) => state.config);
  const worldImageUrl = useGridStore((state: GridState) => state.worldImageUrl);
  const setConfig = useGridStore((state: GridState) => state.setConfig);
  const setWorldImage = useGridStore((state: GridState) => state.setWorldImage);
  const setSelectedCells = useGridStore(
    (state: GridState) => state.setSelectedCells,
  );
  const clearSelection = useGridStore(
    (state: GridState) => state.clearSelection,
  );
  const setInteractionMode = useGridStore(
    (state: GridState) => state.setInteractionMode,
  );

  useEffect(() => {
    if (worldImageUrl !== imageUrl) {
      setWorldImage(imageUrl);
    }
  }, [imageUrl, setWorldImage, worldImageUrl]);

  useEffect(() => {
    if (!grid) return;

    // Only update config if grid dimensions or showGrid changed
    if (
      config.cellsX === grid.grid.width &&
      config.cellsY === grid.grid.height &&
      config.showGrid === showGrid
    ) {
      return;
    }

    const aspectRatio = grid.grid.height / grid.grid.width || 0.75;
    setConfig({
      cellsX: grid.grid.width,
      cellsY: grid.grid.height,
      width: DEFAULT_CANVAS_WIDTH,
      height: Math.round(DEFAULT_CANVAS_WIDTH * aspectRatio),
      showGrid,
    });
  }, [
    grid,
    setConfig,
    showGrid,
    config.cellsX,
    config.cellsY,
    config.showGrid,
  ]);

  useEffect(() => {
    if (interactionMode) {
      setInteractionMode(interactionMode);
    }
  }, [setInteractionMode, interactionMode]);

  const handleGridSelection = useCallback(
    (metas: GridCellMetadata[]) => {
      if (!grid) {
        onCellSelected?.(null);
        onCellsSelected?.([]);
        return;
      }

      const resolved = metas
        .map((meta) =>
          grid.cells.find(
            (cell) => cell.x === meta.cellX && cell.y === meta.cellY,
          ),
        )
        .filter(Boolean) as GridCell[];

      if (resolved.length === 0) {
        onCellSelected?.(null);
        onCellsSelected?.([]);
        return;
      }

      onCellSelected?.(resolved[0]);
      onCellsSelected?.(resolved);

      if (resolved.length === 1) {
        onCellClick?.(resolved[0]);
      }
    },
    [grid, onCellSelected, onCellsSelected, onCellClick],
  );

  useEffect(() => {
    if (!grid || !activeCellId) {
      clearSelection();
      return;
    }

    const target = grid.cells.find((cell) => cell._id === activeCellId);
    if (!target) return;

    setSelectedCells([
      {
        cellX: target.x,
        cellY: target.y,
        index: target.y * grid.grid.width + target.x,
        selected: true,
      },
    ]);
  }, [activeCellId, clearSelection, grid, setSelectedCells]);

  const handleCanvasReady = useCallback((canvas: FabricCanvas | null) => {
    fabricCanvasRef.current = canvas;
  }, []);

  return {
    fabricCanvasRef,
    handleGridSelection,
    handleCanvasReady,
  };
}
