'use client';

import * as React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumbs } from '@/components/ui/breadcrumbs';
import { QuickCreate } from '@/components/navigation/QuickCreate';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

/**
 * Slim sticky top bar for the admin and client dashboard shells:
 * sidebar trigger (mobile), smart breadcrumbs, search (⌘K) and quick create.
 */
export function AppTopBar({
  homeHref,
  showQuickCreate = false,
}: {
  homeHref: string;
  showQuickCreate?: boolean;
}) {
  const [isMac, setIsMac] = React.useState(false);
  React.useEffect(() => {
    setIsMac(typeof navigator !== 'undefined' && /Mac|iP(hone|ad|od)/.test(navigator.platform));
  }, []);

  return (
    <header className="sticky top-0 z-30 -mx-4 mb-4 flex items-center gap-3 border-b bg-background/80 px-4 py-2.5 backdrop-blur supports-[backdrop-filter]:bg-background/70 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <SidebarTrigger className="md:hidden" />
      <Breadcrumbs homeHref={homeHref} className="min-w-0 flex-1" />
      <Button
        variant="outline"
        size="sm"
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
        className="h-8 w-8 sm:hidden"
        aria-label="Search"
        onClick={() => window.dispatchEvent(new Event('open-command-palette'))}
      >
        <Search className="h-4 w-4" />
      </Button>
      {showQuickCreate && <QuickCreate />}
    </header>
  );
}
