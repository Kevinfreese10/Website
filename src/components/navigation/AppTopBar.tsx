'use client';

import * as React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { QuickCreate } from '@/components/navigation/QuickCreate';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { FeatureTip } from '@/components/onboarding/FeatureTip';

/**
 * Slim sticky top bar for the admin and client dashboard shells:
 * sidebar trigger (mobile), smart breadcrumbs, search (⌘K) and quick create.
 */
export function AppTopBar({
  homeHref,
  showQuickCreate = false,
  extra,
}: {
  homeHref: string;
  showQuickCreate?: boolean;
  /** Extra controls (e.g. notification centre) rendered before Quick Create. */
  extra?: React.ReactNode;
}) {
  const [isMac, setIsMac] = React.useState(false);
  React.useEffect(() => {
    setIsMac(typeof navigator !== 'undefined' && /Mac|iP(hone|ad|od)/.test(navigator.platform));
  }, []);

  return (
    <>
    <header className="sticky top-0 z-30 -mx-4 mb-4 flex h-[53px] items-center gap-2 sm:gap-3 border-b bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <SidebarTrigger className="md:hidden h-10 w-10 min-h-[44px] min-w-[44px] -ml-2" aria-label="Toggle navigation menu" />
      <Breadcrumbs homeHref={homeHref} className="min-w-0 flex-1 overflow-hidden" />
      <Button
        variant="outline"
        size="sm"
        aria-label="Open command search"
        className="hidden items-center gap-2 text-muted-foreground sm:flex"
        onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
      >
        <Search className="h-3.5 w-3.5" />
        <span className="text-xs">Search…</span>
        <kbd className="pointer-events-none rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
          {isMac ? '⌘' : 'Ctrl'} K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 min-h-[44px] min-w-[44px] sm:hidden"
        aria-label="Open command search"
        onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
      >
        <Search className="h-5 w-5" />
      </Button>
      {extra}
      {showQuickCreate && <QuickCreate />}
    </header>
    <FeatureTip
      id="command-palette"
      title="Jump anywhere with the command palette"
      className="mb-4"
    >
      Press <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">{isMac ? '⌘' : 'Ctrl'}</kbd>{' '}
      <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">K</kbd> to search clients, orders and
      pages, or press <kbd className="rounded border bg-muted px-1 font-mono text-[10px]">?</kbd> to see every
      keyboard shortcut.
    </FeatureTip>
    </>
  );
}
