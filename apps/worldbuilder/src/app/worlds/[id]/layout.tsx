import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

export default function WorldLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex w-full h-screen">
        <AppSidebar />
        <div className="flex-1 w-full h-screen overflow-hidden flex flex-col">
          <SidebarTrigger className="p-4 flex-shrink-0" />
          <main className="w-full min-h-0 h-full flex-1">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
