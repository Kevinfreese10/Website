'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_LABELS: Record<string, string> = {
  admin: 'Admin',
  dashboard: 'Dashboard',
  orders: 'Orders',
  clients: 'Clients',
  tasks: 'Tasks',
  'task-templates': 'Task Templates',
  services: 'Products',
  categories: 'Categories',
  resellers: 'Partners',
  staff: 'Staff',
  users: 'Users',
  discounts: 'Discounts',
  'knowledge-base': 'Knowledge Base',
  chats: 'Chatbot History',
  media: 'Media',
  blog: 'Blog',
  pages: 'Pages',
  seo: 'SEO',
  settings: 'Settings',
  profile: 'Profile',
  subscriptions: 'Subscriptions',
  'ai-accountant': 'AI Accountant',
  'ai-payroll': 'AI Payroll',
  'demo-leads': 'Demo Leads',
  'cv-leads': 'CV Leads',
  'social-marketing': 'Social Marketing',
  community: 'Community',
  compliance: 'Compliance',
  numera: 'Numera',
  agent: 'Agent',
  new: 'New',
  'talent-profile': 'Talent Profile',
};

function prettify(segment: string) {
  if (DEFAULT_LABELS[segment]) return DEFAULT_LABELS[segment];
  if (/^[A-Za-z0-9]{15,}$/.test(segment)) return segment.slice(0, 8) + '…'; // doc ids
  return segment
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  /** Base path treated as home (linked via the home icon), e.g. "/admin/dashboard". */
  homeHref: string;
  /** Path segments before this index are not rendered (e.g. 1 hides "admin"). */
  skipSegments?: number;
  /** Override labels for specific segments, e.g. { [orderId]: order.customerName }. */
  labels?: Record<string, string>;
  /** Contextual actions rendered at the end of the trail. */
  actions?: React.ReactNode;
}

/**
 * Smart breadcrumbs derived from the current pathname, with a contextual
 * actions slot. Long opaque ids are shortened; pass `labels` to name them.
 */
export function Breadcrumbs({
  homeHref,
  skipSegments = 1,
  labels,
  actions,
  className,
  ...props
}: BreadcrumbsProps) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs = segments.slice(skipSegments).map((segment, i) => {
    const href = '/' + segments.slice(0, skipSegments + i + 1).join('/');
    return {
      href,
      label: labels?.[segment] ?? prettify(segment),
      last: i === segments.length - skipSegments - 1,
    };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex min-w-0 items-center gap-1.5 text-sm', className)}
      {...props}
    >
      <Link
        href={homeHref}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Home"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>
      <ol className="flex min-w-0 items-center gap-1.5 overflow-hidden">
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex min-w-0 items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" aria-hidden="true" />
            {crumb.last ? (
              <span className="truncate font-medium text-foreground" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="truncate text-muted-foreground transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
      {actions && <div className="ml-auto flex shrink-0 items-center gap-2 pl-4">{actions}</div>}
    </nav>
  );
}
