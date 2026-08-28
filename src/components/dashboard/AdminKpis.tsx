'use client';

import * as React from 'react';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { StatCardSkeleton } from '@/components/ui/skeletons';
import { Banknote, CheckCircle2, Loader2, ShoppingCart } from 'lucide-react';

const ACTIVE_STATUSES = [
  'Pending Payment',
  'Processing',
  'Outsourced',
  'Under Review',
  'Waiting on Customer',
  'Waiting for Information',
  'Waiting on Client',
  'Waiting on External',
];

function toDate(raw: any): Date | null {
  if (!raw) return null;
  const d = typeof raw?.toDate === 'function' ? raw.toDate() : new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

/** Weekly buckets (oldest → newest) over the trailing `weeks` weeks. */
function weeklySeries(orders: { date: Date; value: number }[], weeks = 8): number[] {
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const buckets = Array.from({ length: weeks }, () => 0);
  orders.forEach((o) => {
    const age = now - o.date.getTime();
    const idx = weeks - 1 - Math.floor(age / week);
    if (idx >= 0 && idx < weeks) buckets[idx] += o.value;
  });
  return buckets;
}

/**
 * Interactive KPI row for the admin dashboard: revenue, order volume,
 * active workload and completions — with trends vs last month and
 * 8-week sparklines. Self-contained fetch (last ~400 orders).
 */
export function AdminKpis() {
  const [orders, setOrders] = React.useState<Order[] | null>(null);

  React.useEffect(() => {
    getDocs(query(collection(db, 'orders'), orderBy('date', 'desc'), limit(400)))
      .then((snap) => setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))))
      .catch(() => setOrders([]));
  }, []);

  const kpis = React.useMemo(() => {
    if (!orders) return null;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const dated = orders
      .map((o) => ({ order: o, date: toDate(o.date) }))
      .filter((x): x is { order: Order; date: Date } => !!x.date);

    const notCancelled = dated.filter((x) => (x.order.status as string) !== 'Cancelled');
    const inMonth = (x: { date: Date }, start: Date, end: Date) => x.date >= start && x.date < end;

    const revThis = notCancelled.filter((x) => inMonth(x, monthStart, now)).reduce((s, x) => s + (x.order.total || 0), 0);
    const revPrev = notCancelled.filter((x) => inMonth(x, prevMonthStart, monthStart)).reduce((s, x) => s + (x.order.total || 0), 0);

    const cntThis = dated.filter((x) => inMonth(x, monthStart, now)).length;
    const cntPrev = dated.filter((x) => inMonth(x, prevMonthStart, monthStart)).length;

    const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status as string)).length;

    const completedThis = dated.filter((x) => (x.order.status as string) === 'Completed' && inMonth(x, monthStart, now)).length;
    const completedPrev = dated.filter((x) => (x.order.status as string) === 'Completed' && inMonth(x, prevMonthStart, monthStart)).length;

    return {
      revThis,
      revTrend: pctChange(revThis, revPrev),
      revSpark: weeklySeries(notCancelled.map((x) => ({ date: x.date, value: x.order.total || 0 }))),
      cntThis,
      cntTrend: pctChange(cntThis, cntPrev),
      cntSpark: weeklySeries(dated.map((x) => ({ date: x.date, value: 1 }))),
      active,
      completedThis,
      completedTrend: pctChange(completedThis, completedPrev),
    };
  }, [orders]);

  if (!kpis) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 stagger-children">
      <KpiCard
        label="Revenue this month"
        value={kpis.revThis}
        format={(v) => formatPrice(Math.round(v))}
        icon={Banknote}
        trendPct={kpis.revTrend}
        sparkData={kpis.revSpark}
        href="/admin/orders"
      />
      <KpiCard
        label="New orders this month"
        value={kpis.cntThis}
        icon={ShoppingCart}
        trendPct={kpis.cntTrend}
        sparkData={kpis.cntSpark}
        href="/admin/orders"
      />
      <KpiCard
        label="Active orders"
        value={kpis.active}
        icon={Loader2}
        trendLabel=""
        href="/admin/orders"
      />
      <KpiCard
        label="Completed this month"
        value={kpis.completedThis}
        icon={CheckCircle2}
        trendPct={kpis.completedTrend}
        sparkClassName="text-emerald-500"
        href="/admin/orders?status=Completed"
      />
    </div>
  );
}
