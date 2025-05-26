
"use client";

import { SidebarTrigger } from '@/components/ui/sidebar';
// UserProfileBadge removed
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
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8"> {/* Reduced height to h-16 */}
        <div className="flex items-center space-x-4">
          <SidebarTrigger className="md:hidden h-10 w-10" />
          {pageTitle && <h1 className="text-xl md:text-2xl font-bold hidden md:block">{pageTitle}</h1>} {/* Adjusted title size slightly for consistency */}
          {!pageTitle && <h1 className="text-xl md:text-2xl font-bold hidden md:block">{APP_NAME}</h1>}
        </div>
        
        <div className="flex items-center space-x-2"> {/* Removed md:space-x-4 for tighter grouping consistently */}
          {/* UserProfileBadge removed */}
          {mounted && (
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun className="h-5 w-5 md:h-6 md:w-6" /> : <Moon className="h-5 w-5 md:h-6 md:w-6" />}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

