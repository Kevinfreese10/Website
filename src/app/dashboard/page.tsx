'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Order, User, OrderNote } from '@/lib/types';
import { useState, useEffect, useMemo } from 'react';
import { getFirestore, collection, orderBy, query, onSnapshot, doc, updateDoc, arrayUnion, where, or } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Loader2, ArrowRight, Inbox, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getClientOrdersAction } from '@/app/actions/order-actions';

const db = getFirestore(firebaseApp);

const userColors = [
  'bg-red-200 text-red-800', 'bg-blue-200 text-blue-800', 'bg-green-200 text-green-800',
  'bg-yellow-200 text-yellow-800', 'bg-purple-200 text-purple-800', 'bg-pink-200 text-pink-800',
];

const getUserColor = (userId: string) => {
  if (!userId) return 'bg-gray-200 text-gray-800';
  const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return userColors[hash % userColors.length];
};

export default function DashboardPage() {
    const { user, updateUser } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);

    useEffect(() => {
        if (user && user.role === 'client' && user.clientSource === 'ai_payroll' && user.payrollClientId) {
            router.push(`/dashboard/ai-payroll/${user.payrollClientId}/dashboard`);
        }
    }, [user, router]);
    const [allStaff, setAllStaff] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [archivedNotifications, setArchivedNotifications] = useState<string[]>([]);

    useEffect(() => {
        const storedArchived = localStorage.getItem('archivedNotifications-client');
        if (storedArchived) {
            setArchivedNotifications(JSON.parse(storedArchived));
        }
    }, []);

    const archiveNotification = (noteId: string) => {
        const newArchived = [...archivedNotifications, noteId];
        setArchivedNotifications(newArchived);
        localStorage.setItem('archivedNotifications-client', JSON.stringify(newArchived));
    };
    
    useEffect(() => {
        setIsLoading(true);

        let staffUnsubscribe = () => {};
        if (user && user.role === 'admin') {
            const staffRef = collection(db, "users");
            staffUnsubscribe = onSnapshot(query(staffRef, where('role', 'in', ['staff', 'admin', 'partner', 'partner_staff', 'ai_accountant'])), (snapshot) => {
                setAllStaff(snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id, id: doc.id } as User)));
            }, (error) => {
                console.error("Error fetching staff:", error);
            });
        }

        let ordersUnsubscribe = () => {};

        if (user) {
            // 1. Initial robust fetch via Server Action (handles direct and guest-matched orders)
            getClientOrdersAction({ userId: user.uid, email: user.email })
                .then(res => {
                    if (res.success && res.orders) {
                        setOrders(prev => {
                            const map = new Map<string, Order>();
                            res.orders.forEach((o: Order) => map.set(o.id, o));
                            prev.forEach(o => map.set(o.id, o));
                            return Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                        });
                    }
                    setIsLoading(false);
                })
                .catch(err => {
                    console.warn("Server action orders fetch error:", err);
                    setIsLoading(false);
                });

            // 2. Real-time listener on user's direct orders
            const ordersRef = collection(db, 'orders');
            const q = query(
                ordersRef, 
                where('userId', '==', user.uid),
                orderBy('date', 'desc')
            );

            ordersUnsubscribe = onSnapshot(q, (snapshot) => {
                const fetchedOrders = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return { 
                        ...data, 
                        id: doc.id,
                        notes: (data.notes || []).map((note: any) => {
                            let noteDate;
                            if (note.date?.toDate) {
                                noteDate = note.date.toDate();
                            } else if (typeof note.date === 'string') {
                                noteDate = new Date(note.date);
                            } else if (note.date instanceof Date) {
                                noteDate = note.date;
                            } else {
                                noteDate = new Date();
                            }
                            return { ...note, date: noteDate };
                        }),
                    } as Order;
                });
                setOrders(prev => {
                    const map = new Map<string, Order>();
                    prev.forEach(o => map.set(o.id, o));
                    fetchedOrders.forEach(o => map.set(o.id, o));
                    return Array.from(map.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                });
                setIsLoading(false);
            }, (error) => {
                console.warn("Direct orders snapshot warning:", error);
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }

        return () => {
            staffUnsubscribe();
            ordersUnsubscribe();
        }
    }, [user]);

    const toDate = (val: any): Date => {
        if (!val) return new Date();
        if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;
        if (typeof val?.toDate === 'function') return val.toDate();
        const d = new Date(val);
        return isNaN(d.getTime()) ? new Date() : d;
    };

    const notifications = useMemo(() => {
        if (!user || orders.length === 0) return [];
        let allNotes: (OrderNote & { orderId: string, orderTitle: string, customerName: string })[] = [];
        orders.forEach(order => {
          const notes = (order.notes || [])
            .filter(note => note.authorId !== user.id && note.authorId !== (user as any).uid && note.type === 'note' && !note.isInternal)
            .map(note => ({
              ...note,
              date: toDate(note.date),
              orderId: order.id,
              orderTitle: order.items?.[0]?.title || 'Untitled Order',
              customerName: order.customerName,
            }));
          allNotes.push(...notes);
        });
        return allNotes.sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime());
      }, [orders, user]);

    const activeNotifications = useMemo(() => {
        return notifications.filter(n => {
            const dateStr = n.date instanceof Date ? n.date.toISOString() : String(n.date);
            return !archivedNotifications.includes(n.orderId + dateStr);
        });
    }, [notifications, archivedNotifications]);

    const getAuthor = (authorId: string): User | undefined => {
        return allStaff.find(u => u.id === authorId || (u as any).uid === authorId);
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.name}!</h1>
                <p className="text-muted-foreground">Here's a summary of your recent activity and notifications.</p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                    <CardDescription>Recent updates and messages from our team.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary"aria-hidden="true" /><span className="sr-only">Loading…</span></div>
                    ) : activeNotifications.length > 0 ? (
                        <ScrollArea className="h-96">
                            <div className="space-y-6">
                            {activeNotifications.map((note, index) => {
                                const author = getAuthor(note.authorId);
                                const date = toDate(note.date);
                                const noteId = note.orderId + date.toISOString();
                                return (
                                    <div key={index} className="flex items-start gap-4">
                                        <div className={cn("mt-1 h-10 w-10 rounded-full flex items-center justify-center font-bold text-base shadow-sm", getUserColor(note.authorId))}>
                                            {author?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm">
                                                    <span className="font-semibold">{author?.name || 'Support Team'}</span>
                                                    <span className="text-muted-foreground ml-1">left a note on order </span>
                                                    <Link href={`/dashboard/orders/${note.orderId}`} className="font-semibold text-primary hover:underline">{note.orderId}</Link>
                                                </p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                                    {formatDistanceToNow(date, { addSuffix: true })}
                                                </p>
                                            </div>
                                            <div className="bg-muted/50 p-3 rounded-lg border border-muted">
                                                <p className="text-sm text-foreground/90 leading-relaxed italic">
                                                    "{note.text}"
                                                </p>
                                            </div>
                                            <div className="flex justify-end pt-1">
                                                <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => archiveNotification(noteId)}>
                                                    <Archive className="mr-1.5 h-3.5 w-3.5"/> Archive Notification
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                            <Inbox className="h-12 w-12 mb-4 opacity-20"/>
                            <p className="font-semibold">All caught up!</p>
                            <p className="text-sm">You have no new notifications.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>Track the status of your active requests.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {orders.slice(0, 3).map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border bg-card text-card-foreground">
                            <div>
                                <p className="font-semibold text-sm">{order.items?.[0]?.title || 'Service Order'}</p>
                                <p className="text-xs text-muted-foreground font-mono">Order #{order.id}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={cn(
                                    "px-2.5 py-0.5 rounded-full text-xs font-bold",
                                    order.status === 'Completed' ? "bg-green-100 text-green-800" :
                                    order.status === 'Processing' ? "bg-blue-100 text-blue-800" :
                                    order.status === 'Pending Payment' ? "bg-amber-100 text-amber-800" :
                                    "bg-slate-100 text-slate-800"
                                )}>
                                    {order.status}
                                </span>
                                <Button asChild size="sm" variant="outline">
                                    <Link href={`/dashboard/orders/${order.id}`}>View</Link>
                                </Button>
                            </div>
                        </div>
                    ))}
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/dashboard/orders">
                            View All My Orders <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
