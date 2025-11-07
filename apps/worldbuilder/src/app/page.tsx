'use client';
import React, { useState } from 'react';
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

export default function WorldsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch worlds using useApiQuery
  const { data, isLoading } =
    useApiQuery<PaginatedResponse<World>>('/api/worlds');
  const worlds = data?.data ?? [];

  const handleWorldCreated = () => {
    setIsDialogOpen(false);
  };

  const Content = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
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
    </>
  );

  const Page = withHeader(Content);
  return <Page header="Worlds" subheader="Browse all available worlds here." />;
}
