'use client';

import { FabricGrid } from '@/components/FabricGrid/FabricGrid';
import { useGridSync } from '@/components/map-common/useGridSync';
import type { GridCell, WorldGrid } from '@talespin/schema';

interface MapViewerProps {
  imageUrl: string;
  grid?: {
    grid: Pick<WorldGrid, 'width' | 'height'>;
    cells: GridCell[];
  };
  activeCellId?: string | null;
  onCellClick?: (cell: GridCell) => void;
  onCellSelected?: (cell: GridCell | null) => void;
  onCellsSelected?: (cells: GridCell[]) => void;
  showGrid?: boolean;
}

export function MapViewer({
  imageUrl,
  grid,
  activeCellId,
  onCellClick,
  onCellSelected,
  onCellsSelected,
  showGrid = true,
}: MapViewerProps) {
  const { handleGridSelection, handleCanvasReady } = useGridSync({
    imageUrl,
    grid,
    activeCellId,
    showGrid,
    interactionMode: 'grid',
    onCellClick,
    onCellSelected,
    onCellsSelected,
  });

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
        />
      </div>
    </div>
  );
}
