'use client';

import * as React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { Order, User, OrderNote } from '@/lib/types';
import { getStatusVariant } from '@/lib/order-status';
import { formatPrice } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ActivityTimeline, type TimelineItem } from '@/components/shared/ActivityTimeline';
import { ORDER_STATUS_OPTIONS } from '@/components/admin/orders/OrdersTable';
import {
  ArrowUpRight,
  ChevronDown,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  ShoppingBag,
} from 'lucide-react';

function safeDate(raw: any, fmt = 'dd MMM yyyy, HH:mm'): string {
  if (!raw) return '';
  try {
    const d = typeof raw?.toDate === 'function' ? raw.toDate() : new Date(raw);
    if (isNaN(d.getTime())) return '';
    return format(d, fmt);
  } catch {
    return '';
  }
}

/**
 * Slide-over quick view for an order: inspect and update status without
 * leaving the orders list.
 */
export function OrderQuickView({
  order,
  staff,
  onOpenChange,
  onUpdateStatus,
  canEdit = true,
}: {
  order: Order | null;
  staff: User[];
  onOpenChange: (open: boolean) => void;
  onUpdateStatus: (orderId: string, status: Order['status']) => void;
  canEdit?: boolean;
}) {
  const timeline: TimelineItem[] = React.useMemo(() => {
    if (!order) return [];
    const notesList: OrderNote[] = Array.isArray(order.notes) 
      ? order.notes 
      : (order.notes && typeof order.notes === 'object' && Array.isArray((order.notes as any).elements) ? (order.notes as any).elements : []);
    if (notesList.length === 0) return [];
    return notesList
      .slice(-6)
      .reverse()
      .map((note: OrderNote, i: number) => {
        const author = staff.find((s) => s.id === note.authorId);
        return {
          id: `${order.id}-note-${i}`,
          title: (
            <span className="flex items-center gap-1.5">
              {author?.name || 'Client'}
              {note.isInternal && (
                <Badge className="h-4 gap-1 border-amber-300 bg-amber-500/20 px-1 py-0 text-[9px] font-bold text-amber-800 hover:bg-amber-500/20">
                  <Lock className="h-2.5 w-2.5" /> Internal
                </Badge>
              )}
            </span>
          ),
          description: (
            <span className="line-clamp-2">{note.subject ? `${note.subject} — ` : ''}{note.text}</span>
          ),
          timestamp: safeDate(note.date, 'dd MMM, HH:mm'),
          icon: note.type === 'email' ? Mail : MessageSquare,
          tone: note.isInternal ? ('warning' as const) : ('default' as const),
        };
      });
  }, [order, staff]);

  return (
    <Sheet open={!!order} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg">
        {order && (
          <>
            <SheetHeader className="space-y-2 border-b bg-muted/30 p-5">
              <div className="flex items-start justify-between gap-3 pr-8">
                <div className="min-w-0">
                  <SheetTitle className="truncate text-lg font-black">
                    Order #{order.originalOrderId || order.id}
                  </SheetTitle>
                  <p className="text-xs text-muted-foreground">{safeDate(order.date)}</p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/admin/orders/${order.id}`}>
                    Open <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={!canEdit}>
                    <button
                      type="button"
                      className="group inline-flex items-center gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label="Change status"
                    >
                      <Badge variant={getStatusVariant(order.status)} className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        {order.status}
                      </Badge>
                      {canEdit && (
                        <ChevronDown className="h-3 w-3 text-muted-foreground opacity-60 group-hover:opacity-100" />
                      )}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>Set status</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {ORDER_STATUS_OPTIONS.map((status) => (
                      <DropdownMenuItem
                        key={status}
                        disabled={order.status === status}
                        className={status === 'Cancelled' ? 'text-destructive' : undefined}
                        onClick={() => onUpdateStatus(order.id, status)}
                      >
                        {status}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {order.source && (
                  <Badge variant="secondary" className="text-[10px] font-bold uppercase">{order.source}</Badge>
                )}
              </div>
            </SheetHeader>

            <div className="space-y-5 p-5">
              <section className="space-y-2">
                <h3 className="text-meta flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5" /> Items
                </h3>
                <div className="space-y-1.5">
                  {order.items.map((item: any, idx: number) => (
                    <div key={item.id || idx} className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{item.title}</p>
                        <p className="text-[11px] text-muted-foreground">Qty {item.quantity || 1}</p>
                      </div>
                      <span className="font-bold tabular-nums">{formatPrice(item.price || item.unitPrice || 0)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-black text-primary">
                  <span>Total</span>
                  <span className="tabular-nums">{formatPrice(order.total)}</span>
                </div>
              </section>

              <Separator />

              <section className="space-y-2">
                <h3 className="text-meta">Customer</h3>
                <p className="text-sm font-bold">{order.endCustomerName || order.customerName}</p>
                {order.customerEmail && (
                  <a href={`mailto:${order.customerEmail}`} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                    <Mail className="h-3.5 w-3.5" /> {order.customerEmail}
                  </a>
                )}
                {order.customerPhone && (
                  <a href={`tel:${order.customerPhone}`} className="flex items-center gap-1.5 text-xs font-medium text-foreground hover:text-primary">
                    <Phone className="h-3.5 w-3.5" /> {order.customerPhone}
                  </a>
                )}
              </section>

              {timeline.length > 0 && (
                <>
                  <Separator />
                  <section className="space-y-3">
                    <h3 className="text-meta">Recent activity</h3>
                    <ActivityTimeline items={timeline} />
                  </section>
                </>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
