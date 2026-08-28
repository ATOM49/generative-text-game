'use client';

import { use, useMemo } from 'react';
import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  BookOpen,
  Flag,
  Map as MapIcon,
  MountainSnow,
  RefreshCw,
  Sparkles,
  Wind,
} from 'lucide-react';
import type { Faction, Region, World } from '@talespin/schema';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useApiQuery } from '@/hooks/useApiQuery';
import { cn } from '@/lib/utils';

const INFLUENCE_STYLES: Record<
  Region['factionPresence'][number]['influence'],
  string
> = {
  dominant:
    'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200',
  established: 'border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200',
  contested:
    'border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200',
  hidden:
    'border-violet-500/30 bg-violet-500/10 text-violet-800 dark:text-violet-200',
};

const EMPTY_FACTIONS: Faction[] = [];

type RegionMapCropProps = {
  mapImageUrl: string;
  region: Region;
  worldName: string;
  priority?: boolean;
};

function RegionMapCrop({
  mapImageUrl,
  region,
  worldName,
  priority = false,
}: RegionMapCropProps) {
  const { mapBounds } = region;
  const cropStyle: CSSProperties = {
    width: `${100 / mapBounds.width}%`,
    height: `${100 / mapBounds.height}%`,
    left: `${(-mapBounds.x / mapBounds.width) * 100}%`,
    top: `${(-mapBounds.y / mapBounds.height) * 100}%`,
  };

  return (
    <div
      className="relative w-full overflow-hidden border-b bg-muted"
      style={{ aspectRatio: mapBounds.width / mapBounds.height }}
    >
      <div className="absolute" style={cropStyle}>
        <Image
          src={mapImageUrl}
          alt={`Map detail showing ${region.name} in ${worldName}`}
          fill
          sizes="(max-width: 1279px) 100vw, 50vw"
          priority={priority}
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/10"
        aria-hidden
      />
    </div>
  );
}

type RegionCardProps = {
  region: Region;
  world: World;
  factionById: Map<string, Faction>;
  priority?: boolean;
};

