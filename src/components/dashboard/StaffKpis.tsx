'use client';

import * as React from 'react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Order, Task } from '@/lib/types';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { StatCardSkeleton } from '@/components/ui/skeletons';
import { AlertTriangle, CheckCircle2, CheckSquare, Clock, ShoppingBag } from 'lucide-react';
import { isPast, isSameDay } from 'date-fns';

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

function weeklySeries(items: { date: Date }[], weeks = 8): number[] {
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;
  const buckets = Array.from({ length: weeks }, () => 0);
  items.forEach((item) => {
    const age = now - item.date.getTime();
    const idx = weeks - 1 - Math.floor(age / week);
    if (idx >= 0 && idx < weeks) buckets[idx] += 1;
  });
  return buckets;
}

interface StaffKpisProps {
  userId: string;
  tasks?: Task[];
}

/**
 * Role-scoped KPI row for staff members:
 * Shows operational workload metrics (assigned active orders, completed orders,
 * pending tasks, and overdue tasks) without any company revenue or financial figures.
 */
export function StaffKpis({ userId, tasks = [] }: StaffKpisProps) {
  const [orders, setOrders] = React.useState<Order[] | null>(null);

  React.useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'orders'),
      where('assignedTo', 'array-contains', userId),
      orderBy('date', 'desc')
    );

    getDocs(q)
      .then((snap) => setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))))
      .catch((err) => {
        console.error('[StaffKpis] error fetching assigned orders:', err);
        setOrders([]);
      });
  }, [userId]);

  const kpis = React.useMemo(() => {
    if (!orders) return null;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const dated = orders
      .map((o) => ({ order: o, date: toDate(o.date) }))
      .filter((x): x is { order: Order; date: Date } => !!x.date);

    const inMonth = (x: { date: Date }, start: Date, end: Date) => x.date >= start && x.date < end;

    const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status as string));
    const activeCount = activeOrders.length;

    const completedThis = dated.filter((x) => (x.order.status as string) === 'Completed' && inMonth(x, monthStart, now)).length;
    const completedPrev = dated.filter((x) => (x.order.status as string) === 'Completed' && inMonth(x, prevMonthStart, monthStart)).length;

    // Filter tasks: allocated to staff member or created by staff member
    const userTasks = tasks.filter(
      (t) => (Array.isArray(t.assignedTo) && t.assignedTo.includes(userId)) || t.createdBy === userId
    );

    const pendingTasks = userTasks.filter((t) => t.status !== 'Done');
    const overdueTasks = userTasks.filter((t) => {
      if (t.status === 'Done') return false;
      const d = toDate(t.dueDate);
      if (!d) return false;
      return isPast(d) && !isSameDay(d, now);
    });

    return {
      activeCount,
      activeSpark: weeklySeries(dated.filter((x) => ACTIVE_STATUSES.includes(x.order.status as string))),
      completedThis,
      completedTrend: pctChange(completedThis, completedPrev),
      completedSpark: weeklySeries(dated.filter((x) => (x.order.status as string) === 'Completed')),
      pendingTasksCount: pendingTasks.length,
      overdueTasksCount: overdueTasks.length,
    };
  }, [orders, tasks, userId]);

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
        label="My Active Orders"
        value={kpis.activeCount}
        icon={ShoppingBag}
        sparkData={kpis.activeSpark}
        href="/admin/orders?status=active"
      />
      <KpiCard
        label="My Completed Orders"
        value={kpis.completedThis}
        icon={CheckCircle2}
        trendPct={kpis.completedTrend}
        sparkData={kpis.completedSpark}
        sparkClassName="text-emerald-500"
        href="/admin/orders?status=Completed"
      />
      <KpiCard
        label="My Pending Tasks"
        value={kpis.pendingTasksCount}
        icon={CheckSquare}
        href="/admin/tasks"
      />
      <KpiCard
        label="My Overdue Tasks"
        value={kpis.overdueTasksCount}
        icon={AlertTriangle}
        className={kpis.overdueTasksCount > 0 ? 'border-amber-300 bg-amber-50/30 dark:border-amber-900/50 dark:bg-amber-950/20' : undefined}
        href="/admin/tasks"
      />
    </div>
  );
}
