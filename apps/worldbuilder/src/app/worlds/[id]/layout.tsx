import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function WorldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex">
        <AppSidebar />
        <div className="flex-1">
          <SidebarTrigger className="p-4" />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
