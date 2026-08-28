'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRecentItems, recordRecentItem } from '@/hooks/use-recent-items';
import {
  Briefcase,
  Calculator,
  ClipboardCheck,
  Clock,
  FileText,
  LayoutDashboard,
  Percent,
  PlusCircle,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';

const STAFF_ROLES = [
  'admin',
  'staff',
  'consultant',
  'senior_accountant',
  'accountant',
  'support_agent',
  'ai_accountant',
  'cap_staff',
  'cap_supervisor',
];

interface SearchDoc {
  id: string;
  label: string;
  sublabel?: string;
  href: string;
}

interface PageEntry {
  label: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const STAFF_PAGES: PageEntry[] = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Orders', href: '/admin/orders', icon: ShieldCheck },
  { label: 'Clients', href: '/admin/clients', icon: Briefcase },
  { label: 'Tasks', href: '/admin/tasks', icon: ClipboardCheck },
  { label: 'AI Accountant', href: '/admin/ai-accountant/clients', icon: Calculator },
  { label: 'AI Payroll', href: '/admin/ai-payroll/clients', icon: Users },
  { label: 'Products', href: '/admin/services', icon: Briefcase, adminOnly: true },
  { label: 'Partners', href: '/admin/resellers', icon: Users, adminOnly: true },
  { label: 'Users', href: '/admin/users', icon: Users, adminOnly: true },
  { label: 'Staff', href: '/admin/staff', icon: Users, adminOnly: true },
  { label: 'Blog', href: '/admin/blog', icon: FileText, adminOnly: true },
  { label: 'Discounts', href: '/admin/discounts', icon: Percent, adminOnly: true },
  { label: 'My Profile', href: '/admin/profile', icon: User },
];

const CLIENT_PAGES: PageEntry[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Orders', href: '/dashboard/orders', icon: ShieldCheck },
  { label: 'My Subscriptions', href: '/dashboard/subscriptions', icon: Percent },
  { label: 'My Profile', href: '/dashboard/profile', icon: User },
];

interface QuickAction {
  label: string;
  href: string;
  shortcut?: string;
}

const STAFF_ACTIONS: QuickAction[] = [
  { label: 'New Order', href: '/admin/orders/new' },
  { label: 'New Client', href: '/admin/clients?new=1' },
  { label: 'New Task', href: '/admin/tasks?new=1' },
];

const SHORTCUTS: Array<{ keys: string; action: string }> = [
  { keys: 'Ctrl/⌘ K', action: 'Open command palette' },
  { keys: 'G then O', action: 'Go to Orders' },
  { keys: 'G then C', action: 'Go to Clients' },
  { keys: 'G then T', action: 'Go to Tasks' },
  { keys: 'G then D', action: 'Go to Dashboard' },
  { keys: '?', action: 'Show keyboard shortcuts' },
];

function isTypingTarget(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable;
}

/**
 * Global command palette (Ctrl/Cmd+K): grouped, role-aware search across
 * clients, orders, pages and quick actions, with recently viewed items.
 * Also owns the g-key navigation shortcuts and the "?" shortcut help.
 * Open programmatically: window.dispatchEvent(new Event('open-command-palette')).
 */
export function CommandPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const recentItems = useRecentItems();

  const [open, setOpen] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const [clients, setClients] = React.useState<SearchDoc[]>([]);
  const [orders, setOrders] = React.useState<SearchDoc[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const gPressed = React.useRef<number>(0);

  const isStaff = !!(user && STAFF_ROLES.includes(user.role));
  const inAdmin = pathname.startsWith('/admin');
  const pages = isStaff && inAdmin ? STAFF_PAGES : CLIENT_PAGES;
  const isAdmin = user?.role === 'admin';

  // Load searchable records once per palette session (staff only).
  React.useEffect(() => {
    if (!open || !isStaff || loaded) return;
    let cancelled = false;
    (async () => {
      try {
        const [clientSnap, orderSnap] = await Promise.all([
          getDocs(query(collection(db, 'adminClients'), orderBy('name'), limit(300))),
          getDocs(query(collection(db, 'orders'), orderBy('date', 'desc'), limit(150))),
        ]);
        if (cancelled) return;
        setClients(
          clientSnap.docs.map((d) => {
            const data = d.data() as { name?: string; email?: string };
            return {
              id: d.id,
              label: data.name || d.id,
              sublabel: data.email,
              href: `/admin/clients?q=${encodeURIComponent(data.name || d.id)}`,
            };
          })
        );
        setOrders(
          orderSnap.docs.map((d) => {
            const data = d.data() as { customerName?: string; customerEmail?: string; status?: string };
            return {
              id: d.id,
              label: `${d.id} — ${data.customerName || data.customerEmail || 'Order'}`,
              sublabel: data.status,
              href: `/admin/orders/${d.id}`,
            };
          })
        );
        setLoaded(true);
      } catch {
        /* palette stays usable with pages/actions only */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, isStaff, loaded]);

  // Keyboard: Ctrl/Cmd+K, g-sequences, ? help, external open event.
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '?') {
        e.preventDefault();
        setHelpOpen(true);
        return;
      }
      const base = isStaff && inAdmin ? '/admin' : '/dashboard';
      if (e.key.toLowerCase() === 'g') {
        gPressed.current = Date.now();
        return;
      }
      if (Date.now() - gPressed.current < 900) {
        const map: Record<string, string> = {
          o: `${base}/orders`,
          c: isStaff && inAdmin ? '/admin/clients' : '/dashboard',
          t: isStaff && inAdmin ? '/admin/tasks' : '/dashboard',
          d: isStaff && inAdmin ? '/admin/dashboard' : '/dashboard',
        };
        const dest = map[e.key.toLowerCase()];
        if (dest) {
          e.preventDefault();
          router.push(dest);
        }
        gPressed.current = 0;
      }
    };
    const onOpenEvent = () => setOpen(true);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('open-command-palette', onOpenEvent);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('open-command-palette', onOpenEvent);
    };
  }, [router, isStaff, inAdmin]);

  const go = (href: string, recent?: Omit<Parameters<typeof recordRecentItem>[0], 'href'> & { href?: string }) => {
    setOpen(false);
    if (recent) recordRecentItem({ href, ...recent });
    router.push(href);
  };

  return (
    <>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={isStaff ? 'Search clients, orders, pages…' : 'Search pages…'} />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {recentItems.length > 0 && (
            <>
              <CommandGroup heading="Recently viewed">
                {recentItems.slice(0, 5).map((item) => (
                  <CommandItem
                    key={`recent-${item.type}-${item.id}`}
                    value={`recent ${item.label}`}
                    onSelect={() => go(item.href)}
                  >
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{item.label}</span>
                    {item.sublabel && (
                      <span className="ml-2 truncate text-xs text-muted-foreground">{item.sublabel}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {isStaff && inAdmin && (
            <>
              <CommandGroup heading="Quick actions">
                {STAFF_ACTIONS.map((action) => (
                  <CommandItem key={action.href} value={action.label} onSelect={() => go(action.href)}>
                    <PlusCircle className="mr-2 h-4 w-4 text-primary" />
                    {action.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          <CommandGroup heading="Pages">
            {pages
              .filter((p) => !p.adminOnly || isAdmin)
              .map((page) => (
                <CommandItem key={page.href} value={`page ${page.label}`} onSelect={() => go(page.href)}>
                  <page.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {page.label}
                </CommandItem>
              ))}
          </CommandGroup>

          {isStaff && inAdmin && clients.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Clients">
                {clients.map((c) => (
                  <CommandItem
                    key={`client-${c.id}`}
                    value={`client ${c.label} ${c.sublabel ?? ''}`}
                    onSelect={() => go(c.href, { type: 'client', id: c.id, label: c.label, sublabel: c.sublabel })}
                  >
                    <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{c.label}</span>
                    {c.sublabel && (
                      <span className="ml-2 truncate text-xs text-muted-foreground">{c.sublabel}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {isStaff && inAdmin && orders.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Orders">
                {orders.map((o) => (
                  <CommandItem
                    key={`order-${o.id}`}
                    value={`order ${o.label}`}
                    onSelect={() => go(o.href, { type: 'order', id: o.id, label: o.label, sublabel: o.sublabel })}
                  >
                    <ShieldCheck className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{o.label}</span>
                    {o.sublabel && (
                      <span className="ml-2 truncate text-xs text-muted-foreground">{o.sublabel}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          <CommandSeparator />
          <CommandGroup heading="Help">
            <CommandItem value="keyboard shortcuts help" onSelect={() => { setOpen(false); setHelpOpen(true); }}>
              <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
              Keyboard shortcuts
              <CommandShortcut>?</CommandShortcut>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Keyboard shortcuts</DialogTitle>
          </DialogHeader>
          <ul className="space-y-2">
            {SHORTCUTS.map((s) => (
              <li key={s.keys} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{s.action}</span>
                <kbd className="rounded-md border bg-muted px-2 py-0.5 font-mono text-xs">{s.keys}</kbd>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}
