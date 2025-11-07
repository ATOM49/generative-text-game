'use client';
import React, { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { World, RegionForm, LocationForm } from '@talespin/schema';
import MapEditor from '@/components/map-editor';
import { Spinner } from '@/components/ui/spinner';
import { withHeader } from '@/components/withHeader';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarProvider,
} from '@/components/ui/sidebar';
import RegionFormComponent from '@/components/form/region';
import LocationFormComponent from '@/components/form/location';

// Create a wrapped version of MapEditor with header
const MapEditorWithHeader = withHeader(MapEditor);

export default function LocationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { data: world, isLoading } = useApiQuery<World>(`/api/worlds/${id}`);

  // State for region creation workflow
  const [currentRegion, setCurrentRegion] =
    useState<Partial<RegionForm> | null>(null);
  const [currentLocation, setCurrentLocation] =
    useState<Partial<LocationForm> | null>(null);

  // Handler for when a region polygon is created on the map
  const handleRegionCreated = (geom: { outer: { u: number; v: number }[] }) => {
    const newRegion: Partial<RegionForm> = {
      name: `Region ${Date.now()}`,
      geom,
    };
    setCurrentRegion(newRegion);
    setCurrentLocation(null); // Clear location form
  };

  // Handler for when a location is created on the map
  const handleLocationCreated = (coordRel: { u: number; v: number }) => {
    const newLocation: Partial<LocationForm> = {
      name: `Location ${Date.now()}`,
      coordRel,
    };
    setCurrentLocation(newLocation);
    setCurrentRegion(null); // Clear region form
  };

  const handleRegionSuccess = () => {
    setCurrentRegion(null);
  };

  const handleLocationSuccess = () => {
    setCurrentLocation(null);
  };

  if (isLoading && !world) {
    return <Spinner />;
  }

  // Only show sidebar when there's a region or location being created/edited
  const showSidebar = currentRegion !== null || currentLocation !== null;

  return (
    <SidebarProvider defaultOpen={showSidebar} open={showSidebar}>
      <div className="flex w-full h-full">
        <div className="flex-1 min-w-0">
          <MapEditorWithHeader
            header={isLoading ? 'Loading...' : `Map of ${world?.name || ''}`}
            subheader="Create and manage regions and locations"
            imageUrl={world?.mapImageUrl || ''}
            onRegionCreated={handleRegionCreated}
            onLocationCreated={handleLocationCreated}
          />
        </div>
        {showSidebar && (
          <Sidebar side="right" className="border-l" collapsible="none">
            <SidebarHeader>
              <h2 className="text-lg font-semibold">
                {currentRegion ? 'New Region' : 'New Location'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {currentRegion
                  ? 'Configure the region details'
                  : 'Configure the location details'}
              </p>
            </SidebarHeader>
            <SidebarContent>
              {currentRegion && (
                <SidebarGroup>
                  <SidebarGroupLabel>Region Details</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <RegionFormComponent
                      worldId={id}
                      defaultValues={currentRegion}
                      onSuccess={handleRegionSuccess}
                    />
                  </SidebarGroupContent>
                </SidebarGroup>
              )}
              {currentLocation && (
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
      </div>
    </SidebarProvider>
  );
}
