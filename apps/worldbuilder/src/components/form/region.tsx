'use client';
import { ZodProvider } from '@autoform/zod';
import { AutoForm } from '../ui/autoform';
import { useApiMutation } from '@/hooks/useApiQuery';
import { Region, RegionFormSchema } from '@talespin/schema';
import { useQueryClient } from '@tanstack/react-query';

interface RegionFormComponentProps {
  worldId: string;
  defaultValues?: Partial<Region>;
  onSuccess?: () => void;
  onSubmit?: (data: any) => void;
  isSubmitting?: boolean;
}

function RegionFormComponent({
  worldId,
  defaultValues,
  onSuccess,
  onSubmit: customOnSubmit,
  isSubmitting: externalIsSubmitting,
}: RegionFormComponentProps) {
  const queryClient = useQueryClient();
  const schemaProvider = new ZodProvider(RegionFormSchema);

  const createRegion = useApiMutation<Region, Partial<Region>>(
    'POST',
    `/api/worlds/${worldId}/regions`,
    undefined,
    {
      onSuccess: (newRegion) => {
        queryClient.invalidateQueries({
          queryKey: [`/api/worlds/${worldId}/regions`],
        });
        onSuccess?.();
      },
    },
  );

  const handleSubmit = (data: any) => {
    if (customOnSubmit) {
      customOnSubmit(data);
    } else {
      createRegion.mutate(data);
    }
  };

  const isSubmitting = externalIsSubmitting ?? createRegion.isPending;

  return (
    <div>
      <AutoForm
        schema={schemaProvider}
        onSubmit={handleSubmit}
        values={defaultValues}
        withSubmit
      />
      {isSubmitting && (
        <p className="text-sm text-muted-foreground mt-2">Editing image...</p>
      )}
    </div>
  );
}

export default RegionFormComponent;
