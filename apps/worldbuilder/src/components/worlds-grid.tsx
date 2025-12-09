'use client';

import React from 'react';
import { World } from '@talespin/schema';
import { WorldCard } from './world-card';

interface WorldsGridProps {
  worlds: World[];
  canCreateWorld: boolean;
  isLoading?: boolean;
}

export function WorldsGrid({
  worlds,
  canCreateWorld,
  isLoading = false,
}: WorldsGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="text-muted-foreground">Loading worlds...</div>
      </div>
    );
  }

  if (worlds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          No worlds found
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {canCreateWorld
            ? 'Create your first world to get started'
            : 'Check back later for new worlds to explore'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {worlds.map((world) => (
        <WorldCard
          key={world._id}
          world={world}
          canCreateWorld={canCreateWorld}
        />
      ))}
    </div>
  );
}
