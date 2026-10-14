'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
  or,
} from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Order, Service } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { usePartner } from '@/contexts/PartnerContext';
import { services as staticServices } from '@/lib/data';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  MoreHorizontal,
  Loader2,
  PlusCircle,
  ArrowRight,
  Search,
  ShoppingBag,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import CreatePartnerOrderForm from '@/components/partner/CreatePartnerOrderForm';
import { cn, formatDate } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import {
  FirestorePermissionError,
  type SecurityRuleContext,
} from '@/firebase/errors';
import { ProcessOrderModal } from '@/components/partner/ProcessOrderModal';
import { getStatusVariant } from '@/lib/order-status';

const db = getFirestore(firebaseApp);

export default function PartnerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [allServices, setAllServices] = useState<Service[]>(staticServices);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { tierPlan, discountPercent } = usePartner();
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [selectedOrderForProcess, setSelectedOrderForProcess] =
    useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const partnerId = user?.role === 'partner' ? user.uid : user?.partnerId;

  const statusCounts = useMemo(() => {
    return {
      all: orders.length,
      processing: orders.filter((o) => o.status === 'Processing').length,
      pending: orders.filter((o) => o.status === 'Pending Payment').length,
      completed: orders.filter((o) => o.status === 'Completed').length,
      cancelled: orders.filter((o) => o.status === 'Cancelled').length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesId = order.id.toLowerCase().includes(term);
        const matchesName = (
          order.endCustomerName ||
          order.customerName ||
          ''
        )
          .toLowerCase()
          .includes(term);
        const matchesItems = (order.items || []).some((i) =>
          (i.title || '').toLowerCase().includes(term)
        );
        if (!matchesId && !matchesName && !matchesItems) return false;
      }
      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  useEffect(() => {
    if (!user?.uid || !partnerId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const servicesQuery = query(collection(db, 'services'));
    getDocs(servicesQuery)
      .then((servicesSnapshot) => {
        const fetchedServices = servicesSnapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Service)
        );
        setAllServices(fetchedServices);
      })
      .catch((err) => {
        console.error('Error loading services:', err);
      });

    const ordersRef = collection(db, 'orders');
    const q = user?.email
      ? query(
          ordersRef,
          or(
            where('resellerId', '==', partnerId),
            where('partnerId', '==', partnerId),
            where('userId', '==', partnerId),
            where('customerEmail', '==', user.email)
          )
        )
      : query(
          ordersRef,
          or(
            where('resellerId', '==', partnerId),
            where('partnerId', '==', partnerId),
            where('userId', '==', partnerId)
          )
        );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            date: data.date?.toDate
              ? data.date.toDate().toISOString()
              : new Date().toISOString(),
          } as Order;
        });
        fetchedOrders.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setOrders(
          fetchedOrders.filter(
            (order) =>
              order.status !== 'Cancelled' &&
              !order.originalOrderId &&
              !(order.items || []).every(
                (i) =>
                  i.id === 'partner_credit_topup' ||
                  i.id === 'partner_platform_fee'
              )
          )
        );
        setIsLoading(false);
      },
      async () => {
        const permissionError = new FirestorePermissionError({
          path: 'orders',
          operation: 'list',
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, user?.email, partnerId]);

  const handleOrderCreated = () => {
    setIsCreateOrderOpen(false);
  };

  return (
    <div className="space-y-8">
      <ProcessOrderModal
        open={processModalOpen}
        onOpenChange={setProcessModalOpen}
        order={selectedOrderForProcess}
        allServices={allServices}
      />

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle>Practice Back-Office Orders</CardTitle>
                <Badge variant="secondary" className="font-semibold">
                  {tierPlan.name} Tier ({discountPercent}% Off)
                </Badge>
              </div>
              <CardDescription className="mt-1">
                Manage and track all compliance, tax, and accounting orders fulfilled for your practice clients. All communication happens strictly with you.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search order #, client ref..."
                  className="pl-9 h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Dialog
                open={isCreateOrderOpen}
                onOpenChange={setIsCreateOrderOpen}
              >
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto justify-center font-bold">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Back-Office Order
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>New Back-Office Order</DialogTitle>
                    <DialogDescription>
                      Place an order at your {discountPercent}% wholesale partner rate. We fulfill the work behind the scenes and communicate strictly with your practice.
                    </DialogDescription>
                  </DialogHeader>
                  <CreatePartnerOrderForm onOrderCreated={handleOrderCreated} />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Quick Status Tabs */}
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border/40">
            <Button
              type="button"
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs font-semibold rounded-full gap-1.5"
              onClick={() => setStatusFilter('all')}
            >
              All Orders
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px]',
                  statusFilter === 'all'
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {statusCounts.all}
              </span>
            </Button>
            <Button
              type="button"
              variant={statusFilter === 'Processing' ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs font-semibold rounded-full gap-1.5"
              onClick={() => setStatusFilter('Processing')}
            >
              Processing
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px]',
                  statusFilter === 'Processing'
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-blue-100 text-blue-800'
                )}
              >
                {statusCounts.processing}
              </span>
            </Button>
            <Button
              type="button"
              variant={
                statusFilter === 'Pending Payment' ? 'default' : 'outline'
              }
              size="sm"
              className="h-8 text-xs font-semibold rounded-full gap-1.5"
              onClick={() => setStatusFilter('Pending Payment')}
            >
              Pending Payment
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px]',
                  statusFilter === 'Pending Payment'
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-yellow-100 text-yellow-800'
                )}
              >
                {statusCounts.pending}
              </span>
            </Button>
            <Button
              type="button"
              variant={statusFilter === 'Completed' ? 'default' : 'outline'}
              size="sm"
              className="h-8 text-xs font-semibold rounded-full gap-1.5"
              onClick={() => setStatusFilter('Completed')}
            >
              Completed
              <span
                className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px]',
                  statusFilter === 'Completed'
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-green-100 text-green-800'
                )}
              >
                {statusCounts.completed}
              </span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div
              role="status"
              aria-live="polite"
              aria-busy="true"
              className="flex justify-center items-center h-64"
            >
              <Loader2
                className="h-8 w-8 animate-spin text-primary"
                aria-hidden="true"
              />
              <span className="sr-only">Loading…</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center space-y-3 max-w-md mx-auto">
              <div className="p-3 bg-primary/10 text-primary w-fit rounded-md mx-auto">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-foreground">
                No Practice Orders Yet
              </h3>
              <p className="text-sm text-muted-foreground">
                Place your first wholesale back-office order at {discountPercent}% off retail using the button above or browse the Wholesale Catalog.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-2">
                <Link href="/partner/services">Browse Wholesale Catalog</Link>
              </Button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <p className="text-muted-foreground">
                No orders matching your search or filters.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <>
              {/* Mobile Card List (< sm) */}
              <div className="space-y-3 sm:hidden">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-lg border bg-card/60 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm">
                        #{order.id}
                      </span>
                      <Badge variant={getStatusVariant(order.status)}>
                        {(order.status as any) === 'Outsourced'
                          ? 'Processing'
                          : order.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="font-medium text-foreground text-sm">
                        {order.endCustomerName || order.customerName}
                      </p>
                      <p className="text-muted-foreground">
                        {(order.items || []).map((i) => i.title).join(', ')}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span>{formatDate(order.date)}</span>
                      <span className="font-bold text-foreground text-sm">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 justify-between"
                        asChild
                      >
                        <Link href={`/partner/orders/${order.id}`}>
                          <span>View Details</span>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                      {order.status === 'Pending Payment' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedOrderForProcess(order);
                            setProcessModalOpen(true);
                          }}
                        >
                          <CreditCard className="h-3.5 w-3.5 mr-1.5" /> Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop / Tablet Table (>= sm) */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Client Reference</TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Wholesale Cost</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium font-mono">
                          #{order.id}
                        </TableCell>
                        <TableCell>{formatDate(order.date)}</TableCell>
                        <TableCell>
                          <p className="font-medium">
                            {order.endCustomerName || order.customerName}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-xs text-muted-foreground">
                          {(order.items || []).map((i) => i.title).join(', ')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusVariant(order.status)}>
                            {(order.status as any) === 'Outsourced'
                              ? 'Processing'
                              : order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatPrice(order.total)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {order.status === 'Pending Payment' && (
                              <Button
                                size="sm"
                                variant="default"
                                className="h-8 text-xs font-bold"
                                onClick={() => {
                                  setSelectedOrderForProcess(order);
                                  setProcessModalOpen(true);
                                }}
                              >
                                <CreditCard className="h-3.5 w-3.5 mr-1" /> Pay
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  aria-label="Open menu"
                                >
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <Link href={`/partner/orders/${order.id}`}>
                                    View Order & Upload Docs
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
