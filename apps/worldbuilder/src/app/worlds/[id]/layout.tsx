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
  const allSlugs = [
    'map',
    'regions',
    'factions',
    'characters',
    'settings',
    'character',
  ];

  return (
    <Tabs
      value={currentSlug}
      onValueChange={handleTabChange}
      className="flex h-dvh min-h-0 w-full flex-col overflow-hidden"
    >
      <WorldHorizontalNav worldId={id} />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {allSlugs.map((slug) => (
          <TabsContent
            key={slug}
            value={slug}
            className="m-0 flex min-h-0 flex-1 flex-col overflow-y-auto rounded-none border-none p-0"
          >
            {currentSlug === slug ? children : null}
          </TabsContent>
        ))}
      </main>
    </Tabs>
  );
}
