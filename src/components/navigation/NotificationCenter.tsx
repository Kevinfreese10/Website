'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/ui/empty-state';
import { Bell, BellOff, Lock, Mail, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  orderId: string;
  customer: string;
  subject?: string;
  text: string;
  date: Date;
  isEmail: boolean;
  isInternal: boolean;
  fromSelf: boolean;
}

const WINDOW_DAYS = 14;
const SEEN_KEY = 'myacc.notifications-seen';

function toDate(raw: any): Date | null {
  if (!raw) return null;
  const d = typeof raw?.toDate === 'function' ? raw.toDate() : new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function readSeen(userId: string): number {
  try {
    const raw = window.localStorage.getItem(`${SEEN_KEY}.${userId}`);
    return raw ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

/**
 * Notification centre for staff: recent order activity (client emails and
 * notes) grouped in one panel with an unread badge and mark-all-read.
 */
export function NotificationCenter() {
  const router = useRouter();
  const { user } = useAuth();
  const [items, setItems] = React.useState<Notification[]>([]);
  const [seenTs, setSeenTs] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (user?.id) setSeenTs(readSeen(user.id));
  }, [user?.id]);

  const load = React.useCallback(async () => {
    if (!user?.id) return;
    try {
      const snap = await getDocs(query(collection(db, 'orders'), orderBy('date', 'desc'), limit(40)));
      const cutoff = Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000;
      const collected: Notification[] = [];
      snap.docs.forEach((doc) => {
        const order = { id: doc.id, ...doc.data() } as Order;
        (order.notes || []).forEach((note, i) => {
          const date = toDate(note.date);
          if (!date || date.getTime() < cutoff) return;
          collected.push({
            id: `${order.id}-${i}-${date.getTime()}`,
            orderId: order.id,
            customer: order.endCustomerName || order.customerName || order.id,
            subject: note.subject || undefined,
            text: note.text || '',
            date,
            isEmail: note.type === 'email',
            isInternal: !!note.isInternal,
            fromSelf: note.authorId === user.id,
          });
        });
      });
      collected.sort((a, b) => b.date.getTime() - a.date.getTime());
      setItems(collected.filter((n) => !n.fromSelf).slice(0, 30));
    } catch {
      /* keep whatever we had */
    }
  }, [user?.id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const unread = items.filter((n) => n.date.getTime() > seenTs).length;

  const markAllRead = () => {
    const now = Date.now();
    setSeenTs(now);
    try {
      if (user?.id) window.localStorage.setItem(`${SEEN_KEY}.${user.id}`, String(now));
    } catch {
      /* ignore */
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) load();
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label={`Notifications${unread ? ` (${unread} unread)` : ''}`}>
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground animate-scale-in">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] max-w-[92vw] p-0">
        <div className="flex items-center justify-between border-b px-4 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          {items.length > 0 && (
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={markAllRead} disabled={unread === 0}>
              Mark all read
            </Button>
          )}
        </div>
        {items.length === 0 ? (
          <EmptyState
            compact
            icon={BellOff}
            title="You're all caught up"
            description={`No order activity in the last ${WINDOW_DAYS} days.`}
          />
        ) : (
          <ScrollArea className="h-[360px]">
            <ul className="divide-y">
              {items.map((n) => {
                const isUnread = n.date.getTime() > seenTs;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        router.push(`/admin/orders/${n.orderId}`);
                      }}
                      className={cn(
                        'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50',
                        isUnread && 'bg-primary/[0.04]'
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                          n.isInternal
                            ? 'bg-amber-100 text-amber-700'
                            : n.isEmail
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {n.isInternal ? <Lock className="h-3.5 w-3.5" /> : n.isEmail ? <Mail className="h-3.5 w-3.5" /> : <MessageSquare className="h-3.5 w-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={cn('truncate text-xs', isUnread ? 'font-bold text-foreground' : 'font-medium text-foreground/80')}>
                            {n.customer} · #{n.orderId}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {formatDistanceToNow(n.date, { addSuffix: true })}
                          </span>
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">
                          {n.subject ? `${n.subject} — ` : ''}
                          {n.text}
                        </span>
                      </span>
                      {isUnread && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
