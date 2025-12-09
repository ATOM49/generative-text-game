'use client';
import React, { useCallback, useMemo, useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import {
  GridCell,
  World,
  type LocationForm,
  type WorldGrid,
} from '@talespin/schema';
import { MapViewer } from '@/components/map-viewer';
import { MapEditorWithToolbar } from '@/components/map-editor-with-toolbar';
import { Spinner } from '@/components/ui/spinner';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from '@/components/ui/sidebar';
import GridCellFormComponent from '@/components/form/grid-cell';
import { useSession } from 'next-auth/react';

type WorldGridResponse = {
  grid: WorldGrid;
  cells: GridCell[];
};

export default function LocationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { data: session, status } = useSession();
  const isSessionLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const canEdit = session?.user?.role === 'BUILDER';

  const { data: world, isLoading } = useApiQuery<World>(
    `/api/worlds/${id}`,
    undefined,
    {
      enabled: isAuthenticated,
    },
  );
  const { data: worldGrid, isLoading: isGridLoading } =
    useApiQuery<WorldGridResponse>(`/api/worlds/${id}/grid`, undefined, {
      enabled: isAuthenticated,
    });
  const [activeCellId, setActiveCellId] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] =
    useState<Partial<LocationForm> | null>(null);

  // Handler for when a location is created on the map
  const handleLocationCreated = (
    coordRel: { u: number; v: number },
    cell?: GridCell,
  ) => {
    if (!canEdit) return;
    const newLocation: Partial<LocationForm> = {
      name: `Location ${Date.now()}`,
      coordRel,
      gridCellId: cell?._id,
    };
    setCurrentLocation(newLocation);
  };

  const handleLocationSuccess = () => {
    if (!canEdit) return;
    setCurrentLocation(null);
  };

  const handleCellSelected = (cell: GridCell | null) => {
    setActiveCellId(cell?._id ?? null);
  };

  const handleCellClick = useCallback((cell: GridCell) => {
    // When a single cell is clicked, set it as active
    setActiveCellId(cell._id);
  }, []);

  const activeCell = useMemo(() => {
    if (!activeCellId || !worldGrid) {
      return null;
    }
    return worldGrid.cells.find((cell) => cell._id === activeCellId) || null;
  }, [activeCellId, worldGrid]);

  if (
    isSessionLoading ||
    (isLoading && !world) ||
    (isGridLoading && !worldGrid)
  ) {
    return <Spinner />;
  }

  const renderCellDetails = (cell: GridCell, onClose: () => void) => (
    <SidebarGroup>
      <SidebarGroupLabel>Grid Cell Details</SidebarGroupLabel>
      <SidebarGroupContent>
        <div className="space-y-3 rounded-md border p-3 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Coordinates</span>
            <span className="font-medium">
              ({cell.x}, {cell.y})
            </span>
          </div>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            Clear selection
          </button>
        </div>
        {canEdit && (
          <GridCellFormComponent
            cell={cell}
            onSuccess={() => {
              // Optional: show toast or other feedback
            }}
          />
        )}
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      <div className="flex-1 min-h-0">
        {canEdit ? (
          <MapEditorWithToolbar
            imageUrl={world?.mapImageUrl || ''}
            grid={worldGrid}
            activeCellId={activeCellId}
            onCellSelected={handleCellSelected}
            onCellClick={handleCellClick}
            onLocationCreated={handleLocationCreated}
            renderCellDetails={renderCellDetails}
          />
        ) : (
          <MapViewer
            imageUrl={world?.mapImageUrl || ''}
            grid={worldGrid}
            activeCellId={activeCellId}
            onCellSelected={handleCellSelected}
            onCellClick={handleCellClick}
            showGrid={true}
          />
        )}
      </div>
    </div>
  );
}
