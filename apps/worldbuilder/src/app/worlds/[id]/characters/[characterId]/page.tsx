'use client';

import React, { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { Character } from '@talespin/schema';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import CharacterFormComponent from '@/components/form/character';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function CharacterDetailsPage({
  worldId,
  characterId,
}: {
  worldId: string;
  characterId: string;
}) {
  const {
    data: character,
    isLoading,
    error,
  } = useApiQuery<Character | null>(
    `/api/worlds/${worldId}/characters/${characterId}`,
  );
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  if (error) {
    return (
      <Alert>
        <AlertTitle>Unable to load character</AlertTitle>
        <AlertDescription>
          {error.message || 'Please refresh and try again.'}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading || !character) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <div className="flex h-full gap-4">
        <div className="w-64 overflow-auto rounded-xl border border-border/60 bg-card/40 p-2">
          <h2 className="mb-2 px-2 text-sm font-semibold">Concept Art</h2>
          <div className="space-y-2">
            {(character.gallery ?? []).map((img, idx) => (
              <div
                key={`${img.imageUrl}-${idx}`}
                className="flex items-start gap-2 rounded-md p-2"
              >
                <div className="h-24 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted">
                  <img
                    src={img.imageUrl}
                    alt={`${character.name} ${img.angle}`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{img.angle}</div>
                  {img.description && (
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {img.description}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 rounded-xl border border-border/60 bg-muted/10 p-4 flex items-center justify-center relative">
          {character.gallery && character.gallery.length > 0 ? (
            <figure className="flex h-full w-full items-center justify-center">
              <img
                src={character.gallery[0].imageUrl}
                alt={character.name}
                className="h-full w-full object-contain rounded-lg"
              />
              <figcaption className="absolute bottom-6 left-6 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
                {character.gallery[0].angle}
              </figcaption>
            </figure>
          ) : (
            <div className="flex h-64 w-full items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/30 text-sm text-muted-foreground">
              No concept art available yet.
            </div>
          )}
        </div>

        <div className="w-80">
          <div className="space-y-4 p-2">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold">{character.name}</h1>
                {character.description && (
                  <p className="text-sm text-muted-foreground">
                    {character.description}
                  </p>
                )}
              </div>
              <div>
                <Button onClick={() => setIsEditing(true)}>Edit</Button>
              </div>
            </div>

            {character.biography && (
              <Card>
                <CardHeader>
                  <CardTitle>Biography</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {character.biography}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Drawer open={isEditing} onOpenChange={setIsEditing} direction="right">
        <DrawerContent className="w-full max-w-md border-l border-sidebar-border">
          <CharacterFormComponent
            worldId={worldId}
            characterId={character._id}
            defaultValues={character ?? undefined}
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: [`/api/worlds/${worldId}/characters`],
              });
              setIsEditing(false);
            }}
          />
        </DrawerContent>
      </Drawer>
    </div>
  );
}

export default function WrappedCharacterDetailsPage({
  params,
}: {
  params: Promise<{ id: string; characterId: string }>;
}) {
  const { id, characterId } = React.use(params);
  return <CharacterDetailsPage worldId={id} characterId={characterId} />;
}
