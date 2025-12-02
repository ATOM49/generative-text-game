'use client';
import React, { useMemo, useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import {
  GridCell,
  World,
  type LocationForm,
  type WorldGrid,
} from '@talespin/schema';
import MapEditor from '@/components/map-editor';
import { Spinner } from '@/components/ui/spinner';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import LocationFormComponent from '@/components/form/location';
import GridCellFormComponent from '@/components/form/grid-cell';
import { useSession } from 'next-auth/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

  // Only show right sidebar when there's a cell selected or a location being created
  const showRightSidebar = activeCell !== null || currentLocation !== null;

  return (
    <>
      <SidebarInset className="flex flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">
              {isLoading ? 'Loading...' : `Map of ${world?.name || ''}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              Explore the world grid, inspect cells, and place locations
            </p>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
          {!canEdit && (
            <Alert className="mb-4">
              <AlertTitle>Explorer access</AlertTitle>
              <AlertDescription>
                You can inspect the map and cells, but only builders can edit
                terrain or add locations.
              </AlertDescription>
            </Alert>
          )}
          <div className="flex-1 min-h-0">
            <MapEditor
              imageUrl={world?.mapImageUrl || ''}
              grid={worldGrid}
              activeCellId={activeCellId}
              onCellSelected={handleCellSelected}
              onLocationCreated={canEdit ? handleLocationCreated : undefined}
              canEdit={canEdit}
            />
          </div>
        </div>
      </SidebarInset>
      {showRightSidebar && (
        <Sidebar
          side="right"
          variant="sidebar"
          collapsible="none"
          className="border-l"
        >
          <SidebarHeader>
            <h2 className="text-lg font-semibold">
              {activeCell
                ? `Cell (${activeCell.x}, ${activeCell.y})`
                : 'New Location'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {activeCell
                ? 'Review the selected grid cell'
                : 'Configure the location details'}
            </p>
          </SidebarHeader>
          <SidebarContent>
            {activeCell && (
              <SidebarGroup>
                <SidebarGroupLabel>Grid Cell Details</SidebarGroupLabel>
                <SidebarGroupContent>
                  <div className="space-y-3 rounded-md border p-3 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Coordinates</span>
                      <span className="font-medium">
                        ({activeCell.x}, {activeCell.y})
                      </span>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setActiveCellId(null)}
                    >
                      Clear selection
                    </button>
                  </div>
                  {canEdit ? (
                    <GridCellFormComponent
                      cell={activeCell}
                      onSuccess={() => {
                        // Optional: show toast or other feedback
                      }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Builder role required to edit grid metadata.
                    </p>
                  )}
                </SidebarGroupContent>
              </SidebarGroup>
            )}
            {canEdit && currentLocation && (
              <SidebarGroup>
                <SidebarGroupLabel>Location Details</SidebarGroupLabel>
                <SidebarGroupContent>
                  <LocationFormComponent
                    worldId={id}
                    defaultValues={currentLocation}
                    onSuccess={handleLocationSuccess}
                  />
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>
        </Sidebar>
      )}
    </>
  );
}
