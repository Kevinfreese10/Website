'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { getFirestore, collection, getDocs, orderBy, query, where, doc, updateDoc, arrayUnion, getDoc, Timestamp, addDoc, writeBatch, onSnapshot, setDoc, serverTimestamp, increment, or } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Order, User, Service, OrderNote, Task, ItnLog } from '@/lib/types';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, Loader2, PlusCircle, MessageSquare, ArrowRight, CheckCircle2, Wallet2, AlertCircle, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import CreatePartnerOrderForm from '@/components/partner/CreatePartnerOrderForm';
import { useRouter } from 'next/navigation';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn, formatDate } from '@/lib/utils';
import { render } from '@react-email/components';
import React from 'react';
import DocumentRequestEmail from '@/components/emails/DocumentRequestEmail';
import { sendPartnerOrderEmail } from '@/app/actions/email-gateway';
import { getAuth } from 'firebase/auth';
import { getNextOrderId } from '@/lib/sequence';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { ProcessOrderModal } from '@/components/partner/ProcessOrderModal';
import { completeOrderWithRoyalty, outsourceOrderFromWallet } from '@/app/actions/wallet-actions';


const db = getFirestore(firebaseApp);

async function getIdToken(): Promise<string> {
    const token = await getAuth(firebaseApp).currentUser?.getIdToken();
    if (!token) throw new Error('You must be signed in to do this.');
    return token;
}

