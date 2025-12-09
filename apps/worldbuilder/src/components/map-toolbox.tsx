'use client';

import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface MapToolboxProps {
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  onExport: () => void;
}

export function MapToolbox({
  tool,
  onToolChange,
  showGrid,
  onToggleGrid,
  onExport,
}: MapToolboxProps) {
  return (
    <div className="pointer-events-auto z-20 flex flex-col gap-3 rounded border border-slate-200 bg-white/90 p-3 text-sm font-semibold text-slate-900 shadow-lg backdrop-blur-md">
      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Tools
      </span>
      <div className="flex flex-col gap-2">
        <Button
          variant={tool === 'location' ? 'default' : 'outline'}
          className="justify-start"
          size="sm"
          onClick={() => onToolChange('location')}
        >
          <MapPin className="mr-2 h-4 w-4" />
          Add Location
        </Button>
        <Button
          variant={tool === 'select' ? 'default' : 'outline'}
          className="justify-start"
          size="sm"
          onClick={() => onToolChange('select')}
        >
          Select
        </Button>
      </div>
      <Separator className="border-slate-200" />
      <Button onClick={onToggleGrid} size="sm" variant="outline">
        {showGrid ? 'Hide Grid' : 'Show Grid'}
      </Button>
      <Button onClick={onExport} size="sm" variant="outline">
        Export Grid JSON
      </Button>
    </div>
  );
}

export type Tool = 'select' | 'location';
