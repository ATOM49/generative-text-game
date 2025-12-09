'use client';

import { use } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { WorldHorizontalNav } from '@/components/world-horizontal-nav';
import { Tabs, TabsContent } from '@/components/ui/tabs';

export default function WorldLayout({
  params,
  children,
}: {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}) {
  const { id } = use(params);
  const pathname = usePathname() ?? '';
  const router = useRouter();

  // derive current slug from pathname (expected: /worlds/:id/:slug)
  const parts = pathname.split('/').filter(Boolean);
  const currentSlug = parts[2] ?? 'map';

  const handleTabChange = (nextSlug: string) => {
    const href = id ? `/worlds/${id}/${nextSlug}` : `/${nextSlug}`;
    router.push(href);
  };

  // all possible tabs (union of builder/explorer)
  const allSlugs = ['map', 'factions', 'characters', 'settings', 'character'];

  return (
    <Tabs
      value={currentSlug}
      onValueChange={handleTabChange}
      className="w-full flex min-h-screen flex-col h-screen"
    >
      <WorldHorizontalNav worldId={id} />
      <main className="flex-1 flex flex-col overflow-hidden h-full">
        {allSlugs.map((slug) => (
          <TabsContent
            key={slug}
            value={slug}
            className="border-none rounded-none overflow-auto h-full flex-1 flex flex-col p-0 m-0"
          >
            {currentSlug === slug ? children : null}
          </TabsContent>
        ))}
      </main>
    </Tabs>
  );
}
