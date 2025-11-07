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
}

function RegionFormComponent({
  worldId,
  defaultValues,
  onSuccess,
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
    createRegion.mutate(data);
  };

  return (
    <AutoForm
      schema={schemaProvider}
      onSubmit={handleSubmit}
      values={defaultValues}
      withSubmit
    />
  );
}

export default RegionFormComponent;
