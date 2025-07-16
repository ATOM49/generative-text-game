"use client";

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
} from "@/components/ui/sidebar";
import { Globe, Users, Dog, Scroll, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppSidebar() {
  const path = usePathname() || "";

  const tabs = [
    { slug: "locations", label: "Locations & Regions", icon: Globe },
    { slug: "factions", label: "Factions & Cultures", icon: Users },
    { slug: "species", label: "Species & Entities", icon: Dog },
    { slug: "rules", label: "Global Rules", icon: Settings },
    { slug: "narrative", label: "Narrative", icon: Scroll },
  ];

  return (
    <Sidebar>
      <SidebarHeader>Your Worlds</SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>World Sections</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tabs.map(({ slug, label, icon: Icon }) => (
                <SidebarMenuItem key={slug}>
                  <SidebarMenuButton asChild isActive={path.includes(slug)}>
                    <Link
                      href={
                        slug === "locations"
                          ? "/worlds"
                          : `/worlds/${path.split("/")[2]}/${slug}`
                      }
                    >
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
