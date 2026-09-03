'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Briefcase,
  ClipboardCheck,
  LayoutDashboard,
  Percent,
  Search,
  ShieldCheck,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  match: (pathname: string) => boolean;
}

const STAFF_ITEMS: NavItem[] = [
  { label: 'Home', href: '/admin/dashboard', icon: LayoutDashboard, match: (p) => p.startsWith('/admin/dashboard') },
  { label: 'Orders', href: '/admin/orders', icon: ShieldCheck, match: (p) => p.startsWith('/admin/orders') },
  { label: 'Clients', href: '/admin/clients', icon: Briefcase, match: (p) => p.startsWith('/admin/clients') },
  { label: 'Tasks', href: '/admin/tasks', icon: ClipboardCheck, match: (p) => p.startsWith('/admin/tasks') },
];

const PARTNER_ITEMS: NavItem[] = [
  { label: 'Home', href: '/partner/dashboard', icon: LayoutDashboard, match: (p) => p.startsWith('/partner/dashboard') },
  { label: 'Orders', href: '/partner/orders', icon: ShieldCheck, match: (p) => p.startsWith('/partner/orders') },
  { label: 'Clients', href: '/partner/clients', icon: Briefcase, match: (p) => p.startsWith('/partner/clients') },
  { label: 'Tasks', href: '/partner/tasks', icon: ClipboardCheck, match: (p) => p.startsWith('/partner/tasks') },
];

const CLIENT_ITEMS: NavItem[] = [
  { label: 'Home', href: '/dashboard', icon: LayoutDashboard, match: (p) => p === '/dashboard' },
  { label: 'Orders', href: '/dashboard/orders', icon: ShieldCheck, match: (p) => p.startsWith('/dashboard/orders') },
  { label: 'Plans', href: '/dashboard/subscriptions', icon: Percent, match: (p) => p.startsWith('/dashboard/subscriptions') },
  { label: 'Profile', href: '/dashboard/profile', icon: User, match: (p) => p.startsWith('/dashboard/profile') },
];

/**
 * Thumb-accessible bottom navigation for the logged-in portals on mobile.
 * Hidden from md upward; the last slot opens the command palette.
 */
export function MobileBottomNav({ variant }: { variant: 'admin' | 'partner' | 'client' }) {
  const pathname = usePathname();
  const { user } = useAuth();
  if (!user) return null;

  const items = variant === 'admin' 
    ? STAFF_ITEMS 
    : variant === 'partner' 
    ? PARTNER_ITEMS 
    : CLIENT_ITEMS;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="flex items-stretch">
        {items.map((item) => {
          const active = item.match(pathname);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                    active && 'bg-primary/10'
                  )}
                >
                  <item.icon className="h-[18px] w-[18px]" />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
            className="flex w-full flex-col items-center gap-0.5 py-2 text-[10px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="flex h-7 w-12 items-center justify-center rounded-full">
              <Search className="h-[18px] w-[18px]" />
            </span>
            Search
          </button>
        </li>
      </ul>
    </nav>
  );
}
