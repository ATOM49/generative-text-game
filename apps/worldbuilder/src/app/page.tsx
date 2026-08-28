'use client';

import React, { useEffect } from 'react';
import { World } from '@talespin/schema';
import { Button } from '@/components/ui/button';
import { useApiQuery } from '@/hooks/useApiQuery';
import { PaginatedResponse } from '@/lib/api/types';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/spinner';
import { isBuilder } from '@/lib/auth/roles';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { Sparkles } from 'lucide-react';
import { WorldsGrid } from '@/components/worlds-grid';

export default function WorldsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isSessionLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const canCreateWorld = isBuilder(session?.user?.role);
  // Redirect to role selection if authenticated but no role
  useEffect(() => {
    if (isAuthenticated && session?.user && !session.user.role) {
      const callbackUrl = encodeURIComponent(window.location.href);
      router.push(`/choose-role?callbackUrl=${callbackUrl}`);
    }
  }, [isAuthenticated, session, router]);

  // Fetch worlds using useApiQuery
  const { data, isLoading } = useApiQuery<PaginatedResponse<World>>(
    '/api/worlds',
    undefined,
    { enabled: isAuthenticated && !!session?.user?.role },
  );
  const worlds = data?.data ?? [];

  const content = isSessionLoading ? (
    <div className="flex h-full items-center justify-center">
      <Spinner />
    </div>
  ) : (
    <div className="space-y-6 p-6">
      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Talespin
          </p>
          <h1 className="text-3xl font-bold">World Atlas</h1>
          <p className="text-muted-foreground mt-2">
            {canCreateWorld
              ? 'Forge vivid realms for the Talespin collective—your creations become the stages for every future adventure.'
              : 'Venture through the Talespin multiverse and bookmark the worlds calling your next heroic chapter.'}
          </p>
        </div>
        {canCreateWorld && (
          <Button
            size="sm"
            className="inline-flex items-center gap-2"
            onClick={() => router.push('/worlds/new')}
          >
            <Sparkles className="h-4 w-4" />
            New World
          </Button>
        )}
      </div>
      <WorldsGrid
        worlds={worlds}
        canCreateWorld={canCreateWorld}
        isLoading={isLoading}
      />
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1">{content}</main>
    </div>
  );
}
