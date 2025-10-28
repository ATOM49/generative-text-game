import React from 'react';
import { EntityLayout } from '@/components/entity-layout';

export default function LocationsPage({ params }: { params: { id: string } }) {
  return (
    <EntityLayout
      header={`Locations in World: ${params.id}`}
      subheader="List and manage locations for this world here."
    >
      <div />
    </EntityLayout>
  );
}
