'use client';

import * as React from 'react';
import type { Order } from '@/lib/types';
import { getStatusVariant } from '@/lib/order-status';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Stepper } from '@/components/ui/stepper';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ORDER_STATUS_OPTIONS } from '@/components/admin/orders/OrdersTable';
import { ChevronDown, PartyPopper, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { label: 'Payment' },
  { label: 'Processing' },
  { label: 'Review' },
  { label: 'Completed' },
];

function currentStepFor(status: Order['status']): number {
  const s = status as string;
  if (s === 'Pending Payment') return 0;
  if (s === 'Under Review') return 2;
  if (s === 'Completed') return 4;
  // Processing, Outsourced and all Waiting states live in the Processing stage
  return 1;
}

/**
 * Sticky contextual header for the admin order detail page: id, customer,
 * total and an editable status stay visible while scrolling, with a status
 * stepper (and a restrained completion state) underneath.
 */
export function OrderStickyHeader({
  order,
  customerName,
  onStatusChange,
  disabled = false,
}: {
  order: Order;
  customerName: string;
  onStatusChange: (status: Order['status']) => void;
  disabled?: boolean;
}) {
  const cancelled = (order.status as string) === 'Cancelled';
  const completed = (order.status as string) === 'Completed';

  return (
    <div className="sticky top-[53px] z-20 -mx-4 border-b bg-background/85 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-lg font-black tracking-tight text-foreground">
              Order #{order.originalOrderId || order.id}
            </h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={disabled}>
                <button
                  type="button"
                  className="group inline-flex items-center gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Change order status"
                >
                  <Badge variant={getStatusVariant(order.status)} className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {order.status}
                  </Badge>
                  {!disabled && (
                    <ChevronDown className="h-3 w-3 text-muted-foreground opacity-60 transition-opacity group-hover:opacity-100" />
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
                    onClick={() => onStatusChange(status)}
                  >
                    {status}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="truncate text-xs text-muted-foreground">{customerName}</p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total</p>
          <p className="text-lg font-black tabular-nums text-foreground">{formatPrice(order.total)}</p>
        </div>
      </div>

      <div className="mt-3">
        {cancelled ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive animate-fade-in">
            <XCircle className="h-4 w-4" /> This order was cancelled.
          </div>
        ) : (
          <div className={cn('rounded-lg', completed && 'animate-fade-in')}>
            <Stepper
              steps={STEPS}
              currentStep={currentStepFor(order.status)}
              className="max-w-2xl"
            />
            {completed && (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600 animate-scale-in">
                <PartyPopper className="h-3.5 w-3.5" /> All stages complete — nice work.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
