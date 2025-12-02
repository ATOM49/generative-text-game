'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useFabricGrid } from './useFabricGrid';
import type { FabricGridProps } from './types';

export function FabricGrid({
  className,
  style,
  onCellSelect,
  onReady,
  onBackgroundError,
}: FabricGridProps) {
  const { canvasRef, fabricRef, isReady } = useFabricGrid({
    onCellSelect,
    onBackgroundError,
  });

  useEffect(() => {
    if (!onReady) return;
    onReady(isReady ? fabricRef.current : null);
  }, [fabricRef, isReady, onReady]);

  return (
    <div className={cn('relative h-full w-full', className)} style={style}>
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
