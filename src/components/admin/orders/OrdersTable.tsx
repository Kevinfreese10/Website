'use client';

import * as React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { ColumnDef, RowSelectionState } from '@tanstack/react-table';
import type { Order, User } from '@/lib/types';
import { getStatusVariant } from '@/lib/order-status';
import { formatPrice } from '@/lib/utils';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import { BulkActionBar } from '@/components/data-table/bulk-action-bar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toastSuccess } from '@/components/ui/toast-helpers';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Link as LinkIcon,
  MessageSquare,
  MoreHorizontal,
  Tags,
  UserCheck,
} from 'lucide-react';

export const ORDER_STATUS_OPTIONS: Order['status'][] = [
  'Pending Payment',
  'Processing',
  'Waiting on Customer',
  'Waiting on External',
  'Under Review',
  'Completed',
  'Cancelled',
] as Order['status'][];

function safeFormatDate(rawDate: any, formatStr = 'dd MMM yyyy'): string {
  if (!rawDate) return '';
  try {
    if (typeof rawDate?.toDate === 'function') return format(rawDate.toDate(), formatStr);
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return '';
    return format(d, formatStr);
  } catch {
    return '';
  }
}

export interface OrdersTableProps {
  orders: Order[];
  /** Full order list (used to resolve prerequisite completeness). */
  allOrders: Order[];
  staff: User[];
  eligibleStaff: User[];
  canAssign: boolean;
  isLoading: boolean;
  onAssign: (orderId: string, staffId: string) => Promise<void> | void;
  onUpdateStatus: (orderId: string, status: Order['status']) => Promise<void> | void;
  empty?: React.ReactNode;
  /** Row click → open quick view. */
  onRowView?: (order: Order) => void;
  toolbar?: React.ReactNode;
  toolbarRight?: React.ReactNode;
  subheader?: React.ReactNode;
}

/**
 * Admin orders table on the shared DataTable: sorting, pagination, column
 * visibility, bulk assign/status actions and inline status editing.
 */
