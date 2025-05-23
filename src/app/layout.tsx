
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
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
import { ThemeProvider } from "next-themes"; 

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: APP_NAME,
  description: 'Gamified workflow and task management app by Firebase Studio',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          `${geistSans.variable} ${geistMono.variable} antialiased font-sans`,
          "min-h-screen bg-background font-sans flex flex-col" // Ensure body can be a flex container for h-screen layouts
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-1 overflow-hidden"> {/* Added container for sidebar + main content */}
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

              <SidebarInset> {/* SidebarInset already applies necessary layout for main content area */}
                <main className="flex-1 flex flex-col h-full overflow-hidden"> {/* Ensure main takes full height and handles its own overflow if children don't */}
                  {children}
                </main>
              </SidebarInset>
            </SidebarProvider>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
