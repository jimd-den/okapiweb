
"use client"; 

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Header, MainNav, OkapiLogo } from '@/components/layout'; // Updated to use barrel import
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { APP_NAME, APP_VERSION } from '@/lib/constants';

export function LayoutClientBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isSpacePage = pathname.startsWith('/spaces/');
  const isHomePage = pathname === '/';

  if (isSpacePage || isHomePage) {
    return <>{children}</>; 
  }

  return (
    <div className="flex flex-1 overflow-hidden"> 
      <SidebarProvider defaultOpen={true} collapsible="icon">
        <Sidebar className="border-r shadow-md">
          <SidebarHeader className="p-4 flex items-center gap-2">
            <OkapiLogo className="h-10 w-10 text-primary" />
            <h2 className="text-2xl font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
              {APP_NAME}
            </h2>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <MainNav />
          </SidebarContent>
          <SidebarFooter className="p-4 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
            <p>&copy; {new Date().getFullYear()} {APP_NAME}</p>
            <p>Version {APP_VERSION}</p>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset> 
          <Header pageTitle={getPageTitle(pathname)} /> 
          <main className="flex-1 flex flex-col h-full overflow-hidden">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}

function getPageTitle(pathname: string): string | undefined {
  if (pathname === '/settings') return "Application Settings";
  if (pathname === '/rewards') return "Rewards & Progress";
  return undefined; 
}