function RegionCard({
  region,
  world,
  factionById,
  priority = false,
}: RegionCardProps) {
  return (
    <Card className="overflow-hidden py-0 shadow-md">
      {world.mapImageUrl ? (
        <RegionMapCrop
          mapImageUrl={world.mapImageUrl}
          region={region}
          worldName={world.name}
          priority={priority}
        />
      ) : (
        <div className="flex aspect-video items-center justify-center border-b bg-muted px-6 text-center text-sm text-muted-foreground">
          The world map is unavailable, so this region has no visual cut-out.
        </div>
      )}

      <CardHeader className="border-b py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>
              <h2 className="text-2xl">{region.name}</h2>
            </CardTitle>
            <CardDescription className="mt-2 text-sm leading-relaxed">
              {region.summary}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
              <MountainSnow className="size-3.5 text-primary" aria-hidden />
              {region.biome}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs font-medium">
              <Wind className="size-3.5 text-primary" aria-hidden />
              {region.atmosphere}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 py-6">
        <section aria-labelledby={`region-${region._id}-overview`}>
          <h3
            id={`region-${region._id}-overview`}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
          >
            Region overview
          </h3>
          <p className="mt-3 text-sm leading-7 text-foreground/85">
            {region.description}
          </p>
        </section>

        <section aria-labelledby={`region-${region._id}-factions`}>
          <div className="flex items-center gap-2">
            <Flag className="size-4 text-primary" aria-hidden />
            <h3
              id={`region-${region._id}-factions`}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
            >
              Faction presence
            </h3>
          </div>
          {region.factionPresence.length > 0 ? (
            <div className="mt-3 space-y-3">
              {region.factionPresence.map((presence) => {
                const faction = factionById.get(presence.factionId);

                return (
                  <div
                    key={`${region._id}-${presence.factionId}`}
                    className="rounded-lg border bg-muted/30 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold">
                        {faction?.name ?? 'Faction unavailable'}
                      </p>
                      <span
                        className={cn(
                          'rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em]',
                          INFLUENCE_STYLES[presence.influence],
                        )}
                      >
                        {presence.influence}
                      </span>
                    </div>
                    {faction?.summary ? (
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {faction.summary}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm leading-relaxed">
                      {presence.rationale}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
              No faction currently has a recorded presence here.
            </p>
          )}
        </section>

        <section aria-labelledby={`region-${region._id}-hooks`}>
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-primary" aria-hidden />
            <h3
              id={`region-${region._id}-hooks`}
              className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
            >
              Mission hooks
            </h3>
          </div>
          <ul className="mt-3 space-y-2">
            {region.missionHooks.map((hook, index) => (
              <li
                key={`${region._id}-hook-${index}`}
                className="flex gap-2 text-sm leading-relaxed text-foreground/85"
              >
                <Sparkles
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden
                />
                <span>{hook}</span>
              </li>
            ))}
          </ul>
        </section>
      </CardContent>
    </Card>
  );
}

export default function RegionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const worldQuery = useApiQuery<World>(`/api/worlds/${id}`);
  const regionsQuery = useApiQuery<Region[]>(`/api/worlds/${id}/regions`);
  const factionsQuery = useApiQuery<Faction[]>(`/api/worlds/${id}/factions`);

  const factions = factionsQuery.data ?? EMPTY_FACTIONS;
  const factionById = useMemo(
    () => new Map(factions.map((faction) => [faction._id, faction])),
    [factions],
  );

  const isLoading =
    worldQuery.isLoading || regionsQuery.isLoading || factionsQuery.isLoading;
  const queryError =
    worldQuery.error || regionsQuery.error || factionsQuery.error;

  const handleRetry = () => {
    void Promise.all([
      worldQuery.refetch(),
      regionsQuery.refetch(),
      factionsQuery.refetch(),
    ]);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <Spinner />
        <div>
          <p className="text-sm font-medium">Opening the regional atlas</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Loading the world, its regions, and faction presence.
          </p>
        </div>
      </div>
    );
  }

  if (queryError || !worldQuery.data) {
    return (
      <div className="mx-auto w-full max-w-3xl p-6 sm:p-10">
        <Alert variant="destructive">
          <AlertTitle>The regional atlas could not be opened</AlertTitle>
          <AlertDescription>
            <p>
              {queryError?.message ||
                'The world record was unavailable. Try loading it again.'}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleRetry}
            >
              <RefreshCw aria-hidden />
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const world = worldQuery.data;
  const regions = regionsQuery.data ?? [];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
      <header className="rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Regional atlas
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              {world.name}
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">
              {world.lore?.tagline ||
                world.description ||
                'A generated world waiting for its first mission.'}
            </p>
          </div>
          <div className="rounded-xl border bg-background/80 px-4 py-3 text-right shadow-sm">
            <p className="text-2xl font-bold">{regions.length}</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {regions.length === 1 ? 'Region' : 'Regions'}
            </p>
          </div>
        </div>
      </header>

      {regions.length === 0 ? (
        <Card className="border-dashed py-12 text-center">
          <CardContent className="mx-auto max-w-xl space-y-4">
            <MapIcon
              className="mx-auto size-8 text-muted-foreground"
              aria-hidden
            />
            <div>
              <CardTitle>
                <h2>No generated regions yet</h2>
              </CardTitle>
              <CardDescription className="mt-2 leading-relaxed">
                This world exists, but it does not have regional records to
                browse. You can still inspect its map or define factions.
              </CardDescription>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild variant="outline">
                <Link href={`/worlds/${id}/map`}>View map</Link>
              </Button>
              <Button asChild>
                <Link href={`/worlds/${id}/factions`}>View factions</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid items-start gap-6 xl:grid-cols-2">
          {regions.map((region, index) => (
            <RegionCard
              key={region._id}
              region={region}
              world={world}
              factionById={factionById}
              priority={index === 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
