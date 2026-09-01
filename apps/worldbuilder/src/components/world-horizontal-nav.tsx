'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { isBuilder } from '@/lib/auth/roles';
import { ArrowLeft, ChevronUp } from 'lucide-react';

import {
  HorizontalNav,
  HorizontalNavContent,
  HorizontalNavFooter,
  HorizontalNavHeader,
} from '@/components/ui/horizontal-nav';
import { Button } from '@/components/ui/button';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { UserAvatarMenu } from '@/components/auth/user-avatar-menu';
import { LogoutButton } from '@/components/auth/logout-button';

type NavItem = {
  slug: string;
  label: string;
  hasUpdate?: boolean;
};

const BUILDER_ITEMS: NavItem[] = [
  { slug: 'map', label: 'Map' },
  { slug: 'factions', label: 'Factions' },
  { slug: 'characters', label: 'Characters' },
  { slug: 'settings', label: 'Settings' },
];

const EXPLORER_ITEMS: NavItem[] = [
  { slug: 'map', label: 'Map' },
  { slug: 'character', label: 'Character' },
];

type WorldHorizontalNavProps = {
  worldId?: string;
  items?: NavItem[];
  showBackButton?: boolean;
  showMenu?: boolean;
};

export function WorldHorizontalNav({
  worldId: providedWorldId,
  items,
  showBackButton = true,
  showMenu = true,
}: WorldHorizontalNavProps) {
  const { data: session } = useSession();
  const userIsBuilder = isBuilder(session?.user?.role);
  const menuItems = items ?? (userIsBuilder ? BUILDER_ITEMS : EXPLORER_ITEMS);
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const worldId = useMemo(() => {
    if (providedWorldId) {
      return providedWorldId;
    }

    const parts = pathname.split('/');
    return parts[2];
  }, [pathname, providedWorldId]);

  const activeSlug = useMemo(() => {
    if (!menuItems.length) {
      return '';
    }
    const matched = menuItems.find((item) => pathname.includes(item.slug));
    return matched?.slug ?? menuItems[0].slug;
  }, [menuItems, pathname]);

  const handleTabChange = useCallback(
    (nextSlug: string) => {
      const href = worldId ? `/worlds/${worldId}/${nextSlug}` : `/${nextSlug}`;
      router.push(href);
    },
    [router, worldId],
  );

  const hasMenu = showMenu && menuItems.length > 0;

  return (
    <HorizontalNav className="w-full">
      <HorizontalNavHeader>
        {showBackButton ? (
          <Button
            variant="ghost"
            size="sm"
            className="uppercase tracking-[0.2em]"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Worlds
          </Button>
        ) : (
          <div className="flex items-center">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
              Talespin
            </span>
          </div>
        )}
      </HorizontalNavHeader>
      <HorizontalNavContent className="h-full">
        {hasMenu ? (
          <TabsList className="flex w-full h-full flex-wrap items-center justify-center gap-4 bg-transparent p-0 text-sidebar-foreground/70">
            {menuItems.map(({ slug, label, hasUpdate }) => {
              return (
                <TabsTrigger
                  key={slug}
                  value={slug}
                  onClick={() => handleTabChange(slug)}
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-1 rounded-none bg-transparent px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors duration-200',
                    activeSlug === slug
                      ? 'text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70',
                    'focus-visible:outline-none focus-visible:ring-0',
                  )}
                >
                  {hasUpdate && (
                    <span
                      aria-hidden
                      className="bg-destructive block size-1 rounded-full"
                    />
                  )}
                  <span className="leading-none">{label}</span>
                  {activeSlug === slug && (
                    <ChevronUp
                      className="h-3 w-3 text-sidebar-accent-foreground"
                      aria-hidden
                    />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        ) : (
          <div className="h-10" aria-hidden />
        )}
      </HorizontalNavContent>
      <HorizontalNavFooter>
        <div className="flex items-center gap-1">
          <UserAvatarMenu />
          {session?.user ? <LogoutButton compact /> : null}
        </div>
      </HorizontalNavFooter>
    </HorizontalNav>
  );
}
