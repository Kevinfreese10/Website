'use client';

import * as React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Global connectivity banner: a persistent bar while offline and a brief
 * "Back online" confirmation when the connection recovers.
 */
export function ConnectivityBanner() {
  const [offline, setOffline] = React.useState(false);
  const [justRecovered, setJustRecovered] = React.useState(false);

  React.useEffect(() => {
    setOffline(typeof navigator !== 'undefined' && !navigator.onLine);
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onOffline = () => {
      setOffline(true);
      setJustRecovered(false);
    };
    const onOnline = () => {
      setOffline(false);
      setJustRecovered(true);
      timer = setTimeout(() => setJustRecovered(false), 3500);
    };
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!offline && !justRecovered) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-semibold text-white animate-fade-in',
        offline ? 'bg-slate-800' : 'bg-emerald-600'
      )}
    >
      {offline ? (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          You&apos;re offline — changes can&apos;t be saved until the connection returns.
        </>
      ) : (
        <>
          <Wifi className="h-3.5 w-3.5" />
          Back online — you&apos;re reconnected.
        </>
      )}
    </div>
  );
}
