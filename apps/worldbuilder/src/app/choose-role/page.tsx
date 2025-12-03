'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { USER_ROLES } from '@/lib/auth/roles';
import type { AppUserRole } from '@/lib/auth/roles';

const ROLE_CARDS: Record<
  AppUserRole,
  {
    title: string;
    description: string;
    highlights: string[];
    accent: string;
    cta: string;
  }
> = {
  BUILDER: {
    title: 'Build vibrant worlds',
    description:
      'Design realms, craft regions, and collaborate with AI tools to bring your imagination to life.',
    highlights: [
      'Create and edit maps with AI-assisted workflows',
      'Manage factions, characters, and lore at scale',
      'Unlock advanced tooling for campaign planning',
    ],
    accent: 'from-primary/10 to-primary/5 border-primary/40',
    cta: 'Start building',
  },
  EXPLORER: {
    title: 'Explore living stories',
    description:
      'Dive into curated adventures, track discoveries, and experience dynamic narratives with your group.',
    highlights: [
      'Browse shared worlds and regions',
      'Track treasure hunts and exploration progress',
      'Receive tailored prompts during play sessions',
    ],
    accent: 'from-secondary/10 to-secondary/5 border-secondary/40',
    cta: 'Start exploring',
  },
};

export default function ChooseRolePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const callbackUrl = searchParams.get('callbackUrl');
  const displayName =
    session?.user?.name || session?.user?.email || 'your account';

  // Redirect to signin if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      const signinTarget = callbackUrl
        ? `/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
        : '/signin';
      router.push(signinTarget);
    }
  }, [status, callbackUrl, router]);

  // Redirect to callback if already has role
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
      router.push(callbackUrl ?? '/');
    }
  }, [status, session?.user?.role, callbackUrl, router]);

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const handleRoleSelection = async (role: AppUserRole) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/user/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      // Trigger session refresh to update JWT
      await update();

      // Small delay to ensure session is updated
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Redirect to callback or home
      router.push(callbackUrl ?? '/');
    } catch (error) {
      console.error('Error updating role:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4 py-12">
      <div className="w-full max-w-5xl space-y-10 rounded-3xl border bg-background p-10 shadow-xl">
        <div className="text-center space-y-3">
          <p className="text-sm font-semibold text-primary">
            Welcome to Talespin
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            How do you want to get started?
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Pick the mode that best matches your next session. You can always
            change it later if your responsibilities shift.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {USER_ROLES.map((role) => (
            <Card
              key={role}
              className={cn(
                'relative overflow-hidden border-2',
                ROLE_CARDS[role].accent,
              )}
            >
              <CardHeader>
                <CardTitle>{ROLE_CARDS[role].title}</CardTitle>
                <CardDescription>
                  {ROLE_CARDS[role].description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {ROLE_CARDS[role].highlights.map((highlight) => (
                    <li key={highlight} className="flex items-start gap-2">
                      <span className="mt-1 size-2 rounded-full bg-primary" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button
                  className="w-full"
                  onClick={() => handleRoleSelection(role)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Setting up...' : ROLE_CARDS[role].cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Signed in as <span className="font-medium">{displayName}</span> ·
          Choose an option to continue to{' '}
          {callbackUrl ? 'your destination' : 'the dashboard'}.
        </p>
      </div>
    </div>
  );
}
