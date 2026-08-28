'use client';

import * as React from 'react';
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type RowSelectionState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TableSkeleton } from '@/components/ui/skeletons';
import { DataTablePagination } from './data-table-pagination';
import { Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataTableProps<TData> {
  /** Stable id used to persist column visibility per user/browser. */
  tableId: string;
  columns: ColumnDef<TData, any>[];
  data: TData[];
  isLoading?: boolean;
  /** Rendered when there are no rows (use <EmptyState/>). */
  empty?: React.ReactNode;
  /** Adds a checkbox column and reports the selected rows. */
  enableSelection?: boolean;
  onSelectionChange?: (rows: TData[]) => void;
  /** Controlled from outside so bulk bars can clear it. */
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (state: RowSelectionState) => void;
  initialSorting?: SortingState;
  pageSize?: number;
  getRowId?: (row: TData) => string;
  /** Left side of the header row (search inputs, filters). */
  toolbar?: React.ReactNode;
  /** Right side of the header row (saved views etc.); column toggle is added automatically. */
  toolbarRight?: React.ReactNode;
  /** Rendered between toolbar and table (filter chips). */
  subheader?: React.ReactNode;
  onRowClick?: (row: TData) => void;
  className?: string;
}

/**
 * Shared data table: sorting, pagination, column visibility (persisted),
 * optional row selection for bulk actions, loading skeleton and empty state.
 */
export function DataTable<TData>({
  tableId,
  columns,
  data,
  isLoading = false,
  empty,
  enableSelection = false,
  onSelectionChange,
  rowSelection: rowSelectionProp,
  onRowSelectionChange,
  initialSorting = [],
  pageSize = 25,
  getRowId,
  toolbar,
  toolbarRight,
  subheader,
  onRowClick,
  className,
}: DataTableProps<TData>) {
  const visibilityKey = `myacc.table-cols.${tableId}`;
  const [sorting, setSorting] = React.useState<SortingState>(initialSorting);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = window.localStorage.getItem(visibilityKey);
      return raw ? (JSON.parse(raw) as VisibilityState) : {};
    } catch {
      return {};
    }
  });
  const [internalSelection, setInternalSelection] = React.useState<RowSelectionState>({});
  const rowSelection = rowSelectionProp ?? internalSelection;
  const setRowSelection = onRowSelectionChange ?? setInternalSelection;

  React.useEffect(() => {
    try {
      window.localStorage.setItem(visibilityKey, JSON.stringify(columnVisibility));
    } catch {
      /* ignore */
    }
  }, [columnVisibility, visibilityKey]);

  const allColumns = React.useMemo<ColumnDef<TData, any>[]>(() => {
    if (!enableSelection) return columns;
    const selectColumn: ColumnDef<TData, any> = {
      id: '__select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all rows on this page"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 32,
    };
    return [selectColumn, ...columns];
  }, [columns, enableSelection]);

  const table = useReactTable({
    data,
    columns: allColumns,
    state: { sorting, columnVisibility, rowSelection },
    initialState: { pagination: { pageSize } },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(rowSelection) : updater;
      setRowSelection(next);
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId,
    enableRowSelection: enableSelection,
  });

  React.useEffect(() => {
    if (!onSelectionChange) return;
    onSelectionChange(table.getSelectedRowModel().rows.map((r) => r.original));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection]);

  const hideableColumns = table.getAllColumns().filter((c) => c.getCanHide());

  return (
    <div className={cn('space-y-3', className)}>
      {(toolbar || toolbarRight || hideableColumns.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 px-1">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{toolbar}</div>
          <div className="flex items-center gap-1.5">
            {toolbarRight}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Settings2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Columns</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Show columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {hideableColumns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(v) => column.toggleVisibility(!!v)}
                    className="capitalize"
                  >
                    {(column.columnDef.meta as { label?: string } | undefined)?.label ?? column.id}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {subheader && <div className="px-1">{subheader}</div>}

      {isLoading ? (
        <div className="p-4">
          <TableSkeleton rows={8} columns={Math.min(allColumns.length, 8)} />
        </div>
      ) : data.length === 0 && empty ? (
        empty
      ) : (
        <>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader className="bg-muted/40">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} style={header.column.columnDef.size ? { width: header.getSize() } : undefined}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={cn('transition-colors hover:bg-muted/30', onRowClick && 'cursor-pointer')}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DataTablePagination table={table} />
        </>
      )}
    </div>
  );
}
