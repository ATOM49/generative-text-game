'use client';
import React, { useState } from 'react';
import { EntityLayout } from '@/components/entity-layout';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import {
  World,
  WorldMap,
  WorldMapFormSchema,
  RegionForm,
} from '@talespin/schema';
import { CopilotTextarea } from '@copilotkit/react-textarea';
import { useForm, useFormContext, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { RegionList } from './RegionList';
import MapEditor from '@/components/map-editor.tsx';

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

  const form = useForm({
    resolver: zodResolver(WorldMapFormSchema),
    defaultValues: {
      worldId: id,
      description: '',
      regions: [],
    },
  });

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
      name: `Region ${(form.getValues('regions')?.length || 0) + 1}`,
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
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          // createMap.mutate({
          //   ...values,
          //   regions: values.regions?.map((region: any) => ({
          //     id: region.id ?? crypto.randomUUID(),
          //     ...region,
          //   })),
          // });
          // form.reset();
        })}
        className="space-y-4"
      >
        <EntityLayout
          header={`Map of the World: ${id}`}
          subheader="List and manage locations for this world here."
          left={
            <MapEditor
              imageUrl={'/map.png'}
              onRegionCreated={handleRegionCreated}
              onPolygonToolActivated={handlePolygonToolActivated}
              activatePolygonTool={activatePolygonTool}
            />
          }
        >
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <CopilotTextarea
                    autosuggestionsConfig={{
                      textareaPurpose: `Describe the world map's high-level features like the type of world based on the world thme being ${world?.theme}`,
                      chatApiConfigs: {
                        suggestionsApiConfig: {
                          maxTokens: 100,
                        },
                      },
                    }}
                    {...field}
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="regions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Regions</FormLabel>
                <FormControl>
                  <RegionList
                    regions={field.value}
                    onRegionUpdated={() => {
                      console.log('Region updated');
                    }}
                    onAddRegion={handleAddRegion}
                    isCreatingRegion={isCreatingRegion}
                    onCancelCreate={handleCancelCreate}
                    onConfirmCreate={handleConfirmRegion}
                    currentRegion={currentRegion}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={false}>
            Save Map
          </Button>
        </EntityLayout>
      </form>
    </Form>
  );
}
