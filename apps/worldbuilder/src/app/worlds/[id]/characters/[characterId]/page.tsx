'use client';

import React from 'react';
import CharacterDetails from '@/components/character-details';

export default function WrappedCharacterDetailsPage({
  params,
}: {
  params: Promise<{ id: string; characterId: string }>;
}) {
  const { id, characterId } = React.use(params);
  return <CharacterDetails worldId={id} characterId={characterId} />;
}
