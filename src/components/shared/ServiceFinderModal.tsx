'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Command as CommandPrimitive } from 'cmdk';
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Calculator,
  Clock,
  ExternalLink,
  FileBadge,
  HardHat,
  MessageCircle,
  Receipt,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import {
  SERVICE_FINDER_GROUPS,
  SERVICE_FINDER_OPEN_EVENT,
  SERVICE_FINDER_STORAGE_KEY,
  describeItem,
  getPopularServices,
  isAutoOpenEligiblePath,
  searchServices,
  type ServiceFinderGroupId,
  type ServiceFinderItem,
} from '@/lib/service-finder';

/** Delay before the modal opens on its own, so it never interrupts the first view of a page. */
const AUTO_OPEN_DELAY_MS = 8000;

type OpenTrigger = 'auto' | 'manual';
type BrowseTab = 'popular' | ServiceFinderGroupId;

let cachedItems: ServiceFinderItem[] | null = null;
let inflight: Promise<ServiceFinderItem[]> | null = null;

function loadItems(): Promise<ServiceFinderItem[]> {
  if (cachedItems) return Promise.resolve(cachedItems);
  if (!inflight) {
    inflight = fetch('/api/service-finder')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: { items: ServiceFinderItem[] }) => {
        cachedItems = data.items;
        return data.items;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

function track(event: string, params: Record<string, unknown> = {}) {
  try {
    (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag?.('event', event, params);
  } catch {
    /* analytics must never break the UI */
  }
}

function readStoredState(): string | null {
  try {
    return window.localStorage.getItem(SERVICE_FINDER_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredState(state: 'dismissed' | 'used') {
  try {
    window.localStorage.setItem(SERVICE_FINDER_STORAGE_KEY, JSON.stringify({ state, at: new Date().toISOString() }));
  } catch {
    /* private mode / storage disabled */
  }
}

function priceLabel(item: ServiceFinderItem): string {
  if (item.price === null) return 'Quote on request';
  if (item.price === 0) return 'Free';
  return formatPrice(item.price);
}

function isBusyElsewhere(): boolean {
  const active = document.activeElement as HTMLElement | null;
  const typing =
    !!active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT' || active.isContentEditable);
  const otherDialogOpen = !!document.querySelector('[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"]');
  return typing || otherDialogOpen || document.visibilityState !== 'visible';
}

export default function ServiceFinderModal() {
  const router = useRouter();
  const pathname = usePathname();
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<OpenTrigger>('manual');

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ServiceFinderItem[] | null>(cachedItems);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<BrowseTab>('popular');

  const openFinder = useCallback((trigger: OpenTrigger) => {
    triggerRef.current = trigger;
    setOpen(true);
    track('service_finder_open', { trigger });
  }, []);

  // Manual open: header button / CTAs dispatch an event; a pending flag covers clicks made
  // before this lazily-loaded component finished mounting.
  useEffect(() => {
    const handler = () => {
      window.__myaccServiceFinderPending = false;
      openFinder('manual');
    };
    if (window.__myaccServiceFinderPending) handler();
    window.addEventListener(SERVICE_FINDER_OPEN_EVENT, handler);
    return () => window.removeEventListener(SERVICE_FINDER_OPEN_EVENT, handler);
  }, [openFinder]);

  // Keyboard shortcuts: Ctrl/Cmd + K anywhere, or "/" when not typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      const target = e.target as HTMLElement | null;
      const inField = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isCmdK || (e.key === '/' && !inField && !e.metaKey && !e.ctrlKey && !e.altKey)) {
        e.preventDefault();
        openFinder('manual');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openFinder]);

  // Auto-open once per visitor, after a delay, only on eligible marketing pages.
  useEffect(() => {
    if (!isAutoOpenEligiblePath(pathname) || readStoredState()) return;
    const prefetch = window.setTimeout(() => void loadItems().catch(() => undefined), AUTO_OPEN_DELAY_MS - 2500);
    const timer = window.setTimeout(() => {
      if (readStoredState() || isBusyElsewhere()) return;
      openFinder('auto');
    }, AUTO_OPEN_DELAY_MS);
    return () => {
      window.clearTimeout(prefetch);
      window.clearTimeout(timer);
    };
  }, [pathname, openFinder]);

  // Load the service index the first time the modal opens.
  useEffect(() => {
    if (!open || items) return;
    let cancelled = false;
    setLoadError(false);
    loadItems()
      .then(data => !cancelled && setItems(data))
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, [open, items]);

  const results = useMemo(() => (items && query.trim() ? searchServices(items, query) : []), [items, query]);
  const popular = useMemo(() => (items ? getPopularServices(items, 6) : []), [items]);
  const groupItems = useMemo(
    () =>
      items && tab !== 'popular'
        ? items.filter(i => i.group === tab).sort((a, b) => a.title.localeCompare(b.title))
        : [],
    [items, tab]
  );
  const isSearching = query.trim().length > 0;

  // Search analytics (debounced) — "no results" terms show which services people want but can't find.
  useEffect(() => {
    if (!isSearching || !items) return;
    const t = window.setTimeout(() => {
      track('search', { search_term: query.trim(), source: 'service_finder' });
      if (results.length === 0) track('service_finder_no_results', { search_term: query.trim() });
    }, 1200);
    return () => window.clearTimeout(t);
  }, [query, isSearching, items, results.length]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      if (readStoredState() === null) writeStoredState('dismissed');
      setQuery('');
      setTab('popular');
    }
    setOpen(next);
  };

  const choose = (item: ServiceFinderItem) => {
    writeStoredState('used');
    track('service_finder_select', {
      item_id: item.id,
      item_name: item.title,
      price: item.price ?? undefined,
      search_term: query.trim() || undefined,
      trigger: triggerRef.current,
    });
    setOpen(false);
    setQuery('');
    setTab('popular');
    router.push(item.href);
  };

  const closeAfterNavigate = () => {
    writeStoredState('used');
    track('service_finder_contact', { search_term: query.trim() || undefined });
    setOpen(false);
    setQuery('');
    setTab('popular');
  };

  const announce = !items
    ? loadError
      ? 'Services could not be loaded.'
      : 'Loading services.'
    : isSearching
      ? `${results.length} ${results.length === 1 ? 'service' : 'services'} found.`
      : '';

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onOpenAutoFocus={e => {
            e.preventDefault();
            // Don't pop the on-screen keyboard over the cards when the modal opened on its own on a phone.
            const coarse = window.matchMedia?.('(pointer: coarse)').matches;
            if (!(coarse && triggerRef.current === 'auto')) inputRef.current?.focus();
          }}
          className={cn(
            'fixed inset-0 z-[70] flex flex-col bg-background text-foreground shadow-2xl outline-none',
            'sm:inset-auto sm:left-1/2 sm:top-[7vh] sm:w-[min(92vw,46rem)] sm:max-h-[86dvh] sm:-translate-x-1/2 sm:rounded-2xl sm:border sm:border-border',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 sm:data-[state=open]:zoom-in-95 sm:data-[state=closed]:zoom-out-95'
          )}
        >
          <CommandPrimitive shouldFilter={false} loop label="Search services" className="flex min-h-0 flex-1 flex-col">
            {/* Header + search */}
            <div className="relative border-b border-border bg-gradient-to-b from-primary/[0.06] to-transparent px-5 pb-4 pt-6 sm:px-8 sm:pt-7 sm:rounded-t-2xl">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-2">
                  <GoogleRatingBadge />
                  <DialogPrimitive.Title className="font-headline text-2xl font-black leading-tight tracking-tight sm:text-[1.75rem]">
                    Which service are you looking for today?
                  </DialogPrimitive.Title>
                  <DialogPrimitive.Description className="text-[15px] text-muted-foreground">
                    Fixed prices and turnaround times upfront. No hidden fees.
                  </DialogPrimitive.Description>
                </div>
                <DialogPrimitive.Close
                  className="-mr-2 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Close service finder"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </DialogPrimitive.Close>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm transition-all focus-within:border-[hsl(var(--primary))] focus-within:shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]">
                <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
                <CommandPrimitive.Input
                  ref={inputRef}
                  value={query}
                  onValueChange={setQuery}
                  placeholder='Try "VAT", "company registration" or "tax return"'
                  aria-label="Search for a service"
                  className="h-14 w-full bg-transparent text-lg text-foreground outline-none placeholder:text-slate-400"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      inputRef.current?.focus();
                    }}
                    aria-label="Clear search"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              {!isSearching && (
                <div className="relative mt-4">
                  <div
                    className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 pr-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    role="group"
                    aria-label="Browse by category"
                  >
                    {[{ id: 'popular' as const, label: 'Popular' }, ...SERVICE_FINDER_GROUPS].map(g => {
                      const Icon = GROUP_ICONS[g.id];
                      const active = tab === g.id;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setTab(g.id)}
                          className={cn(
                            'inline-flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            active
                              ? 'border-transparent bg-slate-900 text-white shadow-sm'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          )}
                        >
                          <Icon className={cn('h-4 w-4', active ? 'text-white' : 'text-slate-400')} aria-hidden="true" />
                          {g.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent" aria-hidden="true" />
                </div>
              )}
            </div>

            <p className="sr-only" aria-live="polite">
              {announce}
            </p>

            {/* Results / browse area */}
            <CommandPrimitive.List className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-6">
              {!items && !loadError && (
                <div className="grid grid-cols-1 gap-3 px-2 sm:grid-cols-2" aria-hidden="true">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
                  ))}
                </div>
              )}

              {loadError && (
                <NotFound query="" message="We couldn't load the service list right now." onNavigate={closeAfterNavigate} />
              )}

              {items && isSearching && results.length > 0 && (
                <CommandPrimitive.Group heading={`Results for “${query.trim()}”`} className={groupHeadingClass}>
                  {results.map(item => (
                    <ResultRow key={item.id} item={item} onSelect={choose} />
                  ))}
                </CommandPrimitive.Group>
              )}

              {items && isSearching && results.length === 0 && (
                <NotFound query={query.trim()} onNavigate={closeAfterNavigate} />
              )}

              {items && !isSearching && tab === 'popular' && (
                <CommandPrimitive.Group heading="Most popular services" className={groupHeadingClass}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {popular.map(item => (
                      <PopularCard key={item.id} item={item} onSelect={choose} />
                    ))}
                  </div>
                </CommandPrimitive.Group>
              )}

              {items && !isSearching && tab !== 'popular' && (
                <CommandPrimitive.Group
                  heading={SERVICE_FINDER_GROUPS.find(g => g.id === tab)?.label}
                  className={groupHeadingClass}
                >
                  {groupItems.map(item => (
                    <ResultRow key={item.id} item={item} onSelect={choose} />
                  ))}
                </CommandPrimitive.Group>
              )}
            </CommandPrimitive.List>

            {/* Footer */}
            <div className="flex flex-col gap-2 border-t border-border bg-slate-50/80 px-5 py-3.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:rounded-b-2xl">
              <Link
                href="/products/free-sars-and-cipc-assessment"
                onClick={() => {
                  writeStoredState('used');
                  setOpen(false);
                }}
                className="inline-flex min-h-[44px] items-center gap-2 font-semibold text-[hsl(var(--primary))] hover:underline"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Not sure? Get a free SARS &amp; CIPC assessment
              </Link>
              <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
                <li className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                  SARS registered practitioners
                </li>
                <li className="hidden items-center gap-1.5 md:inline-flex">
                  <BadgeCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                  Fixed prices
                </li>
              </ul>
            </div>
          </CommandPrimitive>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

const groupHeadingClass =
  '[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-3 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-slate-500';

const GROUP_ICONS: Record<BrowseTab, LucideIcon> = {
  popular: Star,
  tax: Receipt,
  registration: Building2,
  accounting: Calculator,
  industry: HardHat,
  licences: FileBadge,
  other: Briefcase,
};

const GROUP_TINTS: Record<ServiceFinderGroupId, string> = {
  tax: 'bg-blue-50 text-blue-600',
  registration: 'bg-violet-50 text-violet-600',
  accounting: 'bg-emerald-50 text-emerald-600',
  industry: 'bg-amber-50 text-amber-600',
  licences: 'bg-rose-50 text-rose-600',
  other: 'bg-slate-100 text-slate-600',
};

function GroupIcon({ group, className }: { group: ServiceFinderGroupId; className?: string }) {
  const Icon = GROUP_ICONS[group];
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-xl', GROUP_TINTS[group], className)} aria-hidden="true">
      <Icon className="h-5 w-5" />
    </span>
  );
}

const GOOGLE_PROFILE_URL = 'https://g.page/r/CVIOzn2bYoiaEAE';
const GOOGLE_RATING = '4.9';

function GoogleRatingBadge() {
  return (
    <a
      href={GOOGLE_PROFILE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Rated ${GOOGLE_RATING} out of 5 on Google from over 200 reviews. Read our Google reviews (opens in a new tab)`}
      className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1.5 pr-3 text-xs shadow-sm transition-all hover:border-slate-300 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <GoogleG className="h-4 w-4" />
      <span className="font-bold text-slate-900">{GOOGLE_RATING}</span>
      <span className="flex" aria-hidden="true">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        ))}
      </span>
      <span className="text-slate-500">
        200+ Google reviews
      </span>
      <ExternalLink className="h-3 w-3 text-slate-400 transition-colors group-hover:text-slate-700" aria-hidden="true" />
    </a>
  );
}

function GoogleG({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function ResultRow({ item, onSelect }: { item: ServiceFinderItem; onSelect: (i: ServiceFinderItem) => void }) {
  const price = priceLabel(item);
  return (
    <CommandPrimitive.Item
      value={item.id}
      onSelect={() => onSelect(item)}
      aria-label={describeItem(item, price)}
      className="group flex cursor-pointer items-center gap-3.5 rounded-xl px-3 py-3 outline-none transition-colors hover:bg-slate-50 data-[selected=true]:bg-slate-100/80"
    >
      <GroupIcon group={item.group} className="h-10 w-10" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold text-foreground sm:text-base">{item.title}</p>
        <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-slate-500">
          <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {item.turnaround}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-900 group-data-[selected=true]:bg-white">
        {price}
      </span>
      <ArrowRight
        className="hidden h-4 w-4 shrink-0 text-slate-400 transition-all group-data-[selected=true]:translate-x-0.5 group-data-[selected=true]:text-[hsl(var(--primary))] sm:block"
        aria-hidden="true"
      />
    </CommandPrimitive.Item>
  );
}

function PopularCard({ item, onSelect }: { item: ServiceFinderItem; onSelect: (i: ServiceFinderItem) => void }) {
  const price = priceLabel(item);
  return (
    <CommandPrimitive.Item
      value={item.id}
      onSelect={() => onSelect(item)}
      aria-label={describeItem(item, price)}
      className="group flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 outline-none transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md data-[selected=true]:border-[hsl(var(--primary))] data-[selected=true]:shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]"
    >
      <GroupIcon group={item.group} className="h-10 w-10" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-[15px] font-bold leading-snug text-foreground">{item.title}</p>
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[13px] text-slate-500">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {item.turnaround}
          </span>
          <span className="text-base font-black text-slate-900">{price}</span>
        </div>
      </div>
    </CommandPrimitive.Item>
  );
}

function NotFound({ query, message, onNavigate }: { query: string; message?: string; onNavigate: () => void }) {
  const href = query ? `/contact?service=${encodeURIComponent(query)}` : '/contact';
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <MessageCircle className="h-7 w-7" aria-hidden="true" />
      </div>
      <div className="space-y-1.5">
        <p className="text-xl font-bold text-foreground">Can&apos;t find it?</p>
        <p className="text-base text-muted-foreground">
          {message ?? (
            <>
              We don&apos;t list “{query}” online yet, but we can probably help. Tell us what you need and we&apos;ll
              come back with a quote.
            </>
          )}
        </p>
      </div>
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <Link
          onClick={onNavigate}
          href={href}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-gradient px-6 font-bold text-white hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Contact us
        </Link>
        <Link
          onClick={onNavigate}
          href="/products"
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-border px-6 font-bold text-foreground hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Browse all services
        </Link>
      </div>
    </div>
  );
}
