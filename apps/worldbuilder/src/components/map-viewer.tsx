'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FabricGrid } from '@/components/FabricGrid/FabricGrid';
import type { GridCellVisual } from '@/components/FabricGrid/types';
import { useGridSync } from '@/components/map-common/useGridSync';
import type { GridCell, WorldGrid } from '@talespin/schema';

interface MapViewerProps {
  imageUrl: string;
  grid?: {
    grid: Pick<WorldGrid, '_id' | 'width' | 'height' | 'homeCellId'>;
    cells: GridCell[];
  };
  activeCellId?: string | null;
  selectedCellIds?: string[];
  onCellClick?: (cell: GridCell) => void;
  onCellSelected?: (cell: GridCell | null) => void;
  onCellsSelected?: (cells: GridCell[]) => void;
  showGrid?: boolean;
  fogEnabled?: boolean;
  homeCellId?: string;
  revealedCellIds?: string[];
  cellVisuals?: Record<number, GridCellVisual>;
}

const EMPTY_REVEALED_CELL_IDS: string[] = [];

export function MapViewer({
  imageUrl,
  grid,
  activeCellId,
  selectedCellIds,
  onCellClick,
  onCellSelected,
  onCellsSelected,
  showGrid = true,
  fogEnabled = false,
  homeCellId,
  revealedCellIds = EMPTY_REVEALED_CELL_IDS,
  cellVisuals,
}: MapViewerProps) {
  const resolvedHomeCellId = homeCellId ?? grid?.grid.homeCellId ?? null;
  const gridId = grid?.grid._id ?? null;
  const [internalRevealed, setInternalRevealed] = useState<string[]>([]);
  const previousGridIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!fogEnabled) {
      previousGridIdRef.current = gridId;
      setInternalRevealed([]);
      return;
    }
    if (gridId && previousGridIdRef.current !== gridId) {
      previousGridIdRef.current = gridId;
      setInternalRevealed(resolvedHomeCellId ? [resolvedHomeCellId] : []);
      return;
    }
    if (!gridId) {
      previousGridIdRef.current = null;
      setInternalRevealed(resolvedHomeCellId ? [resolvedHomeCellId] : []);
      return;
    }
    if (resolvedHomeCellId) {
      setInternalRevealed((prev) => {
        if (prev.includes(resolvedHomeCellId)) {
          return prev;
        }
        return [...prev, resolvedHomeCellId];
      });
    }
  }, [fogEnabled, gridId, resolvedHomeCellId]);

  const revealCells = useCallback(
    (cells?: GridCell | GridCell[] | null) => {
      if (!fogEnabled || !cells) return;
      const list = Array.isArray(cells) ? cells : [cells];
      if (!list.length) return;
      setInternalRevealed((prev) => {
        const next = new Set(prev);
        list.forEach((cell) => {
          if (cell?._id) {
            next.add(cell._id);
          }
        });
        return Array.from(next);
      });
    },
    [fogEnabled],
  );

  const handleFogAwareCellClick = useCallback(
    (cell: GridCell) => {
      revealCells(cell);
      onCellClick?.(cell);
    },
    [onCellClick, revealCells],
  );

  const handleFogAwareCellSelected = useCallback(
    (cell: GridCell | null) => {
      if (cell) {
        revealCells(cell);
      }
      onCellSelected?.(cell);
    },
    [onCellSelected, revealCells],
  );

  const handleFogAwareCellsSelected = useCallback(
    (cells: GridCell[]) => {
      revealCells(cells);
      onCellsSelected?.(cells);
    },
    [onCellsSelected, revealCells],
  );

  const { handleGridSelection, handleCanvasReady } = useGridSync({
    imageUrl,
    grid,
    activeCellId,
    selectedCellIds,
    showGrid,
    interactionMode: 'grid',
    onCellClick: handleFogAwareCellClick,
    onCellSelected: handleFogAwareCellSelected,
    onCellsSelected: handleFogAwareCellsSelected,
  });

  const defaultRevealedIds = useMemo(() => {
    const ids = new Set<string>();
    internalRevealed.forEach((id) => ids.add(id));
    revealedCellIds.forEach((id) => {
      if (id) ids.add(id);
    });
    return Array.from(ids);
  }, [internalRevealed, revealedCellIds]);

  const revealedCellIndices = useMemo(() => {
    if (!fogEnabled || !grid?.cells?.length || defaultRevealedIds.length === 0)
      return [];
    const width = grid.grid.width || 1;
    const revealedSet = new Set(defaultRevealedIds);
    return grid.cells
      .filter((cell) => revealedSet.has(cell._id))
      .map((cell) => cell.y * width + cell.x);
  }, [defaultRevealedIds, fogEnabled, grid]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-100">
      <div className="h-full w-full">
        <FabricGrid
          className="h-full w-full"
          onCellSelect={handleGridSelection}
          onReady={handleCanvasReady}
          onBackgroundError={(error) =>
            console.error('Map image error:', error)
          }
          fogEnabled={fogEnabled}
          revealedCellIndices={fogEnabled ? revealedCellIndices : undefined}
          cellVisuals={cellVisuals}
        />
      </div>
    </div>
  );
}
