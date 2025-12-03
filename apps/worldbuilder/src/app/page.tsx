'use client';
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { World } from '@talespin/schema';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import Link from 'next/link';
import { useApiQuery } from '@/hooks/useApiQuery';
import WorldFormComponent from '@/components/form/world';
import { PaginatedResponse } from '@/lib/api/types';
import { withHeader } from '@/components/withHeader';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/spinner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ROLE_LABELS, isBuilder } from '@/lib/auth/roles';
import { UserMenu } from '@/components/auth/user-menu';
import { useRouter } from 'next/navigation';

export default function WorldsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const isSessionLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';
  const canCreateWorld = isBuilder(session?.user?.role);
  const roleLabel = session?.user?.role
    ? ROLE_LABELS[session.user.role]
    : 'Explorer';

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

  const handleWorldCreated = () => {
    setIsDialogOpen(false);
  };

  const Content = () => {
    if (isSessionLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <Spinner />
        </div>
      );
    }

    return (
      <>
        <div className="max-w-xs">
          <UserMenu />
        </div>
        {!canCreateWorld && (
          <Alert>
            <AlertTitle>Explorer access</AlertTitle>
            <AlertDescription>
              You can browse existing worlds but only builders can create or
              modify them. You are currently signed in as{' '}
              {session?.user?.name || roleLabel}.
            </AlertDescription>
          </Alert>
        )}
        <div className="grid grid-cols-1 gap-6 my-8 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            worlds.map((world) => (
              <Link href={`/worlds/${world._id}`} key={world._id}>
                <Card>
                  <CardHeader>
                    <CardTitle>{world.name}</CardTitle>
                    <CardDescription>{world.theme}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground mt-2">
                      Context Window Limit: {world.contextWindowLimit}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
        {canCreateWorld && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create World</Button>
            </DialogTrigger>
            <DialogContent showCloseButton>
              <DialogHeader>
                <DialogTitle>Create a New World</DialogTitle>
              </DialogHeader>
              <WorldFormComponent onSuccess={handleWorldCreated} />
            </DialogContent>
          </Dialog>
        )}
      </>
    );
  };

  const Page = withHeader(Content);
  return <Page header="Worlds" subheader="Browse all available worlds here." />;
}
