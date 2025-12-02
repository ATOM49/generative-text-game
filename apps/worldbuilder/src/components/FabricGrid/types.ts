'use client';

import type { CSSProperties } from 'react';
import type { Canvas, Rect } from 'fabric';
import type {
  GridConfig,
  GridCellMetadata as BaseGridCellMetadata,
  RegionSelection,
} from '@talespin/schema';

// Export schema types
export type { GridConfig, RegionSelection };

// Extend GridCellMetadata with Fabric-specific rect property
export interface GridCellMetadata extends BaseGridCellMetadata {
  rect?: Rect;
}

export type OnCellClick = (cells: GridCellMetadata[]) => void;

export interface FabricGridProps {
  className?: string;
  style?: CSSProperties;
  onCellSelect?: OnCellClick;
  onReady?: (canvas: Canvas | null) => void;
  onBackgroundError?: (error: Error) => void;
}

export interface UseFabricGridOptions {
  onCellSelect?: OnCellClick;
  onBackgroundError?: (error: Error) => void;
}
