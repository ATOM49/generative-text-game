import React, { useState, useEffect } from 'react';
import { RegionForm as IRegionForm, Region } from '@talespin/schema';
import { Button } from '@/components/ui/button';
import { useApiMutation } from '@/hooks/useApiQuery';
import { RegionForm } from './RegionForm';
import { useFormContext } from 'react-hook-form';

interface RegionListProps {
  regions: IRegionForm[] | undefined;
  onRegionDeleted?: (id: string) => void;
  onRegionUpdated?: () => void;
  onAddRegion?: () => void;
  isCreatingRegion?: boolean;
  onCancelCreate?: () => void;
  onConfirmCreate?: () => void;
  currentRegion?: IRegionForm | null;
}

export function RegionList({
  regions,
  onRegionDeleted,
  onRegionUpdated,
  onAddRegion,
  isCreatingRegion = false,
  onCancelCreate,
  onConfirmCreate,
  currentRegion,
}: RegionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const { setValue, getValues } = useFormContext();

  const deleteRegion = useApiMutation<null, string>(
    'DELETE',
    (variables) => `/api/region/${variables}`,
    undefined,
    {
      onSuccess: (data, variables) => {
        if (onRegionDeleted && variables) onRegionDeleted(variables);
        setEditingId(null);
      },
    },
  );

  // Handler for Add Region
  const handleAddRegion = () => {
    if (onAddRegion) onAddRegion();
  };

  // Handler for confirming region creation
  const handleConfirmRegion = () => {
    if (isCreatingRegion) {
      // The region is already in the form, just finalize it
      if (onConfirmCreate) onConfirmCreate();
    }
  };

  // Handler for canceling region creation
  const handleCancelRegion = () => {
    if (isCreatingRegion) {
      // Remove the temporary region from the form
      const currentRegions = getValues('regions') || [];
      if (currentRegions.length > 0) {
        const newRegions = currentRegions.slice(0, -1); // Remove last item (the temporary one)
        setValue('regions', newRegions);
      }
    }
    if (onCancelCreate) onCancelCreate();
  };

  // Handler for updating region in form
  const updateRegionInForm = (
    index: number,
    updatedRegion: Partial<IRegionForm>,
  ) => {
    const currentRegions = getValues('regions') || [];
    const newRegions = [...currentRegions];
    newRegions[index] = { ...newRegions[index], ...updatedRegion };
    setValue('regions', newRegions);
  };

  // Set initial values for the new region being created
  React.useEffect(() => {
    if (isCreatingRegion && currentRegion) {
      const currentRegions = getValues('regions') || [];
      const tempRegions = [...currentRegions, currentRegion];
      setValue('regions', tempRegions);
    }
  }, [isCreatingRegion, currentRegion, setValue, getValues]);

  return (
    <div className="space-y-4">
      <Button onClick={handleAddRegion}>Add Region</Button>

      {isCreatingRegion && currentRegion && (
        <div className="border p-4 bg-blue-50">
          <h4 className="font-medium mb-2">New Region</h4>
          <RegionForm region={currentRegion} index={regions?.length || 0} />
          <div className="flex gap-2 mt-4">
            <Button
              type="button"
              onClick={handleConfirmRegion}
              variant="default"
            >
              Confirm Region
            </Button>
            <Button
              type="button"
              onClick={handleCancelRegion}
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {(regions as IRegionForm[])?.map((region, idx) => (
        <div key={region.name || idx} className="border p-4">
          {editingId === (region as any).id ? (
            <>
              <RegionForm region={region} index={idx} />
              <div className="flex gap-2 mt-4">
                <Button
                  type="button"
                  onClick={() => setEditingId(null)}
                  variant="default"
                >
                  Save Changes
                </Button>
                <Button
                  type="button"
                  onClick={() => setEditingId(null)}
                  variant="secondary"
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="font-semibold">{region.name}</div>
              <div className="text-xs text-muted-foreground">
                Terrain: {region.terrain} | Climate: {region.climate}
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  onClick={() =>
                    setEditingId((region as any).id || idx.toString())
                  }
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    const currentRegions = getValues('regions') || [];
                    const newRegions = currentRegions.filter(
                      (region: any, i: number) => i !== idx,
                    );
                    setValue('regions', newRegions);
                    if (onRegionUpdated) onRegionUpdated();
                  }}
                >
                  Delete
                </Button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
