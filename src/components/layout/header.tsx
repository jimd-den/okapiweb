"use client";

import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserProfileBadge } from '@/components/user-profile-badge';
import { ClockWidget } from '@/components/clock-widget'; // Will be created next
import { APP_NAME } from '@/lib/constants';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes'; // Assuming next-themes is or will be installed
import { useEffect, useState } from 'react';


export function Header({ pageTitle }: { pageTitle?: string }) {
  // const { theme, setTheme } = useTheme(); // Placeholder for theme toggle
  // const [mounted, setMounted] = useState(false);

  // useEffect(() => setMounted(true), []);

  // const toggleTheme = () => {
  //   setTheme(theme === 'light' ? 'dark' : 'light');
  // };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8"> {/* Increased height for driver friendly */}
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="md:hidden h-10 w-10" /> {/* Driver friendly: larger trigger */}
          {pageTitle && <h1 className="text-2xl font-bold hidden md:block">{pageTitle}</h1>}
          {!pageTitle && <h1 className="text-2xl font-bold hidden md:block">{APP_NAME}</h1>}
        </div>
        
        <div className="flex items-center space-x-4 md:space-x-6">
          <ClockWidget />
          <UserProfileBadge />
          {/* Theme Toggle Placeholder - requires next-themes setup
          {mounted && (
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
            </Button>
          )}
          */}
        </div>
      </div>
    </header>
  );
}
