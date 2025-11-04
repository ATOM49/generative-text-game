'use client';

// components/app-sidebar.tsx
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  Globe,
  Users,
  Dog,
  Scroll,
  Settings,
  ChevronLeftIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';

export function AppSidebar() {
  const path = usePathname() || '';

  const tabs = [
    { slug: 'map', label: 'Map', icon: Globe },
    { slug: 'factions', label: 'Factions', icon: Dog },
    { slug: 'rules', label: 'Rules', icon: Settings },
    // { slug: 'narrative', label: 'Narrative', icon: Scroll },
  ];
  const worldId = useMemo(() => path.split('/')[2], [path]);

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center flex-row">
        <Button asChild variant="secondary" size="icon" className="size-8 mr-2">
          <Link href="/">
            <ChevronLeftIcon />
          </Link>
        </Button>
        Worlds
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Build your world</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tabs.map(({ slug, label, icon: Icon }) => (
                <SidebarMenuItem key={slug}>
                  <SidebarMenuButton asChild isActive={path.includes(slug)}>
                    <Link href={`/worlds/${worldId}/${slug}`}>
                      <Icon className="mr-2 h-5 w-5" />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
