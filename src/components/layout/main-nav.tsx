
"use client";

import type { FC } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, ToyBrick } from 'lucide-react'; // Removed Award icon
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
  // { href: '/rewards', label: 'Rewards', icon: Award }, // Removed Rewards link
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
                className="text-lg justify-start" // Driver friendly: larger text
                tooltip={item.label} 
              >
                <a> {/* Added anchor tag for legacyBehavior */}
                  <item.icon className="h-6 w-6 mr-3 shrink-0" /> {/* Driver friendly: larger icon */}
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
