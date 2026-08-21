'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { getFirestore, collection, getDocs, orderBy, query, where, doc, updateDoc, arrayUnion, getDoc, Timestamp, addDoc, writeBatch, onSnapshot } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Order, User, Service, OrderNote, Task, ItnLog } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { services as allServices } from '@/lib/data';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, Loader2, PlusCircle, MessageSquare, Server, Search, Filter, RefreshCw, Link as LinkIcon, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select';
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
import {
  notifyStaffOfAssignment, 
  sendDocumentRequestEmailAction, 
  sendReviewRequestEmailAction, 
  sendOrderStatusUpdateEmailAction 
} from '@/app/actions/order-actions';
import {
  updateOrderStatusAtomic,
  transitionOrderStatusAtomic,
  reassignOrderStaffAtomic,
  getNextStaffMemberPersisted
} from '@/app/actions/order-admin-actions';
import PaymentConfirmationEmail from '@/components/emails/PaymentConfirmationEmail';
import { Dialog } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

const db = getFirestore(firebaseApp);

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');
  const [isReconciling, setIsReconciling] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [allStaff, setAllStaff] = useState<User[]>([]);

  const staffCounters = useRef<{ [key: string]: number }>({});
  
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
    if (!user) return;
    setIsLoading(true);

    const staffQuery = query(collection(db, "users"), where('role', 'in', ['staff', 'admin', 'cap_staff', 'cap_supervisor']));
    getDocs(staffQuery).then(staffSnapshot => {
        const fetchedStaff = staffSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
        fetchedStaff.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setAllStaff(fetchedStaff);
    }).catch(error => {
        console.error("Error fetching staff:", error);
    });

    const ordersRef = collection(db, 'orders');
    const ordersQuery = query(ordersRef, orderBy('date', 'desc'));
    
    const unsubscribe = onSnapshot(ordersQuery, async (snapshot) => {
        const fetchedOrders = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                date: data.date?.toDate ? data.date.toDate().toISOString() : new Date().toISOString(),
                notes: (data.notes || []).map((note: any) => ({...note, date: note.date?.toDate ? note.date.toDate().toISOString() : new Date().toISOString()})),
                itnHistory: (data.itnHistory || []).map((log: any) => ({ ...log, receivedAt: log.receivedAt?.toDate ? log.receivedAt.toDate().toISOString() : new Date().toISOString() })),
            } as Order;
        });

        const ordersWithClientDetails = await Promise.all(fetchedOrders.map(async (order) => {
            if (order.resellerId && order.originalOrderId && !order.endCustomerEmail) {
                const originalOrderRef = doc(db, 'orders', order.originalOrderId);
                const originalOrderSnap = await getDoc(originalOrderRef);
                if (originalOrderSnap.exists()) {
                    const originalOrderData = originalOrderSnap.data();
                    order.endCustomerName = originalOrderData.customerName;
                    order.endCustomerEmail = originalOrderData.customerEmail;
                }
            }
            return order;
        }));
        
        // ADMIN VISIBILITY BASE LOGIC:
        // 1. Direct Customer Orders (resellerId is null or empty)
        // 2. Explicitly Outsourced Work (resellerId IS set AND (isOutsourced IS true OR originalOrderId IS set))
        // 3. Partner Direct Purchases (partner buying services on platform for themselves, e.g. userId === resellerId)
        // 4. Partner Platform Purchases (setup fees / topups)
        // 5. HIDE: Internal Partner-only Orders (handled by the partner for their own clients without outsourcing)
        const visibleOrders = ordersWithClientDetails.filter(order => {
            const isDirectOrder = !order.resellerId;
            const isOutsourcedWork = !!(order.resellerId && (order.isOutsourced || order.originalOrderId));
            const isPartnerDirectPurchase = !!(order.resellerId && order.userId === order.resellerId);
            const isPartnerPurchase = !!(order.resellerId && !order.isOutsourced && !order.originalOrderId && order.items?.some(i => i.id?.startsWith('partner_') || i.id?.includes('topup') || i.id?.includes('setup')));
            return (isDirectOrder || isOutsourcedWork || isPartnerDirectPurchase || isPartnerPurchase);
        });

        setOrders(visibleOrders);
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching orders in real-time:", error);
        toast({ title: "Error", description: "Could not fetch real-time order data.", variant: "destructive" });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  // Load saved filters on mount
  useEffect(() => {
    const savedAssigned = localStorage.getItem('adminOrdersAssignedFilter');
    if (savedAssigned) setAssignedFilter(savedAssigned);
    
    const savedStatus = localStorage.getItem('adminOrdersStatusFilter');
    if (savedStatus && savedStatus !== 'active') {
      setStatusFilter(savedStatus);
    } else {
      setStatusFilter('all');
    }
  }, []);

  const handleAssignedFilterChange = (value: string) => {
    setAssignedFilter(value);
    localStorage.setItem('adminOrdersAssignedFilter', value);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    localStorage.setItem('adminOrdersStatusFilter', value);
  };

  const statusCounts = useMemo(() => {
    return {
      all: orders.length,
      active: orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length,
      processing: orders.filter(o => o.status === 'Processing' || (o.status as any) === 'Outsourced').length,
      pending: orders.filter(o => o.status === 'Pending Payment').length,
      waiting: orders.filter(o => o.status === 'Waiting on Customer' || o.status === 'Waiting for Information' || (o.status as any) === 'Waiting on Client').length,
      review: orders.filter(o => o.status === 'Under Review').length,
      completed: orders.filter(o => o.status === 'Completed').length,
      cancelled: orders.filter(o => o.status === 'Cancelled').length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
        // Status filter: 'active' shows Processing & Pending; 'all' shows everything
        if (statusFilter === 'active') {
            if (order.status === 'Completed' || order.status === 'Cancelled') return false;
        } else if (statusFilter !== 'all') {
            if (order.status !== statusFilter) return false;
        }

        // Assigned filter
        if (assignedFilter === 'mine') {
            const currentUserId = user?.id || (user as any)?.uid;
            if (!currentUserId || !order.assignedTo?.includes(currentUserId)) return false;
        } else if (assignedFilter === 'unassigned') {
            if (order.assignedTo && order.assignedTo.length > 0) return false;
        } else if (assignedFilter !== 'all') {
            if (!order.assignedTo || !order.assignedTo.includes(assignedFilter)) return false;
        }

        // Search term filter
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            const matchesId = order.id.toLowerCase().includes(term);
            const matchesOriginalId = order.originalOrderId?.toLowerCase().includes(term);
            const matchesName = order.customerName?.toLowerCase().includes(term) || order.endCustomerName?.toLowerCase().includes(term);
            const matchesEmail = order.customerEmail?.toLowerCase().includes(term) || order.endCustomerEmail?.toLowerCase().includes(term);
            const matchesPhone = order.customerPhone?.toLowerCase().includes(term);
            
            if (!matchesId && !matchesOriginalId && !matchesName && !matchesEmail && !matchesPhone) return false;
        }

        return true;
    });
  }, [orders, searchTerm, statusFilter, assignedFilter, user]);

   const handleAssignment = async (orderId: string, staffId: string) => {
    try {
        const batch = writeBatch(db);

        // 1. Update the order
        const orderRef = doc(db, 'orders', orderId);
        batch.update(orderRef, { assignedTo: [staffId] });

        // 2. Find and update the associated task
        const tasksQuery = query(collection(db, 'tasks'), where('orderId', '==', orderId));
        const tasksSnapshot = await getDocs(tasksQuery);
        
        if (!tasksSnapshot.empty) {
            const taskDoc = tasksSnapshot.docs[0];
            batch.update(taskDoc.ref, { assignedTo: [staffId] });
        }

        await batch.commit();

        // Notify the assigned staff member via Server Action
        await notifyStaffOfAssignment(orderId, staffId);

        toast({
            title: 'Order Reassigned',
            description: `Order and its associated task have been assigned.`,
        });
    } catch (error) {
        console.error('Error reassigning order: ', error);
        toast({
            title: 'Assignment Failed',
            description: 'There was a problem reassigning the order.',
            variant: 'destructive',
        });
    }
  };


  const addEmailToHistory = async (orderId: string, subject: string, message: string) => {
    if (!user?.id) return;

     const emailNote: OrderNote = {
      text: message,
      subject: subject || null,
      authorId: user.id,
      date: Timestamp.now(),
      type: 'email',
      attachments: null,
    };

    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        notes: arrayUnion(emailNote),
      });
    } catch (error) {
        console.error("Error logging email to history:", error);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    const orderToUpdate = orders.find(o => o.id === orderId);
    if (!orderToUpdate || !user || !user.id) {
        toast({
            title: 'Action Failed',
            description: 'Cannot update status. User not found or not authenticated.',
            variant: 'destructive',
        });
        return;
    }

    const performer = {
        id: user.id,
        name: user.name || user.email || 'Admin',
    };

    let assignedStaffIds = orderToUpdate.assignedTo;
    let assignedStaffMember = assignedStaffIds?.[0] ? allStaff.find(s => s.id === assignedStaffIds![0]) : undefined;

    // Persisted assignment when moving to "Processing"
    if (newStatus === 'Processing' && !assignedStaffIds?.length) {
        const department = orderToUpdate.department as 'Accounting and Tax' | 'Administration' | 'CAP' | undefined;
        if (department) {
            const activeStaffInDept = allStaff.filter(u => 
                (u.role === 'staff' || u.role === 'admin') && 
                u.isActive !== false && 
                u.status !== 'Inactive' && 
                (u.department === department || (Array.isArray(u.departments) && u.departments.includes(department)))
            );
            const nextStaff = await getNextStaffMemberPersisted(department, activeStaffInDept.map(s => ({ id: s.id, name: s.name, department: s.department })));
            if (nextStaff) {
                assignedStaffMember = allStaff.find(s => s.id === nextStaff.id);
                assignedStaffIds = [nextStaff.id];
                await reassignOrderStaffAtomic(orderId, assignedStaffIds, department, performer);
                toast({
                    title: 'Order Assigned',
                    description: `Order has been assigned to ${nextStaff.name}.`
                });

                if (assignedStaffMember?.email) {
                    await notifyStaffOfAssignment(orderId, nextStaff.id);
                }
            }
        }
    }

    try {
      const res = await transitionOrderStatusAtomic(orderId, newStatus, performer);
      if (!res.success) {
          toast({
              title: 'Status Update Blocked',
              description: res.error,
              variant: 'destructive',
          });
          return;
      }

      // Create a task if moving to processing and a staff member is assigned
      if (newStatus === 'Processing' && assignedStaffIds && assignedStaffIds.length > 0 && user.id) {
          const taskData = {
              title: `Process Order: ${orderToUpdate.id}`,
              description: `Fulfill the services for order ${orderToUpdate.id}. Services include: ${orderToUpdate.items.map(i => i.title).join(', ')}.`,
              assignedTo: assignedStaffIds,
              createdBy: user.id,
              dueDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days from now
              priority: 'Medium',
              status: 'To-Do',
              orderId: orderToUpdate.id,
              comments: [],
          };
          await addDoc(collection(db, 'tasks'), taskData);
          toast({
              title: 'Task Created',
              description: `A new task has been created for ${assignedStaffMember?.name} to process this order.`,
          });
      }

      toast({
        title: 'Status Updated',
        description: `Order ${orderId} has been marked as ${newStatus}.`,
      });
      
      if (newStatus === 'Processing' && user.email) {
        const result = await sendDocumentRequestEmailAction(orderId, user.email, newStatus);
        
        if (result.success && result.subject) {
          await addEmailToHistory(orderToUpdate.id, result.subject, "Sent 'Request Documents' email to client.");
          toast({
              title: 'Document Request Sent',
              description: `An email has been sent to the client.`
          });
        }
      }

      if (newStatus === 'Completed') {
        const result = await sendReviewRequestEmailAction(orderId);
        if (result.success) {
          toast({
              title: 'Review Request Sent',
              description: `An email has been sent to the client requesting a review.`
          });
        }
      }

      if (newStatus === 'Cancelled' || newStatus === 'Pending Payment') {
          const result = await sendOrderStatusUpdateEmailAction(orderId, newStatus);
          if (result.success) {
            toast({
                title: 'Status Update Email Sent',
                description: `An email has been sent to the client regarding the new status.`
            });
          }
      }

    } catch (error) {
      console.error('Error updating order status: ', error);
      toast({
        title: 'Update Failed',
        description: 'There was a problem updating the order status.',
        variant: 'destructive',
      });
    }
  };

  const safeFormatDate = (rawDate: any, formatStr = 'dd MMM yyyy'): string => {
    if (!rawDate) return '';
    try {
      if (typeof rawDate?.toDate === 'function') {
        return format(rawDate.toDate(), formatStr);
      }
      const d = new Date(rawDate);
      if (isNaN(d.getTime())) return '';
      return format(d, formatStr);
    } catch {
      return '';
    }
  };

  const getAssignee = (userId?: string): User | undefined => {
    if (!userId) return undefined;
    return allStaff.find(u => u.id === userId);
  }

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

  const getCustomerName = (order: Order) => {
    return order.endCustomerName || order.customerName;
  }

  const getSourceText = (order: Order) => {
    return order.source || 'Client';
  }


  const handleReconcile = async () => {
    setIsReconciling(true);
    try {
      const res = await fetch('/api/admin/reconcile-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ daysBack: 3 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Reconcile failed');

      const { results } = json;
      if (results.updated.length > 0) {
        toast({
          title: `✅ ${results.updated.length} Order(s) Updated`,
          description: `Orders ${results.updated.join(', ')} moved to Processing.`,
        });
      } else {
        toast({
          title: 'No Orders Updated',
          description: `Checked ${results.notFound.length + results.skipped.length + results.updated.length} pending order(s). None had confirmed PayFast payments in the last 3 days.`,
        });
      }
    } catch (err: any) {
      toast({ title: 'Reconcile Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <div className="space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Manage Orders</h1>
                <p className="text-sm text-muted-foreground">Monitor and update client orders across the practice.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleReconcile} disabled={isReconciling}>
                {isReconciling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                {isReconciling ? 'Reconciling...' : 'Reconcile Payments'}
              </Button>
              <Button asChild>
                <Link href="/admin/orders/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Custom Order
                </Link>
              </Button>
            </div>
        </div>

        <Card className="border-2 shadow-sm">
            <CardHeader className="bg-muted/10 pb-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <CardTitle>All Client Orders</CardTitle>
                        <CardDescription>
                            {user?.role === 'staff' ? 'Showing all orders assigned to you.' : 'View and manage all active orders in the system.'}
                        </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search orders, customers..." 
                                className="pl-9 h-10 border-primary/10" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Filter className="h-4 w-4 text-muted-foreground hidden sm:block" />
                            <Select value={assignedFilter} onValueChange={handleAssignedFilterChange}>
                                <SelectTrigger className="h-10 w-full sm:w-[180px] font-bold border-primary/10">
                                    <SelectValue placeholder="All Staff" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    <SelectItem value="all">All Staff</SelectItem>
                                    <SelectItem value="mine">My Orders</SelectItem>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    {allStaff.length > 0 && <SelectSeparator />}
                                    {allStaff.map(staff => (
                                        <SelectItem key={staff.id} value={staff.id}>
                                            {staff.name || staff.email} {staff.isActive === false ? '(Inactive)' : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                                <SelectTrigger className="h-10 w-full sm:w-[180px] font-bold border-primary/10">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="active">Active Orders</SelectItem>
                                    <SelectItem value="Processing">Processing</SelectItem>
                                    <SelectItem value="Waiting on Customer">Waiting on Customer</SelectItem>
                                    <SelectItem value="Waiting for Information">Waiting for Information</SelectItem>
                                    <SelectItem value="Under Review">Under Review</SelectItem>
                                    <SelectItem value="Pending Payment">Pending Payment</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Quick Status Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border/40">
                    <Button
                        type="button"
                        variant={statusFilter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 text-xs font-semibold rounded-full gap-1.5"
                        onClick={() => handleStatusFilterChange('all')}
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
                        onClick={() => handleStatusFilterChange('Processing')}
                    >
                        Processing
                        <span className={cn("px-1.5 py-0.2 rounded-full text-[10px]", statusFilter === 'Processing' ? "bg-primary-foreground/20 text-primary-foreground" : "bg-blue-100 text-blue-800")}>
                            {statusCounts.processing}
                        </span>
                    </Button>
                    <Button
                        type="button"
                        variant={statusFilter === 'Waiting on Customer' ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 text-xs font-semibold rounded-full gap-1.5"
                        onClick={() => handleStatusFilterChange('Waiting on Customer')}
                    >
                        Waiting on Customer
                        <span className={cn("px-1.5 py-0.2 rounded-full text-[10px]", statusFilter === 'Waiting on Customer' ? "bg-primary-foreground/20 text-primary-foreground" : "bg-amber-100 text-amber-800")}>
                            {statusCounts.waiting}
                        </span>
                    </Button>
                    <Button
                        type="button"
                        variant={statusFilter === 'Under Review' ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 text-xs font-semibold rounded-full gap-1.5"
                        onClick={() => handleStatusFilterChange('Under Review')}
                    >
                        Under Review
                        <span className={cn("px-1.5 py-0.2 rounded-full text-[10px]", statusFilter === 'Under Review' ? "bg-primary-foreground/20 text-primary-foreground" : "bg-indigo-100 text-indigo-800")}>
                            {statusCounts.review}
                        </span>
                    </Button>
                    <Button
                        type="button"
                        variant={statusFilter === 'Pending Payment' ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 text-xs font-semibold rounded-full gap-1.5"
                        onClick={() => handleStatusFilterChange('Pending Payment')}
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
                        onClick={() => handleStatusFilterChange('Completed')}
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
                        onClick={() => handleStatusFilterChange('Cancelled')}
                    >
                        Cancelled
                        <span className={cn("px-1.5 py-0.2 rounded-full text-[10px]", statusFilter === 'Cancelled' ? "bg-primary-foreground/20 text-primary-foreground" : "bg-red-100 text-red-800")}>
                            {statusCounts.cancelled}
                        </span>
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="p-0">
            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                    <p className="text-muted-foreground font-medium">No active orders matching your search or filters.</p>
                    <Button variant="outline" onClick={() => { 
                        setSearchTerm(''); 
                        handleStatusFilterChange('all'); 
                        handleAssignedFilterChange('all'); 
                    }}>Clear Filters</Button>
                </div>
            ) : (
                <Table>
                <TableHeader className="bg-muted/5">
                    <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Last Update</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredOrders.map((order) => {
                    const assignee = getAssignee(order.assignedTo?.[0]);
                    const lastNote = order.notes && order.notes.length > 0 ? order.notes[order.notes.length - 1] : null;
                    const lastNoteAuthor = lastNote ? getAssignee(lastNote.authorId) : null;
                    const customerName = getCustomerName(order);
                    return (
                    <TableRow key={order.id} className="hover:bg-muted/5 transition-colors">
                        <TableCell className="font-bold text-slate-900">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <p>{order.originalOrderId || order.id}</p>
                                {order.dependsOnOrderIds && order.dependsOnOrderIds.length > 0 && (() => {
                                    const hasIncomplete = orders.some(o => order.dependsOnOrderIds?.includes(o.id) && o.status !== 'Completed');
                                    return (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <span className="cursor-help inline-flex">
                                                        {hasIncomplete ? (
                                                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-500/10 text-amber-700 border-amber-500/30 gap-1 font-bold">
                                                                <AlertTriangle className="h-2.5 w-2.5 text-amber-600" />
                                                                Blocked
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-700 border-emerald-500/30 gap-1 font-bold">
                                                                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" />
                                                                Prereqs Done
                                                            </Badge>
                                                        )}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="text-xs">Prerequisites: {order.dependsOnOrderIds.map(id => `#${id}`).join(', ')}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    );
                                })()}
                                {order.blockedOrderIds && order.blockedOrderIds.length > 0 && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="cursor-help inline-flex">
                                                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-500/10 text-blue-700 border-blue-500/30 gap-1 font-bold">
                                                        <LinkIcon className="h-2.5 w-2.5 text-blue-600" />
                                                        Blocks #{order.blockedOrderIds.join(', #')}
                                                    </Badge>
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="text-xs">Dependent Orders waiting on this: {order.blockedOrderIds.map(id => `#${id}`).join(', ')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{safeFormatDate(order.date, 'dd MMM yyyy')}</p>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col">
                                <span className="font-semibold text-slate-700">{customerName}</span>
                                <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">{order.customerEmail}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                        {assignee ? (
                            <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Badge variant="outline" className="font-bold border-primary/20 text-primary bg-primary/5 cursor-help">
                                        {assignee.name.split(' ')[0]}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                <p>{assignee.name} ({assignee.department})</p>
                                </TooltipContent>
                            </Tooltip>
                            </TooltipProvider>
                        ) : (
                            <span className="text-muted-foreground text-xs italic">Unassigned</span>
                        )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                            {lastNote ? (
                                <div className="flex items-start gap-2">
                                    <MessageSquare className="h-3 w-3 text-primary flex-shrink-0 mt-0.5" />
                                    <div className="text-[10px] leading-tight">
                                        <span className="font-black text-slate-900">{lastNoteAuthor ? lastNoteAuthor.name.split(' ')[0] : 'Client'}:</span>
                                        <span className="text-muted-foreground ml-1">"{lastNote.subject || lastNote.text}"</span>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter opacity-50">No updates</span>
                            )}
                        </TableCell>
                        <TableCell>
                        <Badge variant={getStatusVariant(order.status)} className="text-[10px] uppercase font-black px-2 py-0.5">
                            {(order.status as string) === 'Outsourced' ? 'Processing' : order.status}
                        </Badge>
                        </TableCell>
                        <TableCell>
                        <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-tighter">{getSourceText(order)}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-black tabular-nums text-slate-900">{formatPrice(order.total)}</TableCell>
                        <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                     <Link href={`/admin/orders/${order.id}`}>View Order</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {(user?.role === 'admin' || user?.role === 'staff') && (
                                    <>
                                        <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>Assign To</DropdownMenuSubTrigger>
                                        <DropdownMenuSubContent>
                                            {allStaff.filter(staff => staff.isActive !== false && staff.status !== 'Inactive' && staff.status !== 'Archived' && staff.status !== 'Deactivated' && !(staff as any).disabled).map(staff => (
                                            <DropdownMenuItem 
                                                key={staff.id} 
                                                onClick={() => handleAssignment(order.id, staff.id)}
                                                disabled={order.assignedTo?.[0] === staff.id}
                                            >
                                                {staff.name}
                                            </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuSubContent>
                                        </DropdownMenuSub>
                                        <DropdownMenuSeparator />
                                    </>
                                )}
                                <DropdownMenuItem
                                    onClick={() => handleUpdateStatus(order.id, 'Pending Payment')}
                                    disabled={order.status === 'Pending Payment'}
                                >
                                    Mark as Pending Payment
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleUpdateStatus(order.id, 'Processing')}
                                    disabled={order.status === 'Processing'}
                                >
                                    Mark as Processing
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleUpdateStatus(order.id, 'Completed')}
                                    disabled={order.status === 'Completed'}
                                >
                                    Mark as Completed
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleUpdateStatus(order.id, 'Cancelled')}
                                    className="text-destructive"
                                    disabled={order.status === 'Cancelled'}
                                >
                                    Cancel Order
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    )})}
                </TableBody>
                </Table>
            )}
            </CardContent>
            <CardFooter className="bg-muted/30 border-t py-3 justify-between items-center">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                    Showing {filteredOrders.length} of {orders.length} orders
                </p>
                {(searchTerm || statusFilter !== 'all') && (
                    <Button variant="link" size="sm" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }} className="h-auto p-0 text-[10px] font-black uppercase">
                        Clear all filters
                    </Button>
                )}
            </CardFooter>
        </Card>
    </div>
  );
}
