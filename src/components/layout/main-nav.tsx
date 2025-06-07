
"use client";

import type { FC } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, ToyBrick } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

interface NavItem {
  href: string;
  label: string;
  icon: FC<React.SVGProps<SVGSVGElement>>;
  matchExact?: boolean;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Spaces', icon: ToyBrick, matchExact: true },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        const isActive = item.matchExact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <SidebarMenuItem key={item.href}>
            <Link href={item.href} passHref legacyBehavior>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                size="lg" // Use larger size for sidebar buttons
                className="justify-start py-3 text-lg" // Explicitly ensure text-lg and padding
                tooltip={item.label} 
              >
                <a> 
                  <item.icon className="h-6 w-6 mr-3 shrink-0" /> 
                  <span className="truncate">{item.label}</span>
                </a>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

    