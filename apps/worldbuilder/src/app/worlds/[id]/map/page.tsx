'use client';
import React, { useState } from 'react';
import { EntityLayout } from '@/components/entity-layout';
import { useApiQuery } from '@/hooks/useApiQuery';
import { World, RegionForm } from '@talespin/schema';
import { CopilotTextarea } from '@copilotkit/react-textarea';
import { Button } from '@/components/ui/button';
import MapEditor from '@/components/map-editor';

export default function LocationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const { data: world, isLoading } = useApiQuery<World>(`/api/worlds/${id}`);

  // State for region creation workflow
  const [isCreatingRegion, setIsCreatingRegion] = useState(false);
  const [activatePolygonTool, setActivatePolygonTool] = useState(false);
  const [currentRegion, setCurrentRegion] = useState<RegionForm | null>(null);

  // Handler for when "Add Region" is clicked
  const handleAddRegion = () => {
    setIsCreatingRegion(true);
    setActivatePolygonTool(true);
  };

  // Handler for when polygon tool is activated
  const handlePolygonToolActivated = () => {
    setActivatePolygonTool(false); // Reset the trigger
  };

  // Handler for when a region polygon is created on the map
  const handleRegionCreated = (boundary: [number, number][]) => {
    const newRegion: RegionForm = {
      name: `Region ${Date.now()}`,
      boundary,
      terrain: '',
      climate: '',
    };
    setCurrentRegion(newRegion);
  };

  // Handler for confirming the region
  const handleConfirmRegion = () => {
    // Region is already in the form, just clean up the creation state
    setCurrentRegion(null);
    setIsCreatingRegion(false);
  };

  // Handler for canceling region creation
  const handleCancelCreate = () => {
    setCurrentRegion(null);
    setIsCreatingRegion(false);
    setActivatePolygonTool(false);
  };

  // const createMap = useApiMutation<WorldMap, Partial<WorldMap>>(
  //   'POST',
  //   '/api/world_map',
  //   undefined,
  //   { onSuccess: () => form.reset() },
  // );

  // const { data: worldMapImage } = useApiQuery<string>(
  //   `/api/world_map?worldId=${id}`,
  // );

  return (
    <EntityLayout
      header={`Map of the World: ${id}`}
      subheader="List and manage locations for this world here."
      left={
        <MapEditor
          imageUrl={world?.mapImageUrl || ''}
          onRegionCreated={handleRegionCreated}
          onPolygonToolActivated={handlePolygonToolActivated}
          activatePolygonTool={activatePolygonTool}
        />
      }
    >
      <CopilotTextarea
        defaultValue={world?.description}
        autosuggestionsConfig={{
          textareaPurpose: `Describe the world map's high-level features like the type of world based on the world thme being ${world?.theme}`,
          chatApiConfigs: {
            suggestionsApiConfig: {
              maxTokens: 100,
            },
          },
        }}
        rows={3}
      />
      {/* <RegionList
        regions={world?.regions}
        onRegionUpdated={() => {
          console.log('Region updated');
        }}
        onAddRegion={handleAddRegion}
        isCreatingRegion={isCreatingRegion}
        onCancelCreate={handleCancelCreate}
        onConfirmCreate={handleConfirmRegion}
        currentRegion={currentRegion}
      /> */}

      <Button type="submit" disabled={false}>
        Save Map
      </Button>
    </EntityLayout>
  );
}
