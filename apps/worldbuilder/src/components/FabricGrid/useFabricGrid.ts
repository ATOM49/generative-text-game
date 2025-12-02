'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Canvas as FabricCanvas,
  Image as FabricImage,
  Point as FabricPoint,
  Rect as FabricRect,
} from 'fabric';
import type { TPointerEventInfo } from 'fabric';
import { useGridStore, type GridState } from '@/state/useGridStore';
import type { GridCellMetadata, UseFabricGridOptions } from './types';
import { type CanvasSize, getCellIndex, pointerToCell } from '@/utils/gridMath';

export function useFabricGrid({
  onCellSelect,
  onBackgroundError,
}: UseFabricGridOptions = {}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const cellsRef = useRef<GridCellMetadata[]>([]);
  const cellsByIndexRef = useRef<Map<number, GridCellMetadata>>(new Map());
  const regionRectRef = useRef<FabricRect | null>(null);
  const [isReady, setIsReady] = useState(false);

  const config = useGridStore((state: GridState) => state.config);
  const worldImageUrl = useGridStore((state: GridState) => state.worldImageUrl);
  const selectedCells = useGridStore((state: GridState) => state.selectedCells);
  const toggleCell = useGridStore((state: GridState) => state.toggleCell);
  const setSelectedCells = useGridStore(
    (state: GridState) => state.setSelectedCells,
  );
  const setRegion = useGridStore((state: GridState) => state.setRegion);

  const [canvasSize, setCanvasSize] = useState<CanvasSize>({
    width: config.width,
    height: config.height,
  });

  useEffect(() => {
    setCanvasSize({ width: config.width, height: config.height });
  }, [config.height, config.width]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = new FabricCanvas(canvasRef.current, {
      selection: false,
      preserveObjectStacking: true,
      renderOnAddRemove: true,
    });

    fabricRef.current = canvas;
    setIsReady(true);

    return () => {
      setIsReady(false);
      cellsRef.current = [];
      cellsByIndexRef.current.clear();
      regionRectRef.current = null;
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.setWidth(canvasSize.width);
    canvas.setHeight(canvasSize.height);
    canvas.requestRenderAll();
  }, [canvasSize.height, canvasSize.width]);

  const rebuildGrid = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    cellsRef.current.forEach((cell) => {
      if (cell.rect) {
        canvas.remove(cell.rect);
      }
    });
    cellsRef.current = [];
    cellsByIndexRef.current.clear();

    const { cellsX, cellsY, showGrid } = config;
    if (cellsX <= 0 || cellsY <= 0) {
      return;
    }

    const cellWidth = canvasSize.width / cellsX;
    const cellHeight = canvasSize.height / cellsY;

    for (let x = 0; x < cellsX; x += 1) {
      for (let y = 0; y < cellsY; y += 1) {
        const index = getCellIndex(x, y, cellsX);
        const rect = new FabricRect({
          left: x * cellWidth,
          top: y * cellHeight,
          width: cellWidth,
          height: cellHeight,
          fill: 'rgba(255,255,255,0)',
          stroke: showGrid ? 'rgba(255,255,255,0.25)' : undefined,
          strokeWidth: showGrid ? 1 : 0,
          selectable: false,
          evented: true,
          hoverCursor: 'pointer',
        });

        const metadata: GridCellMetadata = {
          cellX: x,
          cellY: y,
          index,
          rect,
          selected: false,
        };

        rect.on('mouseover', () => {
          if (useGridStore.getState().interactionMode !== 'grid') return;
          if (!metadata.selected) {
            rect.set('fill', 'rgba(59,130,246,0.18)');
            canvas.requestRenderAll();
          }
        });

        rect.on('mouseout', () => {
          if (!metadata.selected) {
            rect.set('fill', 'rgba(255,255,255,0)');
            canvas.requestRenderAll();
          }
        });

        rect.on('mousedown', (event: TPointerEventInfo) => {
          if (useGridStore.getState().interactionMode !== 'grid') return;
          const multi =
            event.e?.shiftKey || event.e?.metaKey || event.e?.ctrlKey;
          if (multi) {
            toggleCell(metadata);
          } else {
            setSelectedCells([metadata]);
          }
          onCellSelect?.(useGridStore.getState().selectedCells);
        });

        canvas.add(rect);
        cellsRef.current.push(metadata);
        cellsByIndexRef.current.set(index, metadata);
      }
    }

    canvas.requestRenderAll();
  }, [
    canvasSize.height,
    canvasSize.width,
    config,
    onCellSelect,
    setSelectedCells,
    toggleCell,
  ]);

  useEffect(() => {
    rebuildGrid();
  }, [rebuildGrid]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const selectedIndices = new Set(
      selectedCells.map((cell: GridCellMetadata) => cell.index),
    );
    cellsByIndexRef.current.forEach((metadata, index) => {
      const isSelected = selectedIndices.has(index);
      metadata.selected = isSelected;
      metadata.rect?.set(
        'fill',
        isSelected ? 'rgba(37,99,235,0.4)' : 'rgba(255,255,255,0)',
      );
    });
    canvas.requestRenderAll();
  }, [selectedCells]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    if (!worldImageUrl) {
      canvas.backgroundImage = undefined;
      canvas.requestRenderAll();
      return;
    }

    let disposed = false;
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (disposed || !fabricRef.current) return;
      const background = new FabricImage(img, {
        selectable: false,
        evented: false,
      });

      const scaleX = canvasSize.width / img.width;
      const scaleY = canvasSize.height / img.height;
      const scale = Math.min(scaleX, scaleY);
      background.scale(scale);
      background.set({
        left: (canvasSize.width - img.width * scale) / 2,
        top: (canvasSize.height - img.height * scale) / 2,
      });

      canvas.backgroundImage = background;
      canvas.requestRenderAll();
    };

    img.onerror = () => {
      onBackgroundError?.(new Error('Failed to load grid background image.'));
    };

    img.src = worldImageUrl;

    return () => {
      disposed = true;
    };
  }, [canvasSize.height, canvasSize.width, onBackgroundError, worldImageUrl]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    if (!canvasRef.current?.parentElement) return;

    const container = canvasRef.current.parentElement;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const containerWidth = entry.contentRect.width;
      if (!containerWidth) return;
      const aspect = config.height / config.width || 0.75;
      const nextHeight = containerWidth * aspect;
      setCanvasSize((prev) => {
        if (
          Math.abs(prev.width - containerWidth) < 0.5 &&
          Math.abs(prev.height - nextHeight) < 0.5
        ) {
          return prev;
        }
        return { width: containerWidth, height: nextHeight };
      });
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, [config.height, config.width]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    let dragStart: FabricPoint | null = null;

    const ensureRegionRect = () => {
      if (!regionRectRef.current) {
        regionRectRef.current = new FabricRect({
          fill: 'rgba(37,99,235,0.15)',
          stroke: 'rgba(37,99,235,0.7)',
          strokeDashArray: [4, 2],
          selectable: false,
          evented: false,
          visible: false,
          excludeFromExport: true,
        });
        canvas.add(regionRectRef.current);
      }
      return regionRectRef.current;
    };

    const handleMouseDown = (event: TPointerEventInfo) => {
      if (useGridStore.getState().interactionMode !== 'grid') {
        return;
      }
      if (event.target) {
        dragStart = null;
        return;
      }
      dragStart = canvas.getPointer(event.e);
      const rect = ensureRegionRect();
      rect.set({
        left: dragStart.x,
        top: dragStart.y,
        width: 0,
        height: 0,
        visible: true,
      });
    };

    const handleMouseMove = (event: TPointerEventInfo) => {
      if (!dragStart || !regionRectRef.current) return;
      if (useGridStore.getState().interactionMode !== 'grid') return;
      const pointer = canvas.getPointer(event.e);
      const left = Math.min(pointer.x, dragStart.x);
      const top = Math.min(pointer.y, dragStart.y);
      regionRectRef.current.set({
        left,
        top,
        width: Math.abs(pointer.x - dragStart.x),
        height: Math.abs(pointer.y - dragStart.y),
      });
      canvas.requestRenderAll();
    };

    const handleMouseUp = (event: TPointerEventInfo) => {
      if (!dragStart || !regionRectRef.current) return;
      if (useGridStore.getState().interactionMode !== 'grid') {
        dragStart = null;
        regionRectRef.current.set({ visible: false });
        canvas.requestRenderAll();
        return;
      }

      const pointer = canvas.getPointer(event.e);
      const left = Math.min(pointer.x, dragStart.x);
      const top = Math.min(pointer.y, dragStart.y);
      const width = Math.abs(pointer.x - dragStart.x);
      const height = Math.abs(pointer.y - dragStart.y);

      if (width < 2 && height < 2) {
        regionRectRef.current.set({ visible: false });
        dragStart = null;
        canvas.requestRenderAll();
        return;
      }

      const startCell = pointerToCell({ x: left, y: top }, config, canvasSize);
      const endCell = pointerToCell(
        { x: left + width, y: top + height },
        config,
        canvasSize,
      );

      setRegion(startCell, endCell);

      const selectedRegionCells: GridCellMetadata[] = [];
      cellsRef.current.forEach((cell) => {
        if (
          cell.cellX >= startCell.x &&
          cell.cellX <= endCell.x &&
          cell.cellY >= startCell.y &&
          cell.cellY <= endCell.y
        ) {
          selectedRegionCells.push(cell);
        }
      });

      setSelectedCells(selectedRegionCells);
      onCellSelect?.(selectedRegionCells);

      regionRectRef.current.set({ visible: false });
      dragStart = null;
      canvas.requestRenderAll();
    };

    canvas.on('mouse:down', handleMouseDown);
    canvas.on('mouse:move', handleMouseMove);
    canvas.on('mouse:up', handleMouseUp);

    return () => {
      canvas.off('mouse:down', handleMouseDown);
      canvas.off('mouse:move', handleMouseMove);
      canvas.off('mouse:up', handleMouseUp);
    };
  }, [canvasSize, config, onCellSelect, setRegion, setSelectedCells]);

  return useMemo(
    () => ({
      canvasRef,
      fabricRef,
      isReady,
      canvasSize,
    }),
    [canvasSize, isReady],
  );
}
