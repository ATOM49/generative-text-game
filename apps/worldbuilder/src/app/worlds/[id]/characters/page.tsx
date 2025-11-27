'use client';
import React, { useState } from 'react';
import { EntityLayout } from '@/components/entity-layout';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { Character } from '@talespin/schema';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import CharacterFormComponent from '@/components/form/character';
import { useQueryClient } from '@tanstack/react-query';

export default function CharactersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = React.use(params);
  const queryClient = useQueryClient();
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(
    null,
  );
  const [deletingCharacterId, setDeletingCharacterId] = useState<string | null>(
    null,
  );

  const { data: characters = [], isLoading: charactersLoading } = useApiQuery<
    Character[]
  >(`/api/worlds/${id}/characters`);

  const deleteCharacter = useApiMutation<{ ok: boolean }, string>(
    'DELETE',
    (characterId) => `/api/worlds/${id}/characters/${characterId}`,
    undefined,
    {
      onSuccess: (_data, characterId) => {
        queryClient.invalidateQueries({
          queryKey: [`/api/worlds/${id}/characters`],
        });
        if (activeCharacter?._id === characterId) {
          setActiveCharacter(null);
        }
      },
    },
  );

  const handleDeleteCharacter = (characterId: string) => {
    setDeletingCharacterId(characterId);
    deleteCharacter.mutate(characterId, {
      onSettled: () => setDeletingCharacterId(null),
    });
  };

  const renderCharacters = () => (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Characters</h2>
          <p className="text-sm text-muted-foreground">
            Named NPCs referencing reusable factions, cultures, and species.
          </p>
        </div>
        <Button size="sm" onClick={() => setActiveCharacter(null)}>
          New
        </Button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {charactersLoading ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : characters.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No characters yet. Create your first NPC to seed treasure hunts.
          </p>
        ) : (
          characters.map((character) => (
            <Card
              key={character._id}
              className={
                activeCharacter?._id === character._id
                  ? 'border-primary'
                  : undefined
              }
            >
              <CardHeader className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">
                      {character.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {character.description || 'No description yet.'}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveCharacter(character)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCharacter(character._id)}
                      disabled={
                        deletingCharacterId === character._id &&
                        deleteCharacter.isPending
                      }
                    >
                      {deletingCharacterId === character._id &&
                      deleteCharacter.isPending
                        ? 'Deleting…'
                        : 'Delete'}
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderCharacterPreview = () => {
    if (!activeCharacter) {
      return (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Select a character to view details
          </p>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col gap-4 overflow-y-auto">
        <div>
          <h2 className="text-lg font-semibold">{activeCharacter.name}</h2>
          {activeCharacter.previewUrl && (
            <div className="mt-4">
              <img
                src={activeCharacter.previewUrl}
                alt={activeCharacter.name}
                className="w-full rounded-lg"
              />
            </div>
          )}
        </div>

        {activeCharacter.description && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">Description</h3>
            <p className="text-sm text-muted-foreground">
              {activeCharacter.description}
            </p>
          </div>
        )}

        {activeCharacter.biography && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">Biography</h3>
            <p className="text-sm text-muted-foreground">
              {activeCharacter.biography}
            </p>
          </div>
        )}

        {activeCharacter.traits && activeCharacter.traits.length > 0 && (
          <div>
            <h3 className="mb-2 text-sm font-semibold">Traits</h3>
            <div className="flex flex-wrap gap-1">
              {activeCharacter.traits.map((trait, idx) => (
                <span
                  key={idx}
                  className="rounded-md bg-secondary px-2 py-1 text-xs"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>
        )}

        {activeCharacter.meta?.descriptors &&
          activeCharacter.meta.descriptors.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold">Descriptors</h3>
              <div className="space-y-2">
                {activeCharacter.meta.descriptors.map((desc, idx) => (
                  <div key={idx}>
                    <p className="text-xs font-medium">{desc.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {desc.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

        <div className="grid grid-cols-2 gap-4">
          {activeCharacter.factionIds &&
            activeCharacter.factionIds.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Factions</h3>
                <div className="flex flex-wrap gap-1">
                  {activeCharacter.factionIds.map((id) => (
                    <span
                      key={id}
                      className="rounded-md bg-secondary px-2 py-1 text-xs"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {activeCharacter.cultureIds &&
            activeCharacter.cultureIds.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Cultures</h3>
                <div className="flex flex-wrap gap-1">
                  {activeCharacter.cultureIds.map((id) => (
                    <span
                      key={id}
                      className="rounded-md bg-secondary px-2 py-1 text-xs"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {activeCharacter.speciesIds &&
            activeCharacter.speciesIds.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Species</h3>
                <div className="flex flex-wrap gap-1">
                  {activeCharacter.speciesIds.map((id) => (
                    <span
                      key={id}
                      className="rounded-md bg-secondary px-2 py-1 text-xs"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {activeCharacter.archetypeIds &&
            activeCharacter.archetypeIds.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Archetypes</h3>
                <div className="flex flex-wrap gap-1">
                  {activeCharacter.archetypeIds.map((id) => (
                    <span
                      key={id}
                      className="rounded-md bg-secondary px-2 py-1 text-xs"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>
    );
  };

  return (
    <EntityLayout
      header="Characters"
      subheader="Define individual NPCs that populate treasure hunts."
      left={renderCharacters()}
    >
      {renderCharacterPreview()}
    </EntityLayout>
  );
}
