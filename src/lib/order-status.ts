import type { Order } from './types';

/**
 * Maps an order status to its Badge variant.
 *
 * This exact function was previously copy-pasted into eight files — the admin orders list and
 * detail pages, both client dashboard views, and all four partner views. Seven copies agreed;
 * the admin order-DETAIL copy had lost its `'Outsourced'` case, so the same order rendered as a
 * grey "secondary" badge there and a blue "info" badge on every other screen.
 *
 * Keep this as the single definition. Status colour is a shared meaning, not a per-page choice.
 */
export type OrderStatusLike = Order['status'] | 'Outsourced' | string;

export type BadgeVariant =
  | 'success' | 'info' | 'warning' | 'waiting' | 'review'
  | 'payment' | 'outsourced' | 'destructive' | 'secondary';

export function getStatusVariant(status: OrderStatusLike): BadgeVariant {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'Processing':
    case 'Outsourced':
      return 'info';
    case 'Pending Payment':
      return 'warning';
    case 'Waiting on Customer':
    case 'Waiting for Information':
    case 'Waiting on Client':
      return 'waiting';
    case 'Under Review':
      return 'review';
    case 'Cancelled':
      return 'destructive';
    default:
      return 'secondary';
  }
}
