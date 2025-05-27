
"use client";

import { SidebarTrigger } from '@/components/ui/sidebar';
import { APP_NAME } from '@/lib/constants';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes'; 
import { useEffect, useState } from 'react';

interface HeaderProps {
  pageTitle?: string;
  showSidebarTrigger?: boolean; // New prop
}

export function Header({ pageTitle, showSidebarTrigger = true }: HeaderProps) { // Default to true
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    setTheme(theme === 'light' || theme === 'system' ? 'dark' : 'light');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 shrink-0">
      <div className="container flex h-12 items-center justify-between px-3 sm:px-4"> {/* Reduced height */}
        <div className="flex items-center space-x-1.5 sm:space-x-2">
          {showSidebarTrigger && <SidebarTrigger className="md:hidden h-8 w-8" />} {/* Conditional render */}
          {pageTitle && <h1 className="text-md md:text-lg font-semibold hidden md:block">{pageTitle}</h1>}
          {!pageTitle && <h1 className="text-md md:text-lg font-semibold hidden md:block">{APP_NAME}</h1>}
        </div>
        
        <div className="flex items-center space-x-1">
          {mounted && (
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="h-8 w-8">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
