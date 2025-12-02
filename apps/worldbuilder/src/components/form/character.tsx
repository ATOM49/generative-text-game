'use client';
import { ZodProvider } from '@autoform/zod';
import { AutoForm } from '../ui/autoform';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { Character, CharacterFormSchema, Faction } from '@talespin/schema';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Button } from '../ui/button';
import { X } from 'lucide-react';

interface CharacterFormComponentProps {
  worldId: string;
  characterId?: string;
  defaultValues?: Partial<Character>;
  onSuccess?: () => void;
}

function CharacterFormComponent({
  worldId,
  characterId,
  defaultValues,
  onSuccess,
}: CharacterFormComponentProps) {
  const queryClient = useQueryClient();
  const schemaProvider = new ZodProvider(CharacterFormSchema);

  // Fetch all factions to populate dropdowns
  const { data: allFactions = [] } = useApiQuery<Faction[]>(
    `/api/worlds/${worldId}/factions`,
  );

  // Filter factions by category
  const factions = allFactions.filter((f) => f.category === 'faction');
  const cultures = allFactions.filter((f) => f.category === 'culture');
  const species = allFactions.filter((f) => f.category === 'species');
  const archetypes = allFactions.filter(
    (f) => f.category === 'archetype' || f.category === 'entity',
  );

  // Local state for selected IDs
  const [selectedFactionIds, setSelectedFactionIds] = useState<string[]>([]);
  const [selectedCultureIds, setSelectedCultureIds] = useState<string[]>([]);
  const [selectedSpeciesIds, setSelectedSpeciesIds] = useState<string[]>([]);
  const [selectedArchetypeIds, setSelectedArchetypeIds] = useState<string[]>(
    [],
  );

  // Initialize from defaultValues
  useEffect(() => {
    if (defaultValues) {
      setSelectedFactionIds(defaultValues.factionIds ?? []);
      setSelectedCultureIds(defaultValues.cultureIds ?? []);
      setSelectedSpeciesIds(defaultValues.speciesIds ?? []);
      setSelectedArchetypeIds(defaultValues.archetypeIds ?? []);
    }
  }, [defaultValues]);

  const mutation = useApiMutation<Character, Partial<Character>>(
    characterId ? 'PUT' : 'POST',
    characterId
      ? () => `/api/worlds/${worldId}/characters/${characterId}`
      : `/api/worlds/${worldId}/characters`,
    undefined,
    {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [`/api/worlds/${worldId}/characters`],
        });
        onSuccess?.();
      },
    },
  );

  const handleSubmit = (values: Partial<Character>) => {
    mutation.mutate({
      ...values,
      factionIds: selectedFactionIds,
      cultureIds: selectedCultureIds,
      speciesIds: selectedSpeciesIds,
      archetypeIds: selectedArchetypeIds,
    });
  };

  const sanitizedValues = defaultValues
    ? (() => {
        const clone: Partial<Character> = { ...defaultValues };
        delete clone._id;
        delete clone.worldId;
        delete clone.createdAt;
        delete clone.updatedAt;
        return clone;
      })()
    : undefined;

  const addToSelection = (
    id: string,
    currentIds: string[],
    setter: (ids: string[]) => void,
  ) => {
    if (!currentIds.includes(id)) {
      setter([...currentIds, id]);
    }
  };

  const removeFromSelection = (
    id: string,
    currentIds: string[],
    setter: (ids: string[]) => void,
  ) => {
    setter(currentIds.filter((existingId) => existingId !== id));
  };

  const renderMultiSelect = (
    label: string,
    options: Faction[],
    selectedIds: string[],
    setter: (ids: string[]) => void,
  ) => {
    const availableOptions = options.filter(
      (opt) => !selectedIds.includes(opt._id),
    );

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedIds.map((id) => {
            const item = options.find((f) => f._id === id);
            return (
              <div
                key={id}
                className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded text-sm"
              >
                <span>{item?.name ?? id}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeFromSelection(id, selectedIds, setter)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
        {availableOptions.length > 0 && (
          <Select
            onValueChange={(value) =>
              addToSelection(value, selectedIds, setter)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${label.toLowerCase()}...`} />
            </SelectTrigger>
            <SelectContent>
              {availableOptions.map((option) => (
                <SelectItem key={option._id} value={option._id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <AutoForm
        schema={schemaProvider}
        onSubmit={handleSubmit}
        values={sanitizedValues}
      >
        {renderMultiSelect(
          'Factions',
          factions,
          selectedFactionIds,
          setSelectedFactionIds,
        )}
        {renderMultiSelect(
          'Cultures',
          cultures,
          selectedCultureIds,
          setSelectedCultureIds,
        )}
        {renderMultiSelect(
          'Species',
          species,
          selectedSpeciesIds,
          setSelectedSpeciesIds,
        )}
        {renderMultiSelect(
          'Archetypes',
          archetypes,
          selectedArchetypeIds,
          setSelectedArchetypeIds,
        )}
        <Button type="submit" disabled={mutation.isLoading}>
          {characterId ? 'Update Character' : 'Create Character'}
        </Button>
      </AutoForm>
    </div>
  );
}

export default CharacterFormComponent;
