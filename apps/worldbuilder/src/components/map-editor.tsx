'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GridCell, WorldGrid, TRelCoord } from '@talespin/schema';
import {
  Canvas as FabricCanvas,
  Circle as FabricCircle,
  type TPointerEventInfo,
} from 'fabric';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FabricGrid } from '@/components/FabricGrid/FabricGrid';
import type { GridCellMetadata } from '@/components/FabricGrid/types';
import { useGridStore, type GridState } from '@/state/useGridStore';

type Tool = 'select' | 'location';

interface RelativeShape {
  id: string;
  type: 'dot';
  points: TRelCoord[];
}

interface MapGridData {
  grid: Pick<WorldGrid, 'width' | 'height'>;
  cells: GridCell[];
}

interface MapEditorProps {
  imageUrl: string;
  grid?: MapGridData;
  activeCellId?: string | null;
  onCellSelected?: (cell: GridCell | null) => void;
  onCellsSelected?: (cells: GridCell[]) => void;
  onLocationCreated?: (
    coordRel: { u: number; v: number },
    cell?: GridCell,
  ) => void;
}

const DEFAULT_CANVAS_WIDTH = 1024;

export default function MapEditor({
  imageUrl,
  grid,
  activeCellId,
  onCellSelected,
  onCellsSelected,
  onLocationCreated,
}: MapEditorProps) {
  const [tool, setTool] = useState<Tool>('select');
  const [imageError, setImageError] = useState<string | null>(null);
  const [shapes, setShapes] = useState<RelativeShape[]>([]);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const shapeObjectsRef = useRef<Record<string, FabricCircle>>({});

  const config = useGridStore((state: GridState) => state.config);
  const setConfig = useGridStore((state: GridState) => state.setConfig);
  const setWorldImage = useGridStore((state: GridState) => state.setWorldImage);
  const setSelectedCells = useGridStore(
    (state: GridState) => state.setSelectedCells,
  );
  const clearSelection = useGridStore(
    (state: GridState) => state.clearSelection,
  );
  const serializeForMongo = useGridStore(
    (state: GridState) => state.serializeForMongo,
  );
  const setInteractionMode = useGridStore(
    (state: GridState) => state.setInteractionMode,
  );

  useEffect(() => {
    setWorldImage(imageUrl);
    setImageError(null);
  }, [imageUrl, setWorldImage]);

  useEffect(() => {
    if (!grid) return;
    const aspectRatio = grid.grid.height / grid.grid.width || 0.75;
    setConfig({
      cellsX: grid.grid.width,
      cellsY: grid.grid.height,
      width: DEFAULT_CANVAS_WIDTH,
      height: Math.round(DEFAULT_CANVAS_WIDTH * aspectRatio),
    });
  }, [grid, setConfig]);

  useEffect(() => {
    setInteractionMode(tool === 'location' ? 'location' : 'grid');
  }, [setInteractionMode, tool]);

  const resolveCellFromRelative = useCallback(
    (point: TRelCoord): GridCell | undefined => {
      if (!grid) return undefined;
      const clampedX = Math.max(
        0,
        Math.min(grid.grid.width - 1, Math.floor(point.u * grid.grid.width)),
      );
      const clampedY = Math.max(
        0,
        Math.min(grid.grid.height - 1, Math.floor(point.v * grid.grid.height)),
      );
      return grid.cells.find(
        (cell) => cell.x === clampedX && cell.y === clampedY,
      );
    },
    [grid],
  );

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
    },
    [grid, onCellSelected, onCellsSelected],
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

  const toRelative = useCallback(
    (point: { x: number; y: number }): TRelCoord => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return { u: 0, v: 0 };
      const width = canvas.getWidth() || 1;
      const height = canvas.getHeight() || 1;
      return { u: point.x / width, v: point.y / height };
    },
    [],
  );

  const toAbsolute = useCallback((point: TRelCoord) => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    return {
      x: point.u * (canvas.getWidth() || 1),
      y: point.v * (canvas.getHeight() || 1),
    };
  }, []);

  const redrawShapes = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    Object.values(shapeObjectsRef.current).forEach((shape) => {
      canvas.remove(shape);
    });
    shapeObjectsRef.current = {};

    shapes.forEach((shape) => {
      if (shape.points.length === 0) return;
      const absolutePoint = toAbsolute(shape.points[0]);
      const circle = new FabricCircle({
        left: absolutePoint.x - 4,
        top: absolutePoint.y - 4,
        radius: 4,
        fill: '#dc2626',
        selectable: false,
        evented: false,
      });
      shapeObjectsRef.current[shape.id] = circle;
      canvas.add(circle);
    });

    canvas.requestRenderAll();
  }, [shapes, toAbsolute]);

  useEffect(() => {
    redrawShapes();
  }, [redrawShapes]);

  const handleCanvasReady = useCallback(
    (canvas: FabricCanvas | null) => {
      fabricCanvasRef.current = canvas;
      if (canvas) {
        redrawShapes();
      }
    },
    [redrawShapes],
  );

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const handleLocationClick = (event: TPointerEventInfo) => {
      if (tool !== 'location') return;

      const pointer = event.pointer || { x: 0, y: 0 };
      const relative = toRelative(pointer);

      const newShape: RelativeShape = {
        id: crypto.randomUUID(),
        type: 'dot',
        points: [relative],
      };

      const circle = new FabricCircle({
        left: pointer.x - 4,
        top: pointer.y - 4,
        radius: 4,
        fill: '#dc2626',
        selectable: false,
        evented: false,
      });

      canvas.add(circle);
      shapeObjectsRef.current[newShape.id] = circle;
      setShapes((prev) => [...prev, newShape]);

      const targetCell = resolveCellFromRelative(relative);
      if (targetCell) {
        onCellSelected?.(targetCell);
      }

      onLocationCreated?.(relative, targetCell);

      setTool('select');
    };

    canvas.on('mouse:down', handleLocationClick);

    return () => {
      canvas.off('mouse:down', handleLocationClick);
    };
  }, [
    onLocationCreated,
    onCellSelected,
    resolveCellFromRelative,
    toRelative,
    tool,
  ]);

  const handleSerialize = useCallback(() => {
    const payload = serializeForMongo();
    console.info('[grid] serialized payload', payload);
  }, [serializeForMongo]);

  const toolbarHint = useMemo(() => {
    if (tool === 'location') {
      return 'Click on the map to drop a location marker';
    }
    if (!grid) return 'Grid data is not available for this world yet';
    return 'Click or drag to select cells';
  }, [grid, tool]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-gray-100">
      {imageError && (
        <div className="absolute left-4 right-4 top-20 z-20 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          <strong className="font-semibold">Error:</strong> {imageError}
        </div>
      )}

      <div className="absolute left-4 top-4 z-10 flex min-w-[280px] flex-col gap-3 rounded bg-white p-4 shadow-lg">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={tool === 'location' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTool('location')}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Add Location
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTool('select')}>
            Select
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfig({ showGrid: !config.showGrid })}
          >
            {config.showGrid ? 'Hide Grid' : 'Show Grid'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleSerialize}>
            Export Grid JSON
          </Button>
        </div>
        <span className="text-sm text-muted-foreground">{toolbarHint}</span>
      </div>

      <div className="h-full w-full">
        <FabricGrid
          className="h-full w-full"
          onCellSelect={handleGridSelection}
          onReady={handleCanvasReady}
          onBackgroundError={(error) => setImageError(error.message)}
        />
      </div>
    </div>
  );
}
