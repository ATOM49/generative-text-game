'use client';
import React from 'react';
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

export default function WorldsPage() {
  // Fetch worlds using useApiQuery
  const { data: worlds = [], isLoading } = useApiQuery<World[]>('/api/worlds');

  return (
    <main className="font-custom p-8">
      <h1 className="text-2xl font-bold mb-4">Worlds</h1>
      <p>Browse all available worlds here.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          worlds.map((world) => (
            <Link href={`/worlds/${world.id}`} key={world.id}>
              <Card>
                <CardHeader>
                  <CardTitle>{world.name}</CardTitle>
                  <CardDescription>{world.theme}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>{world.rules}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Context Window Limit: {world.contextWindowLimit}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
      <Dialog>
        <DialogTrigger asChild>
          <Button>Create World</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New World</DialogTitle>
          </DialogHeader>
          <WorldFormComponent />
        </DialogContent>
      </Dialog>
    </main>
  );
}
