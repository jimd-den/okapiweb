
"use client";

import { SidebarTrigger } from '@/components/ui/sidebar';
import { APP_NAME } from '@/lib/constants';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes'; 
import { useEffect, useState } from 'react';


export function Header({ pageTitle }: { pageTitle?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const toggleTheme = () => {
    setTheme(theme === 'light' || theme === 'system' ? 'dark' : 'light');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
      <div className="container flex h-14 items-center justify-between px-3 sm:px-4 lg:px-6"> {/* Reduced height */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <SidebarTrigger className="md:hidden h-9 w-9" /> {/* Slightly smaller */}
          {pageTitle && <h1 className="text-lg md:text-xl font-bold hidden md:block">{pageTitle}</h1>}
          {!pageTitle && <h1 className="text-lg md:text-xl font-bold hidden md:block">{APP_NAME}</h1>}
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2">
          {mounted && (
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme" className="h-9 w-9"> {/* Slightly smaller */}
              {theme === 'dark' ? <Sun className="h-4 w-4 md:h-5 md:w-5" /> : <Moon className="h-4 w-4 md:h-5 md:w-5" />}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
