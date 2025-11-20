'use client';
import React, { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { World, RegionForm, LocationForm } from '@talespin/schema';
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
import RegionFormComponent from '@/components/form/region';
import LocationFormComponent from '@/components/form/location';

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

  // Mutation for editing image with region data
  const editImageMutation = useApiMutation<
    { imageUrl: string; key: string; meta: any },
    { region: any; imageUrl: string }
  >('POST', '/api/images/edit', undefined, {
    onSuccess: (result) => {
      console.log('Image edited successfully:', result.imageUrl);
      // Clear form and state
      setCurrentRegion(null);
    },
    onError: (error) => {
      console.error('Failed to edit image:', error);
      alert(error.message || 'Failed to edit image');
    },
  });

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

  const handleRegionSubmit = (regionData: any) => {
    if (!world?.mapImageUrl) {
      console.error('Missing image URL');
      return;
    }

    // Call the mutation with complete region data (polygon will be extracted from region.geom on server)
    editImageMutation.mutate({
      region: regionData,
      imageUrl: world.mapImageUrl,
    });
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

  // Only show right sidebar when there's a region or location being created/edited
  const showRightSidebar = currentRegion !== null || currentLocation !== null;

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
              Create and manage regions and locations
            </p>
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          <MapEditor
            imageUrl={world?.mapImageUrl || ''}
            onRegionCreated={handleRegionCreated}
            onLocationCreated={handleLocationCreated}
          />
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
                    onSubmit={handleRegionSubmit}
                    isSubmitting={editImageMutation.isPending}
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
    </>
  );
}
