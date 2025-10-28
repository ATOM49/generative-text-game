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
        <div className="flex-1 w-full h-screen overflow-hidden">
          <SidebarTrigger className="p-4" />
          <main className="p-6 w-full">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