export default function PartnerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [allServices, setAllServices] = useState<Service[]>(staticServices);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { isGrowthActive, hasPlatformFee } = usePartner();
  const [allStaff, setAllStaff] = useState<User[]>([]);
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [selectedOrderForProcess, setSelectedOrderForProcess] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const staffCounters = useRef<{ [key: string]: number }>({});
  const router = useRouter();
    
  const orderStatuses: Order['status'][] = ['Pending Payment', 'Processing', 'Completed', 'Cancelled'];
  const partnerId = user?.role === 'partner' ? user.uid : user?.partnerId;

  const statusCounts = useMemo(() => {
    return {
      all: orders.length,
      processing: orders.filter(o => o.status === 'Processing').length,
      pending: orders.filter(o => o.status === 'Pending Payment').length,
      completed: orders.filter(o => o.status === 'Completed').length,
      cancelled: orders.filter(o => o.status === 'Cancelled').length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesId = order.id.toLowerCase().includes(term);
        const matchesName = (order.endCustomerName || order.customerName || '').toLowerCase().includes(term);
        const matchesEmail = (order.endCustomerEmail || order.customerEmail || '').toLowerCase().includes(term);
        if (!matchesId && !matchesName && !matchesEmail) return false;
      }
      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  const getNextStaffMember = (department: 'Accounting and Tax' | 'Administration' | 'CAP'): User | undefined => {
      const activeStaff = allStaff.filter(u => 
        (u.role === 'staff' || u.role === 'admin') && 
        u.isActive !== false && 
        u.status !== 'Inactive' && 
        u.status !== 'Archived' && 
        u.status !== 'Deactivated' && 
        !(u as any).disabled
      );

      const staffInDept = activeStaff.filter(u => u.department === department && u.role === 'staff');
      const candidates = staffInDept.length > 0 ? staffInDept : activeStaff;
      if (candidates.length === 0) return undefined;

      const currentIndex = staffCounters.current[department] || 0;
      const nextStaff = candidates[currentIndex % candidates.length];
      
      staffCounters.current[department] = (currentIndex + 1) % candidates.length;
      
      return nextStaff;
  };

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

    let staffPromise;
    if (user?.role === 'admin') {
        const staffQuery = query(collection(db, "users"), where('role', 'in', ['staff', 'admin']));
        staffPromise = getDocs(staffQuery);
    } else if (partnerId) {
        const staffQuery = query(collection(db, "users"), where('partnerId', '==', partnerId));
        staffPromise = getDocs(staffQuery);
    } else {
        staffPromise = Promise.resolve({ docs: [] } as any);
    }
    
    staffPromise.then(staffSnapshot => {
        const fetchedStaff = staffSnapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id } as User));
        setAllStaff(fetchedStaff);
    }).catch(err => {
        console.error("Error loading staff:", err);
    });

    const servicesQuery = query(collection(db, 'services'));
    getDocs(servicesQuery).then(servicesSnapshot => {
        const fetchedServices = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
        setAllServices(fetchedServices);
    }).catch(err => {
        console.error("Error loading services:", err);
    });

    const ordersRef = collection(db, 'orders');
    const q = user?.email
      ? query(
          ordersRef,
          or(
            where('resellerId', '==', partnerId),
            where('userId', '==', partnerId),
            where('customerEmail', '==', user.email)
          )
        )
      : query(ordersRef, where('resellerId', '==', partnerId));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedOrders = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                date: data.date?.toDate ? data.date.toDate().toISOString() : new Date().toISOString(),
            } as Order;
        });
        // Sort in memory descending by date
        fetchedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setOrders(fetchedOrders.filter(order => order.status !== 'Cancelled' && !order.originalOrderId));
        setIsLoading(false);
    }, async (error) => {
        const permissionError = new FirestorePermissionError({
            path: 'orders',
            operation: 'list',
          } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid, partnerId]);



    const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (!orderToUpdate || !user || !partnerId) return;

    // Intercept: show modal for Processing (wallet payment required)
    if (newStatus === 'Processing' && !orderToUpdate.isOutsourced) {
      setSelectedOrderForProcess(orderToUpdate);
      setProcessModalOpen(true);
      return;
    }

    try {
      const orderRef = doc(db, 'orders', orderId);
      updateDoc(orderRef, {
        status: newStatus,
      }).catch(async (error) => {
          const permissionError = new FirestorePermissionError({
              path: orderRef.path,
              operation: 'update',
              requestResourceData: { status: newStatus }
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
      });

      if (newStatus === 'Processing') {
          // If moving to processing and NOT outsourced, create an internal task
          if (!orderToUpdate.isOutsourced) {
              const taskData = {
                  title: `Process Order: ${orderToUpdate.id}`,
                  description: `Practice fulfillment for ${orderToUpdate.endCustomerName || orderToUpdate.customerName}. Services: ${orderToUpdate.items.map(i => i.title).join(', ')}.`,
                  assignedTo: [user.uid],
                  createdBy: user.uid,
                  dueDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
                  priority: 'Medium' as const,
                  status: 'To-Do' as const,
                  orderId: orderToUpdate.id,
                  partnerId: partnerId,
                  comments: [],
                  createdAt: serverTimestamp(),
              };
              addDoc(collection(db, 'tasks'), taskData).catch(async (error) => {
                  const permissionError = new FirestorePermissionError({
                      path: 'tasks',
                      operation: 'create',
                      requestResourceData: taskData
                  } satisfies SecurityRuleContext);
                  errorEmitter.emit('permission-error', permissionError);
              });
              toast({ title: 'Task Created', description: 'A task has been added to your dashboard for fulfillment.' });
          }

          // NOTIFY CLIENT: Confirmation of payment & Request for documents
          const emailTo = orderToUpdate.isOutsourced && orderToUpdate.documentContact === 'client' 
              ? orderToUpdate.endCustomerEmail 
              : orderToUpdate.customerEmail;
          if (emailTo) {
              const itemsWithServices = orderToUpdate.items.map(item => {
                  const service = allServices.find(s => s.id === item.id);
                  return { ...item, service };
              }).filter(item => item.service) as { service: Service }[];

              const emailHtml = render(React.createElement(DocumentRequestEmail, {
                  order: { ...orderToUpdate, id: orderToUpdate.originalOrderId || orderToUpdate.id },
                  items: itemsWithServices,
                  reseller: user,
                  replyTo: user.email,
              }));

              await sendPartnerOrderEmail({
                  idToken: await getIdToken(),
                  partnerId: partnerId!,
                  to: emailTo,
                  subject: `Action Required for Your Order #${orderToUpdate.originalOrderId || orderToUpdate.id}`,
                  html: emailHtml,
                  resellerId: partnerId,
              });

              const note: OrderNote = {
                  text: `Sent "Payment Confirmed & Request Documents" email to ${emailTo}.`,
                  date: Timestamp.now(),
                  authorId: user.uid,
                  type: 'email',
                  subject: `Action Required for Your Order #${orderToUpdate.originalOrderId || orderToUpdate.id}`,
                  attachments: null,
              };
              updateDoc(orderRef, {
                  notes: arrayUnion(note)
              }).catch(async (error) => {
                  const permissionError = new FirestorePermissionError({
                      path: orderRef.path,
                      operation: 'update',
                      requestResourceData: { notes: arrayUnion(note) }
                  } satisfies SecurityRuleContext);
                  errorEmitter.emit('permission-error', permissionError);
              });
          }
      }

      toast({
        title: 'Status Updated',
        description: `Order ${orderId} has been marked as ${newStatus}.`,
      });

    } catch (error) {
      console.error('Error updating order status: ', error);
      toast({
        title: 'Update Failed',
        description: 'There was a problem updating the order status.',
        variant: 'destructive',
      });
    }
  };

    const getStatusVariant = (status: Order['status'] | 'Outsourced') => {
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
    };
    
    const handleOrderCreated = () => {
        setIsCreateOrderOpen(false);
    };

    const handleProcessOrderConfirm = async (choice: 'complete' | 'outsource', documentContact?: 'partner' | 'client') => {
      if (!selectedOrderForProcess || !partnerId) return;
      
      try {
        if (choice === 'complete') {
          const result = await completeOrderWithRoyalty(selectedOrderForProcess.id, partnerId);
          if ('error' in result) {
            toast({ title: 'Failed', description: result.error === 'INSUFFICIENT_FUNDS' ? 'Insufficient wallet balance. Please top up.' : result.error, variant: 'destructive' });
            return;
          }
          toast({ title: 'Order Processing', description: `Royalty of R${result.royalty.toFixed(2)} deducted from your wallet.` });
        } else {
          const result = await outsourceOrderFromWallet(selectedOrderForProcess.id, partnerId, documentContact || 'partner');
          if ('error' in result) {
            toast({ title: 'Failed', description: result.error === 'INSUFFICIENT_FUNDS' ? 'Insufficient wallet balance. Please top up.' : result.error, variant: 'destructive' });
            return;
          }
          toast({ title: 'Order Outsourced', description: `R${result.cost.toFixed(2)} deducted from your wallet. My Accountant will begin work immediately.` });
        }
        setProcessModalOpen(false);
        setSelectedOrderForProcess(null);
      } catch (err) {
        console.error('Process order failed:', err);
        toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
      }
    };

    return (
        <div className="space-y-8">
             <ProcessOrderModal
                open={processModalOpen}
                onOpenChange={setProcessModalOpen}
                order={selectedOrderForProcess}
                walletBalance={user?.creditBalance ?? 0}
                allServices={allServices}
                hasPlatformFee={hasPlatformFee}
                onConfirm={handleProcessOrderConfirm}
            />

              <Card>
                <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                    <CardTitle>Your Client Orders</CardTitle>
                    <CardDescription>
                        View and manage all orders you've created for your clients.
                    </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search orders, customers..." 
                            className="pl-9 h-10" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <Dialog open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen}>
                        <DialogTrigger asChild>
                             <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create New Order
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-4xl">
                             <DialogHeader>
                                <DialogTitle>New Order Details</DialogTitle>
                                <DialogDescription>Fill out the form below to create a new order for a client.</DialogDescription>
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
                    <Button
                        type="button"
                        variant={statusFilter === 'Cancelled' ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 text-xs font-semibold rounded-full gap-1.5"
                        onClick={() => setStatusFilter('Cancelled')}
                    >
                        Cancelled
                        <span className={cn("px-1.5 py-0.2 rounded-full text-[10px]", statusFilter === 'Cancelled' ? "bg-primary-foreground/20 text-primary-foreground" : "bg-red-100 text-red-800")}>
                            {statusCounts.cancelled}
                        </span>
                    </Button>
                </div>
                </CardHeader>
                <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="py-12 text-center space-y-3">
                        <p className="text-muted-foreground">No orders matching your search or filters.</p>
                        <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>Clear Filters</Button>
                    </div>
                ) : (
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Fulfillment</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.id}</TableCell>
                            <TableCell>{formatDate(order.date)}</TableCell>
                            <TableCell>
                                <div>
                                    <p className="font-medium">{order.endCustomerName || order.customerName}</p>
                                    <p className="text-xs text-muted-foreground">{order.endCustomerEmail || order.customerEmail}</p>
                                </div>
                            </TableCell>
                            <TableCell>
                            <Badge variant={getStatusVariant(order.status)}>
                                {(order.status as any) === 'Outsourced' ? 'Processing' : order.status}
                            </Badge>
                            </TableCell>
                            <TableCell>
                                {order.isOutsourced ? (
                                    <Badge variant="outsourced">Outsourced</Badge>
                                ) : (
                                    <Badge variant="secondary">Internal</Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-right font-semibold">{formatPrice(order.clientTotal || order.total)}</TableCell>
                            <TableCell className="text-right">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                    <Link href={`/partner/orders/${order.id}`}>View Details</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuSub>
                                    <DropdownMenuSubTrigger disabled={order.isOutsourced}>Change Status</DropdownMenuSubTrigger>
                                    <DropdownMenuSubContent>
                                        {orderStatuses.map(status => (
                                            <DropdownMenuItem
                                                key={status}
                                                onClick={() => handleUpdateStatus(order.id, status)}
                                                disabled={order.status === status}
                                            >
                                                Mark as {status}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuSubContent>
                                </DropdownMenuSub>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                )}
                </CardContent>
            </Card>
        </div>
    );
}
