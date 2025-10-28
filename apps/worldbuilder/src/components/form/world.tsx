'use client';
import { ZodProvider } from '@autoform/zod';
import { AutoForm } from '../ui/autoform';
import { useApiMutation } from '@/hooks/useApiQuery';
import { World, WorldFormSchema } from '@talespin/schema';

function WorldFormComponent() {
  const schemaProvider = new ZodProvider(WorldFormSchema);

  const createWorld = useApiMutation<World, Partial<World>>(
    'POST',
    '/api/worlds',
    undefined,
    {
      onSuccess: (newWorld) => {
        // Optionally, you can refetch or update cache here
        // e.g., queryClient.invalidateQueries(['/api/worlds']);
      },
    },
  );
  const handleSubmit = (data: any) => {
    createWorld.mutate(data);
  };

  return <AutoForm schema={schemaProvider} onSubmit={handleSubmit} />;
}

export default WorldFormComponent;
