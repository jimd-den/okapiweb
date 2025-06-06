
"use client"; // Mark this file as a Client Component

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Header } from '@/components/layout/header';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { MainNav } from '@/components/layout/main-nav';
import { APP_NAME, APP_VERSION } from '@/lib/constants';
import { OkapiLogo } from '@/components/okapi-logo';

export function LayoutClientBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isSpacePage = pathname.startsWith('/spaces/');
  const isHomePage = pathname === '/';

  // If it's a space page or the home page, they handle their own full layout including header
  if (isSpacePage || isHomePage) {
    return <>{children}</>; // These pages render their own specific headers or no global header
  }

  // For other pages (e.g., Settings, Rewards), use the global layout with Header and Sidebar
  return (
    <div className="flex flex-1 overflow-hidden"> {/* Ensures this container takes up space */}
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

        <SidebarInset> {/* This should also be flex and take height */}
          {/* showSidebarTrigger defaults to true, which is correct here */}
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
  // Add other specific page titles here if needed
  return undefined; // Default if no specific title
}
