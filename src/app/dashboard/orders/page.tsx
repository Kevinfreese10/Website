'use client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Order } from '@/lib/types';
import { useState, useEffect, useMemo } from 'react';
import { getFirestore, collection, query, where, getDocs, or } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Loader2, ArrowRight, Search, CheckCircle2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import VerifyEmailBanner from '@/components/dashboard/VerifyEmailBanner';
import { getStatusVariant } from '@/lib/order-status';
import { getClientOrdersAction } from '@/app/actions/order-actions';

const db = getFirestore(firebaseApp);

export default function DashboardPage() {
    const { user, isAuthenticated } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        let isMounted = true;
        const uid = user?.uid || (user as any)?.id;
        const email = user?.email || (user as any)?.customerEmail;

        if (!uid && !email) {
            if (isAuthenticated === false) {
                if (isMounted) setIsLoading(false);
            }
            return;
        }

        // 1. Fast local direct query for instant rendering
        if (uid) {
            const fastQuery = query(collection(db, 'orders'), where('userId', '==', uid));
            getDocs(fastQuery).then(snap => {
                if (!isMounted) return;
                if (!snap.empty) {
                    const fastOrders = snap.docs.map(doc => {
                        const data = doc.data();
                        const dateVal = data.date?.toDate ? data.date.toDate().toISOString() : (data.date || new Date().toISOString());
                        return { ...data, id: doc.id, date: dateVal } as Order;
                    });
                    fastOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setOrders(fastOrders.filter(order => order.status !== 'Cancelled'));
                    setIsLoading(false);
                }
            }).catch(err => {
                console.warn("Direct fast orders query skipped:", err);
            });
        }

        // 2. Parallel server action to load and merge guest/matched orders
        getClientOrdersAction({ userId: uid || '', email: email || '' })
            .then(res => {
                if (!isMounted) return;
                if (res.success && Array.isArray(res.orders)) {
                    setOrders(res.orders.filter(order => order.status !== 'Cancelled'));
                }
            })
            .catch(err => {
                console.error("Server action orders fetch error:", err);
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [user, isAuthenticated]);

    const statusCounts = useMemo(() => {
        return {
            all: orders.length,
            processing: orders.filter(o => o.status === 'Processing' || (o.status as any) === 'Outsourced').length,
            pending: orders.filter(o => o.status === 'Pending Payment').length,
            completed: orders.filter(o => o.status === 'Completed').length,
        };
    }, [orders]);

    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            if (statusFilter === 'Processing' && order.status !== 'Processing' && (order.status as any) !== 'Outsourced') return false;
            if (statusFilter !== 'all' && statusFilter !== 'Processing' && order.status !== statusFilter) return false;
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                const matchesId = order.id.toLowerCase().includes(term);
                const matchesItems = order.items?.some(i => i.title?.toLowerCase().includes(term));
                if (!matchesId && !matchesItems) return false;
            }
            return true;
        });
    }, [orders, statusFilter, searchTerm]);

    
     const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-ZA', {
          style: 'currency',
          currency: 'ZAR',
        }).format(price);
    };

    return (
        <div className="space-y-8">
            <VerifyEmailBanner />
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle>My Orders</CardTitle>
                            <CardDescription>A list of your recent service orders and their current status.</CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search orders..." 
                                className="pl-9 h-10" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Quick Status Filter Tabs */}
                    {orders.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border/40">
                            <Button
                                type="button"
                                variant={statusFilter === 'all' ? 'default' : 'outline'}
                                size="sm"
                                className="h-8 text-xs font-semibold rounded-full gap-1.5"
                                onClick={() => setStatusFilter('all')}
                            >
                                All Orders
                                <span className={cn("px-1.5 py-0.2 rounded-full text-[10px]", statusFilter === 'all' ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground")}>
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
                                <span className={cn("px-1.5 py-0.2 rounded-full text-[10px]", statusFilter === 'Processing' ? "bg-primary-foreground/20 text-primary-foreground" : "bg-blue-100 text-blue-800")}>
                                    {statusCounts.processing}
                                </span>
                            </Button>
                            <Button
                                type="button"
                                variant={statusFilter === 'Pending Payment' ? 'default' : 'outline'}
                                size="sm"
                                className="h-8 text-xs font-semibold rounded-full gap-1.5"
                                onClick={() => setStatusFilter('Pending Payment')}
                            >
                                Pending Payment
                                <span className={cn("px-1.5 py-0.2 rounded-full text-[10px]", statusFilter === 'Pending Payment' ? "bg-primary-foreground/20 text-primary-foreground" : "bg-yellow-100 text-yellow-800")}>
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
                                <span className={cn("px-1.5 py-0.2 rounded-full text-[10px]", statusFilter === 'Completed' ? "bg-primary-foreground/20 text-primary-foreground" : "bg-green-100 text-green-800")}>
                                    {statusCounts.completed}
                                </span>
                            </Button>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" /><span className="sr-only">Loading…</span></div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-10">
                            <p className="text-muted-foreground">You haven't placed any orders yet.</p>
                            <Button asChild className="mt-4">
                                <Link href="/products">Browse Products</Link>
                            </Button>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-10 space-y-3">
                            <p className="text-muted-foreground">No orders matching your filter or search.</p>
                            <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>Clear Filter</Button>
                        </div>
                    ) : (
                        <>
                            {/* Mobile Card View (< sm) */}
                            <div className="space-y-3 sm:hidden">
                                {filteredOrders.map(order => (
                                    <div key={order.id} className="p-4 rounded-lg border bg-card/60 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono font-bold text-sm">#{order.id}</span>
                                            <Badge variant={getStatusVariant(order.status)}>
                                                {(order.status as any) === 'Outsourced' ? 'Processing' : order.status}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{format(new Date(order.date), 'dd MMM yyyy')}</span>
                                            <span className="font-semibold text-foreground text-sm">{formatPrice(order.total)}</span>
                                        </div>
                                        <div className="pt-2 border-t border-border/40 flex justify-end">
                                            {order.status === 'Pending Payment' ? (
                                                <Button size="sm" className="w-full" asChild>
                                                    <Link href={`/order-confirmation/${order.id}`}>
                                                        Pay Now
                                                    </Link>
                                                </Button>
                                            ) : (
                                                <Button variant="outline" size="sm" className="w-full justify-between" asChild>
                                                    <Link href={`/dashboard/orders/${order.id}`}>
                                                        <span>View Details</span>
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop/Tablet Table (>= sm) */}
                            <div className="hidden sm:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Order ID</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredOrders.map(order => (
                                            <TableRow key={order.id}>
                                                <TableCell className="font-medium font-mono">#{order.id}</TableCell>
                                                <TableCell>{format(new Date(order.date), 'dd MMMM yyyy')}</TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusVariant(order.status)}>
                                                        {(order.status as any) === 'Outsourced' ? 'Processing' : order.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">{formatPrice(order.total)}</TableCell>
                                                <TableCell className="text-right">
                                                    {order.status === 'Pending Payment' ? (
                                                        <Button size="sm" asChild>
                                                            <Link href={`/order-confirmation/${order.id}`}>
                                                                Pay Now
                                                            </Link>
                                                        </Button>
                                                    ) : (
                                                        <Button variant="ghost" size="sm" asChild>
                                                            <Link href={`/dashboard/orders/${order.id}`}>
                                                                View <ArrowRight className="ml-2 h-4 w-4" />
                                                            </Link>
                                                        </Button>
                                                    )}
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
