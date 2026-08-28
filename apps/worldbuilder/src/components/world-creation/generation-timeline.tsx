'use client';

import {
  Check,
  Circle,
  Map,
  Network,
  Sparkles,
  Users,
  Waypoints,
} from 'lucide-react';

import { cn } from '@/lib/utils';

export type GenerationState = 'idle' | 'generating' | 'complete' | 'error';

const STEPS = [
  {
    title: 'Deepen the premise',
    description:
      'Turn your short pitch into a coherent setting, tone, and creative direction.',
    icon: Sparkles,
  },
  {
    title: 'Draw the map and read its regions',
    description:
      'Generate the atlas, then ground each region in the terrain visible on the map.',
    icon: Map,
  },
  {
    title: 'Build the factions',
    description:
      'Create powers, cultures, and tensions that belong in this world.',
    icon: Network,
  },
  {
    title: 'Cast the characters',
    description:
      'Develop people shaped by those factions, with motives and story hooks.',
    icon: Users,
  },
  {
    title: 'Settle the world',
    description:
      'Place factions across suitable regions so the setting is ready for missions.',
    icon: Waypoints,
  },
] as const;

interface GenerationTimelineProps {
  state: GenerationState;
}

export function GenerationTimeline({ state }: GenerationTimelineProps) {
  return (
    <div className="space-y-4" aria-live="polite">
      <div>
        <p className="text-sm font-semibold">What Talespin will create</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {state === 'generating'
            ? 'The server is working through this pipeline. Some stages run in parallel; this request reports completion when the whole world is ready.'
            : 'Each layer supplies context to the next, while independent work runs in parallel.'}
        </p>
      </div>

      <ol className="space-y-3">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isComplete = state === 'complete';
          const isWorking = state === 'generating';
          const isError = state === 'error';

          return (
            <li key={step.title} className="relative flex gap-3">
              {index < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    'absolute left-4 top-9 h-[calc(100%-1.25rem)] w-px bg-border',
                    isComplete && 'bg-primary/50',
                  )}
                />
              )}
              <span
                className={cn(
                  'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground',
                  isWorking &&
                    'animate-pulse border-primary/40 bg-primary/5 text-primary',
                  isComplete &&
                    'border-primary bg-primary text-primary-foreground',
                  isError && 'border-destructive/50 text-destructive',
                )}
              >
                {isComplete ? (
                  <Check className="size-4" aria-hidden />
                ) : isWorking ? (
                  <Icon className="size-4" aria-hidden />
                ) : (
                  <Circle className="size-3" aria-hidden />
                )}
              </span>
              <div className="min-w-0 pb-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className="text-sm font-medium">{step.title}</p>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {isComplete
                      ? 'Complete'
                      : isWorking
                        ? 'Server working'
                        : isError
                          ? 'Not completed'
                          : 'Planned'}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
