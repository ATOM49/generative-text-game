'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import { AppHeader } from '@/components/app-header';
import { Spinner } from '@/components/ui/spinner';
import { WorldCreationForm } from '@/components/world-creation/world-creation-form';
import { isBuilder } from '@/lib/auth/roles';

export default function NewWorldPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const canCreateWorld = isBuilder(session?.user?.role);

  useEffect(() => {
    if (status === 'authenticated' && !canCreateWorld) {
      router.replace('/');
    }
  }, [canCreateWorld, router, status]);

  if (status === 'loading' || !canCreateWorld) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/[0.06] via-background to-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="mb-8 max-w-3xl space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
            New world
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Start small. Build somewhere alive.
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Share the seed of an idea. Talespin will reason about it, add the
            texture it needs, and connect geography, factions, and characters
            into a setting built for future missions.
          </p>
        </div>

        <WorldCreationForm />
      </main>
    </div>
  );
}
