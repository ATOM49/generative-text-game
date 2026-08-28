'use client';

import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import {
  WorldCreationSeedSchema,
  type WorldCreationResult,
  type WorldCreationSeed,
} from '@talespin/schema';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  GenerationTimeline,
  type GenerationState,
} from '@/components/world-creation/generation-timeline';

const THEME_OPTIONS = [
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'sci‑fi', label: 'Science fiction' },
  { value: 'modern', label: 'Modern' },
  { value: 'historical', label: 'Historical' },
  { value: 'post‑apocalyptic', label: 'Post-apocalyptic' },
] as const;

type CreationSummary = {
  worldId: string;
  regions: number;
  factions: number;
  characters: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const summarizeResult = (result: WorldCreationResult): CreationSummary => {
  if (!result.world._id) {
    throw new Error('The generated world response did not include a world ID.');
  }

  return {
    worldId: result.world._id,
    regions: result.regions.length,
    factions: result.factions.length,
    characters: result.characters.length,
  };
};

const getErrorMessage = async (response: Response) => {
  const fallback = 'World generation failed. Please try again.';
  try {
    const body = (await response.json()) as unknown;
    if (isRecord(body)) {
      if (typeof body.error === 'string') return body.error;
      if (typeof body.message === 'string') return body.message;
    }
  } catch {
    // The status code is still useful when the server did not return JSON.
  }
  return `${fallback} (${response.status})`;
};

export function WorldCreationForm() {
  const router = useRouter();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [name, setName] = useState('');
  const [theme, setTheme] = useState('');
  const [description, setDescription] = useState('');
  const [generationState, setGenerationState] =
    useState<GenerationState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<CreationSummary | null>(null);

  const isGenerating = generationState === 'generating';
  const canSubmit = theme.length > 0 && description.trim().length > 0;

  const completionItems = summary
    ? [
        { label: 'Regions', value: summary.regions },
        { label: 'Factions', value: summary.factions },
        { label: 'Characters', value: summary.characters },
      ]
    : [];

  useEffect(
    () => () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    },
    [],
  );

  const enterWorld = (worldId: string) => {
    router.replace(`/worlds/${encodeURIComponent(worldId)}/regions`);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isGenerating) return;

    setError(null);
    setSummary(null);

    const parsed = WorldCreationSeedSchema.safeParse({
      name: name.trim() || undefined,
      theme,
      description: description.trim(),
    });

    if (!parsed.success) {
      setGenerationState('error');
      setError(
        parsed.error.issues[0]?.message ??
          'Add a theme and a short description to begin.',
      );
      return;
    }

    setGenerationState('generating');

    try {
      const seed: WorldCreationSeed = parsed.data;
      const response = await fetch('/api/worlds/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(seed),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const result = (await response.json()) as WorldCreationResult;
      const nextSummary = summarizeResult(result);
      setSummary(nextSummary);
      setGenerationState('complete');

      redirectTimerRef.current = setTimeout(() => {
        enterWorld(nextSummary.worldId);
      }, 1800);
    } catch (caught) {
      setGenerationState('error');
      setError(
        caught instanceof Error
          ? caught.message
          : 'World generation failed. Please try again.',
      );
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <Card className="border-primary/15 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Give the world a spark</CardTitle>
          <CardDescription className="max-w-2xl leading-relaxed">
            A few sentences are enough. Talespin will expand the idea into a
            map, distinct regions, factions, characters, and the relationships
            that make the setting feel inhabited.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="world-name">World name</Label>
              <Input
                id="world-name"
                name="name"
                placeholder="Optional — Talespin can name it"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={isGenerating || generationState === 'complete'}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Leave this blank if discovering the name is part of the fun.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="world-theme">Theme</Label>
              <Select
                value={theme}
                onValueChange={setTheme}
                disabled={isGenerating || generationState === 'complete'}
                required
              >
                <SelectTrigger id="world-theme" className="w-full">
                  <SelectValue placeholder="Choose a creative direction" />
                </SelectTrigger>
                <SelectContent>
                  {THEME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="world-description">The core idea</Label>
              <Textarea
                id="world-description"
                name="description"
                placeholder="For example: An archipelago carried on the backs of sleeping giants, where rival lighthouse guilds compete to predict when each island will wake."
                className="min-h-36 resize-y leading-relaxed"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={isGenerating || generationState === 'complete'}
                required
              />
              <p className="text-xs text-muted-foreground">
                Mention the conflict, mood, or strange rule you most want the
                world to preserve.
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Creation paused</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {summary && (
              <Alert className="border-primary/30 bg-primary/5">
                <CheckCircle2 className="text-primary" />
                <AlertTitle>Your world is ready</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {completionItems.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-md border bg-background px-3 py-2 text-center"
                      >
                        <p className="text-lg font-semibold text-foreground">
                          {item.value}
                        </p>
                        <p className="text-[10px] uppercase tracking-wider">
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3">Opening the regional atlas…</p>
                </AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push('/')}
                disabled={isGenerating}
              >
                <ArrowLeft />
                Back to worlds
              </Button>
              {summary ? (
                <Button
                  type="button"
                  onClick={() => enterWorld(summary.worldId)}
                >
                  Enter world
                  <ArrowRight />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="lg"
                  disabled={!canSubmit || isGenerating}
                >
                  <Sparkles />
                  {isGenerating
                    ? 'Creating your world…'
                    : 'Create living world'}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="h-fit bg-muted/35 lg:sticky lg:top-6">
        <CardContent>
          <GenerationTimeline state={generationState} />
        </CardContent>
      </Card>
    </div>
  );
}
