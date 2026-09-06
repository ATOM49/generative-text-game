'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Compass, Hammer, LogIn } from 'lucide-react';
import type { AppUserRole } from '@/lib/auth/roles';
import { AppHeader } from '@/components/app-header';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

const EXPERIENCES = [
  {
    role: 'BUILDER' as const,
    href: '/worlds',
    title: 'Create and manage worlds',
    description:
      'Build settings, shape maps, and manage the factions and characters that make each world feel alive.',
    action: 'Open worldbuilder',
    icon: Hammer,
    accent: 'from-primary/15 to-primary/5 border-primary/30',
  },
  {
    role: 'EXPLORER' as const,
    href: '/explore',
    title: 'Explore worlds',
    description:
      'Choose a world, step into an existing character or create your own, and begin a persistent story.',
    action: 'Open explorer',
    icon: Compass,
    accent: 'from-secondary/20 to-secondary/5 border-secondary/40',
  },
];

export default function HomePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [pendingRole, setPendingRole] = useState<AppUserRole>();
  const [error, setError] = useState<string>();

  const openExperience = async (role: AppUserRole, href: string) => {
    if (status === 'unauthenticated') {
      router.push(`/signin?callbackUrl=${encodeURIComponent('/')}`);
      return;
    }

    if (status !== 'authenticated' || pendingRole) return;

    setPendingRole(role);
    setError(undefined);

    try {
      if (session.user?.role !== role) {
        const response = await fetch('/api/user/role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role }),
        });

        if (!response.ok) {
          throw new Error('Unable to switch experience');
        }

        // Passing data makes Auth.js issue a session-update POST. The JWT
        // callback still reads the authoritative role from the database.
        await update({ role });
      }

      router.push(href);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Unable to open this experience',
      );
      setPendingRole(undefined);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/40 to-background">
      <AppHeader />
      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-6xl flex-col justify-center gap-10 px-6 py-12">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">
            Talespin
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            What do you want to do today?
          </h1>
          <p className="text-muted-foreground">
            World creation and story exploration are separate spaces. Choose an
            experience to continue.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mx-auto max-w-2xl">
            <AlertTitle>Unable to continue</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {EXPERIENCES.map((experience) => {
            const Icon = experience.icon;
            const isPending = pendingRole === experience.role;

            return (
              <Card
                key={experience.role}
                className={`border-2 bg-gradient-to-br ${experience.accent}`}
              >
                <CardHeader className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background shadow-sm">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">
                      {experience.title}
                    </CardTitle>
                    <CardDescription className="mt-2 text-sm leading-6">
                      {experience.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {experience.role === 'BUILDER'
                    ? 'World atlas, map editor, regions, factions, characters, and settings.'
                    : 'World discovery, character choice, Story start, and Story resume.'}
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    size="lg"
                    disabled={status === 'loading' || Boolean(pendingRole)}
                    onClick={() =>
                      openExperience(experience.role, experience.href)
                    }
                  >
                    {status === 'loading' || isPending ? (
                      <Spinner />
                    ) : status === 'unauthenticated' ? (
                      <LogIn className="mr-2 h-4 w-4" />
                    ) : (
                      <Icon className="mr-2 h-4 w-4" />
                    )}
                    {status === 'unauthenticated'
                      ? 'Sign in to continue'
                      : isPending
                        ? 'Opening...'
                        : experience.action}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