export function OrdersTable({
  orders,
  allOrders,
  staff,
  eligibleStaff,
  canAssign,
  isLoading,
  onAssign,
  onUpdateStatus,
  empty,
  onRowView,
  toolbar,
  toolbarRight,
  subheader,
}: OrdersTableProps) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [selectedRows, setSelectedRows] = React.useState<Order[]>([]);
  const [bulkBusy, setBulkBusy] = React.useState(false);

  const getAssignee = React.useCallback(
    (userId?: string) => (userId ? staff.find((u) => u.id === userId) : undefined),
    [staff]
  );

  const runBulk = async (label: string, fn: (order: Order) => Promise<void> | void) => {
    setBulkBusy(true);
    try {
      for (const order of selectedRows) {
        await fn(order);
      }
      toastSuccess(label, `${selectedRows.length} order${selectedRows.length === 1 ? '' : 's'} updated.`);
      setRowSelection({});
    } finally {
      setBulkBusy(false);
    }
  };

  const StatusCell = ({ order }: { order: Order }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group inline-flex items-center gap-1 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Change status for order ${order.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <Badge variant={getStatusVariant(order.status)} className="text-[10px] uppercase font-black px-2 py-0.5">
            {(order.status as string) === 'Outsourced' ? 'Processing' : order.status}
          </Badge>
          <ChevronDown className="h-3 w-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
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
  );

  const columns = React.useMemo<ColumnDef<Order, any>[]>(
    () => [
      {
        id: 'order',
        accessorFn: (o) => o.date,
        meta: { label: 'Order' },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Order" />,
        sortingFn: (a, b) =>
          new Date(a.original.date).getTime() - new Date(b.original.date).getTime(),
        cell: ({ row }) => {
          const order = row.original;
          const hasDeps = order.dependsOnOrderIds && order.dependsOnOrderIds.length > 0;
          const hasIncomplete =
            hasDeps &&
            allOrders.some(
              (o) => order.dependsOnOrderIds?.includes(o.id) && o.status !== 'Completed'
            );
          return (
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Link
                  href={`/admin/orders/${order.id}`}
                  className="font-bold text-foreground hover:text-primary hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {order.originalOrderId || order.id}
                </Link>
                {hasDeps && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex cursor-help">
                          {hasIncomplete ? (
                            <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[9px] font-bold text-amber-700">
                              <AlertTriangle className="h-2.5 w-2.5 text-amber-600" /> Blocked
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0 text-[9px] font-bold text-emerald-700">
                              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" /> Prereqs Done
                            </Badge>
                          )}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          Prerequisites: {order.dependsOnOrderIds!.map((id) => `#${id}`).join(', ')}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {order.blockedOrderIds && order.blockedOrderIds.length > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex cursor-help">
                          <Badge variant="outline" className="gap-1 border-blue-500/30 bg-blue-500/10 px-1.5 py-0 text-[9px] font-bold text-blue-700">
                            <LinkIcon className="h-2.5 w-2.5 text-blue-600" /> Blocks #{order.blockedOrderIds.join(', #')}
                          </Badge>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">
                          Dependent orders waiting on this: {order.blockedOrderIds.map((id) => `#${id}`).join(', ')}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {safeFormatDate(order.date)}
              </p>
            </div>
          );
        },
      },
      {
        id: 'customer',
        accessorFn: (o) => o.endCustomerName || o.customerName || '',
        meta: { label: 'Customer' },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Customer" />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground">
              {row.original.endCustomerName || row.original.customerName}
            </span>
            <span className="max-w-[150px] truncate text-[10px] text-muted-foreground">
              {row.original.customerEmail}
            </span>
          </div>
        ),
      },
      {
        id: 'assignee',
        accessorFn: (o) => getAssignee(o.assignedTo?.[0])?.name ?? '',
        meta: { label: 'Assigned To' },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Assigned To" />,
        cell: ({ row }) => {
          const assignee = getAssignee(row.original.assignedTo?.[0]);
          return assignee ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="cursor-help border-primary/20 bg-primary/5 font-bold text-primary">
                    {assignee.name.split(' ')[0]}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{assignee.name} {assignee.department ? `(${assignee.department})` : ''}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <span className="text-xs italic text-muted-foreground">Unassigned</span>
          );
        },
      },
      {
        id: 'lastUpdate',
        enableSorting: false,
        meta: { label: 'Last Update' },
        header: 'Last Update',
        cell: ({ row }) => {
          const notes = row.original.notes;
          const lastNote = notes && notes.length > 0 ? notes[notes.length - 1] : null;
          const author = lastNote ? getAssignee(lastNote.authorId) : null;
          return lastNote ? (
            <div className="flex max-w-[200px] items-start gap-2">
              <MessageSquare className="mt-0.5 h-3 w-3 flex-shrink-0 text-primary" />
              <div className="truncate text-[10px] leading-tight">
                <span className="font-black text-foreground">
                  {author ? author.name.split(' ')[0] : 'Client'}:
                </span>
                <span className="ml-1 text-muted-foreground">
                  &quot;{lastNote.subject || lastNote.text}&quot;
                </span>
              </div>
            </div>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground opacity-50">
              No updates
            </span>
          );
        },
      },
      {
        id: 'status',
        accessorFn: (o) => o.status,
        meta: { label: 'Status' },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <StatusCell order={row.original} />,
      },
      {
        id: 'source',
        accessorFn: (o) => o.source || 'Client',
        meta: { label: 'Source' },
        header: ({ column }) => <DataTableColumnHeader column={column} title="Source" />,
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-tighter">
            {row.original.source || 'Client'}
          </Badge>
        ),
      },
      {
        id: 'total',
        accessorFn: (o) => o.total,
        meta: { label: 'Total' },
        header: ({ column }) => (
          <div className="text-right">
            <DataTableColumnHeader column={column} title="Total" />
          </div>
        ),
        cell: ({ row }) => (
          <div className="text-right font-black tabular-nums text-foreground">
            {formatPrice(row.original.total)}
          </div>
        ),
      },
      {
        id: 'actions',
        enableSorting: false,
        enableHiding: false,
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/orders/${order.id}`}>View Order</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {canAssign && (
                    <>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Assign To</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                          {eligibleStaff.map((s) => (
                            <DropdownMenuItem
                              key={s.id}
                              onClick={() => onAssign(order.id, s.id)}
                              disabled={order.assignedTo?.[0] === s.id}
                            >
                              {s.name} {s.department ? `(${s.department})` : ''}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {ORDER_STATUS_OPTIONS.map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => onUpdateStatus(order.id, status)}
                      disabled={order.status === status}
                      className={status === 'Cancelled' ? 'text-destructive' : undefined}
                    >
                      {status === 'Cancelled' ? 'Cancel Order' : `Mark as ${status}`}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allOrders, eligibleStaff, canAssign, getAssignee]
  );

  return (
    <>
      <DataTable
        tableId="admin-orders"
        columns={columns}
        data={orders}
        isLoading={isLoading}
        empty={empty}
        enableSelection
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
        onSelectionChange={setSelectedRows}
        getRowId={(o) => o.id}
        initialSorting={[{ id: 'order', desc: true }]}
        toolbar={toolbar}
        toolbarRight={toolbarRight}
        subheader={subheader}
        onRowClick={onRowView}
      />
      <BulkActionBar count={selectedRows.length} onClear={() => setRowSelection({})}>
        {canAssign && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-full" disabled={bulkBusy}>
                <UserCheck className="h-3.5 w-3.5" /> Assign
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" side="top">
              <DropdownMenuLabel>Assign selected to</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {eligibleStaff.map((s) => (
                <DropdownMenuItem key={s.id} onClick={() => runBulk('Orders assigned', (o) => onAssign(o.id, s.id))}>
                  {s.name} {s.department ? `(${s.department})` : ''}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5 rounded-full" disabled={bulkBusy}>
              <Tags className="h-3.5 w-3.5" /> Set status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" side="top">
            <DropdownMenuLabel>Set status for selected</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ORDER_STATUS_OPTIONS.map((status) => (
              <DropdownMenuItem
                key={status}
                className={status === 'Cancelled' ? 'text-destructive' : undefined}
                onClick={() => runBulk('Status updated', (o) => onUpdateStatus(o.id, status))}
              >
                {status}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </BulkActionBar>
    </>
  );
}
