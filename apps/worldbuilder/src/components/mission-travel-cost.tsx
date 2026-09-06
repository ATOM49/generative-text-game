'use client';

import { useEffect, useState } from 'react';
import { Footprints } from 'lucide-react';

const SEGMENTS = Array.from({ length: 12 }, (_, index) => index);

interface MissionTravelCostProps {
  used: number;
  maximum: number;
}

export function MissionTravelCost({ used, maximum }: MissionTravelCostProps) {
  const safeMaximum = Math.max(1, maximum);
  const safeUsed = Math.max(0, used);
  const percentage = Math.min(100, (safeUsed / safeMaximum) * 100);
  const remaining = Math.max(0, safeMaximum - safeUsed);
  const [displayedPercentage, setDisplayedPercentage] = useState(0);

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setDisplayedPercentage(percentage);
    });
    return () => cancelAnimationFrame(frameId);
  }, [percentage]);

  const tone =
    percentage >= 100
      ? {
          fill: 'bg-destructive',
          thumb: 'border-destructive bg-destructive text-white',
          text: 'text-destructive',
        }
      : percentage >= 75
        ? {
            fill: 'bg-amber-500',
            thumb: 'border-amber-700 bg-amber-400 text-amber-950',
            text: 'text-amber-700 dark:text-amber-400',
          }
        : {
            fill: 'bg-primary',
            thumb: 'border-primary bg-background text-primary',
            text: 'text-primary',
          };
  const markerPosition = Math.min(98, Math.max(2, displayedPercentage));

  return (
    <div
      role="progressbar"
      aria-label="Mission travel cost"
      aria-valuemin={0}
      aria-valuemax={safeMaximum}
      aria-valuenow={Math.min(safeUsed, safeMaximum)}
      aria-valuetext={`${safeUsed} of ${safeMaximum} travel cost used; ${remaining} remaining`}
      className="w-full min-w-[240px] max-w-sm"
      data-testid="mission-travel-cost"
    >
      <div className="mb-2 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Travel cost
          </p>
          <p className={`text-xs font-bold ${tone.text}`}>
            {remaining === 0 ? 'BUDGET EXHAUSTED' : `${remaining} MOVES LEFT`}
          </p>
        </div>
        <output
          className="border-2 border-foreground bg-background px-2 py-1 text-xs font-bold shadow-[2px_2px_0_currentColor]"
          aria-live="polite"
        >
          {safeUsed} / {safeMaximum}
        </output>
      </div>

      <div className="relative h-6 border-2 border-foreground bg-muted shadow-[3px_3px_0_currentColor]">
        <div
          aria-hidden="true"
          className={`absolute inset-y-0 left-0 ${tone.fill} transition-[width] duration-700 ease-[steps(8,end)] motion-reduce:transition-none`}
          style={{ width: `${displayedPercentage}%` }}
        />
        <div aria-hidden="true" className="absolute inset-0 grid grid-cols-12">
          {SEGMENTS.map((segment) => (
            <span
              key={segment}
              className="border-r border-foreground/25 last:border-r-0"
            />
          ))}
        </div>
        <div
          key={safeUsed}
          aria-hidden="true"
          className={`mission-travel-thumb absolute top-1/2 z-10 flex size-8 items-center justify-center border-2 shadow-[2px_2px_0_rgba(0,0,0,0.45)] transition-[left] duration-700 ease-[steps(8,end)] motion-reduce:transition-none ${tone.thumb}`}
          style={{ left: `${markerPosition}%` }}
        >
          <Footprints className="size-4" strokeWidth={3} />
        </div>
      </div>
    </div>
  );
}
