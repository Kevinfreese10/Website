'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { getFirestore, collection, getDocs, orderBy, query, where, doc, updateDoc, arrayUnion, getDoc, Timestamp, addDoc, writeBatch, onSnapshot, limit } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';
import { Order, User, Service, OrderNote, Task, ItnLog } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { services as allServices } from '@/lib/data';
import { cn, isStaffActive, isEligibleOrderStaff } from '@/lib/utils';
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
import { MoreHorizontal, Loader2, PlusCircle, MessageSquare, Server, Search, Filter, RefreshCw, Link as LinkIcon, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { TableSkeleton } from '@/components/ui/skeletons';
import { EmptyState } from '@/components/ui/empty-state';
import { OrdersTable } from '@/components/admin/orders/OrdersTable';
import { OrderQuickView } from '@/components/admin/orders/OrderQuickView';
import { AwaitingClientResponseCard } from '@/components/admin/orders/AwaitingClientResponseCard';
import { getOrdersAwaitingClientResponse } from '@/lib/order-communication';
import { FilterChips } from '@/components/data-table/filter-chips';
import { SavedViewsMenu } from '@/components/data-table/saved-views-menu';
import { FeatureTip } from '@/components/onboarding/FeatureTip';
import { useSavedViews, type SavedView } from '@/components/data-table/use-saved-views';
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
import { getStatusVariant } from '@/lib/order-status';

const db = getFirestore(firebaseApp);

/**
 * Statuses treated as "still being worked". Includes the legacy values that exist in production
 * data ('Outsourced', 'Waiting on Client') so historical orders don't silently vanish from the
 * default view. Firestore `in` supports up to 30 values.
 */
const ACTIVE_ORDER_STATUSES = [
  'Pending Payment',
  'Processing',
  'Outsourced',
  'Under Review',
  'Waiting on Customer',
  'Waiting for Information',
  'Waiting on Client',
  'Waiting on External',
];

/** How many historical orders to load when the user explicitly asks for them. */
const HISTORY_PAGE_SIZE = 250;

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

  const eligibleStaff = useMemo(() => {
    return allStaff.filter(isEligibleOrderStaff);
  }, [allStaff]);

  const getNextStaffMember = (department: 'Accounting and Tax' | 'Administration' | 'CAP'): User | undefined => {
      const activeStaff = eligibleStaff;
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
    const isStaff = ['admin', 'staff', 'consultant', 'senior_accountant', 'accountant', 'support_agent', 'ai_accountant', 'cap_staff', 'cap_supervisor'].includes(user.role);
    if (!isStaff) return;
    setIsLoading(true);

    const staffQuery = query(collection(db, "users"), where('role', 'in', ['staff', 'admin', 'consultant', 'senior_accountant', 'accountant', 'support_agent']));
    getDocs(staffQuery).then(staffSnapshot => {
        const fetchedStaff = staffSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
        fetchedStaff.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        setAllStaff(fetchedStaff);
    }).catch(error => {
        console.error("Error fetching staff:", error);
    });

    /*
     * Bounded live listener.
     *
     * This previously opened an UNBOUNDED onSnapshot over the whole orders collection, ordered by
     * date, with no limit — every order ever placed, in full, streamed live to every admin
     * browser, on every visit, and then filtered in memory. It was the dominant Firestore cost
     * line and grew linearly with lifetime order count.
     *
     * The default view is now scoped server-side to orders that are still being worked. Selecting
     * "All Statuses", "Completed" or "Cancelled" issues a separate, explicitly-requested query —
     * so history is still reachable, it just isn't loaded on every page view.
     */
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
                try {
                    const originalOrderRef = doc(db, 'orders', order.originalOrderId);
                    const originalOrderSnap = await getDoc(originalOrderRef);
                    if (originalOrderSnap.exists()) {
                        const originalOrderData = originalOrderSnap.data();
                        order.endCustomerName = originalOrderData.customerName;
                        order.endCustomerEmail = originalOrderData.customerEmail;
                    }
                } catch (origErr) {
                    console.warn("Could not load original order details:", origErr);
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

  const awaitingOrders = useMemo(() => {
    return getOrdersAwaitingClientResponse(orders, allStaff);
  }, [orders, allStaff]);

  const handleOrderNoteUpdated = (orderId: string, updatedNote: OrderNote) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, notes: [...(o.notes || []), updatedNote] } : o));
  };

  const statusCounts = useMemo(() => {
    return {
      all: orders.length,
      active: orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length,
      awaitingReply: awaitingOrders.length,
      processing: orders.filter(o => o.status === 'Processing' || (o.status as any) === 'Outsourced').length,
      pending: orders.filter(o => o.status === 'Pending Payment').length,
      waiting: orders.filter(o => o.status === 'Waiting on Customer' || o.status === 'Waiting for Information' || (o.status as any) === 'Waiting on Client').length,
      external: orders.filter(o => o.status === 'Waiting on External' || (o.status as any) === 'Waiting on External Party').length,
      review: orders.filter(o => o.status === 'Under Review').length,
      completed: orders.filter(o => o.status === 'Completed').length,
      cancelled: orders.filter(o => o.status === 'Cancelled').length,
    };
  }, [orders, awaitingOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
        // Status filter: 'awaiting_reply' or 'active' or specific tabs match canonical groups
        if (statusFilter === 'awaiting_reply') {
            const awaitingIds = new Set(awaitingOrders.map(a => a.order.id));
            if (!awaitingIds.has(order.id)) return false;
        } else if (statusFilter === 'active') {
            if (order.status === 'Completed' || order.status === 'Cancelled') return false;
        } else if (statusFilter === 'Processing') {
            if (order.status !== 'Processing' && (order.status as any) !== 'Outsourced') return false;
        } else if (statusFilter === 'Waiting on Customer') {
            if (order.status !== 'Waiting on Customer' && order.status !== 'Waiting for Information' && (order.status as any) !== 'Waiting on Client') return false;
        } else if (statusFilter === 'Waiting on External') {
            if (order.status !== 'Waiting on External' && (order.status as any) !== 'Waiting on External Party') return false;
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
            const term = searchTerm.toLowerCase().trim();
            const matchesId = order.id.toLowerCase().includes(term);
            const matchesOriginalId = Boolean(order.originalOrderId?.toLowerCase().includes(term));
            
            const matchesName = Boolean(
              order.customerName?.toLowerCase().includes(term) || 
              order.endCustomerName?.toLowerCase().includes(term) ||
              (order as any).companyName?.toLowerCase().includes(term) ||
              (order as any).entityName?.toLowerCase().includes(term)
            );
            
            const matchesEmail = Boolean(
              order.customerEmail?.toLowerCase().includes(term) || 
              order.endCustomerEmail?.toLowerCase().includes(term) ||
              (order as any).userEmail?.toLowerCase().includes(term) ||
              (order as any).email?.toLowerCase().includes(term) ||
              (order as any).clientEmail?.toLowerCase().includes(term) ||
              (order as any).billingEmail?.toLowerCase().includes(term) ||
              (order as any).contactEmail?.toLowerCase().includes(term) ||
              (order as any).resellerEmail?.toLowerCase().includes(term) ||
              (order as any).customerDetails?.email?.toLowerCase().includes(term) ||
              (order as any).clientDetails?.email?.toLowerCase().includes(term) ||
              (order as any).formValues?.email?.toLowerCase().includes(term) ||
              (order as any).formValues?.customerEmail?.toLowerCase().includes(term) ||
              (order as any).formData?.email?.toLowerCase().includes(term)
            );
            
            const matchesPhone = Boolean(
              order.customerPhone?.toLowerCase().includes(term) ||
              (order as any).phone?.toLowerCase().includes(term) ||
              (order as any).cellNumber?.toLowerCase().includes(term)
            );

            const matchesServices = Boolean(
              order.serviceSnapshots?.some(s => s.title?.toLowerCase().includes(term)) ||
              order.items?.some(i => i.title?.toLowerCase().includes(term))
            );

            const matchesNotes = Boolean(
              order.notes?.some(n => 
                n.text?.toLowerCase().includes(term) || 
                n.subject?.toLowerCase().includes(term)
              )
            );
            
            if (!matchesId && !matchesOriginalId && !matchesName && !matchesEmail && !matchesPhone && !matchesServices && !matchesNotes) {
              return false;
            }
        }

        return true;
    });
  }, [orders, searchTerm, statusFilter, assignedFilter, user, awaitingOrders]);

  // ── Saved views + filter chips (Premium UI Phase 3) ──
  type OrdersViewState = { searchTerm: string; statusFilter: string; assignedFilter: string };
  const savedViews = useSavedViews<OrdersViewState>('admin-orders', user?.id);
  const [activeViewName, setActiveViewName] = useState<string | null>(null);
  const [quickViewOrder, setQuickViewOrder] = useState<Order | null>(null);

  // Deep-link support: /admin/orders?status=Completed (used by dashboard KPIs)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    if (status) {
      handleStatusFilterChange(status);
      window.history.replaceState(null, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applySavedView = (view: SavedView<OrdersViewState>) => {
    setSearchTerm(view.state.searchTerm ?? '');
    handleStatusFilterChange(view.state.statusFilter ?? 'active');
    handleAssignedFilterChange(view.state.assignedFilter ?? 'all');
    setActiveViewName(view.name);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    handleStatusFilterChange('active');
    handleAssignedFilterChange('all');
    setActiveViewName(null);
  };

  const filterChips = useMemo(() => {
    const chips: { id: string; label: string; onRemove: () => void }[] = [];
    if (searchTerm) {
      chips.push({ id: 'search', label: `Search: "${searchTerm}"`, onRemove: () => setSearchTerm('') });
    }
    if (statusFilter !== 'active') {
      chips.push({
        id: 'status',
        label: statusFilter === 'all' ? 'Status: All (incl. history)' : `Status: ${statusFilter}`,
        onRemove: () => handleStatusFilterChange('active'),
      });
    }
    if (assignedFilter !== 'all') {
      const label =
        assignedFilter === 'mine' ? 'Assigned: Me'
        : assignedFilter === 'unassigned' ? 'Assigned: Unassigned'
        : `Assigned: ${allStaff.find(st => st.id === assignedFilter)?.name ?? assignedFilter}`;
      chips.push({ id: 'assigned', label, onRemove: () => handleAssignedFilterChange('all') });
    }
    return chips;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, assignedFilter, allStaff]);

   const handleAssignment = async (orderId: string, staffId: string) => {
    try {
        const selectedStaff = allStaff.find(s => s.id === staffId);
        const performerToken = await getAuth(firebaseApp).currentUser?.getIdToken();
        const res = await reassignOrderStaffAtomic(orderId, [staffId], selectedStaff?.department as any || null, performerToken || {
            id: user?.id || user?.uid || '',
            name: user?.name || user?.email || 'Admin'
        });

        if (res.success) {
            // Find and update any associated tasks
            try {
                const tasksQuery = query(collection(db, 'tasks'), where('orderId', '==', orderId));
                const tasksSnapshot = await getDocs(tasksQuery);
                if (!tasksSnapshot.empty) {
                    const batch = writeBatch(db);
                    tasksSnapshot.docs.forEach(taskDoc => {
                        batch.update(taskDoc.ref, { assignedTo: [staffId] });
                    });
                    await batch.commit();
                }
            } catch (taskErr) {
                console.warn("Could not sync associated tasks:", taskErr);
            }

            // Notify the assigned staff member via Server Action
            if (selectedStaff?.email) {
                await notifyStaffOfAssignment(orderId, staffId);
            }

            toast({
                title: 'Order Reassigned',
                description: `Assigned to ${selectedStaff?.name || 'Staff member'}.`,
            });
        } else {
            toast({
                title: 'Assignment Failed',
                description: res.error || 'There was a problem reassigning the order.',
                variant: 'destructive',
            });
        }
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

    // Order mutations require a verified ID token — a caller-supplied {id, name} is no longer accepted.
    const performer = await getAuth(firebaseApp).currentUser?.getIdToken();
    if (!performer) {
        toast({
            title: 'Session expired',
            description: 'Please sign in again to update this order.',
            variant: 'destructive',
        });
        return;
    }

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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={handleReconcile} disabled={isReconciling} className="w-full sm:w-auto justify-center">
                {isReconciling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                {isReconciling ? 'Reconciling...' : 'Reconcile Payments'}
              </Button>
              <Button asChild className="w-full sm:w-auto justify-center">
                <Link href="/admin/orders/new">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Custom Order
                </Link>
              </Button>
            </div>
        </div>

        {/* Priority Alert Card: Orders where Client Responded via Communication History */}
        <AwaitingClientResponseCard 
          awaitingOrders={awaitingOrders}
          currentUser={user}
          onOrderUpdated={handleOrderNoteUpdated}
          onFilterTableToAwaiting={() => handleStatusFilterChange('awaiting_reply')}
        />

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
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search by email, customer, order #..." 
                                className="pl-9 pr-8 h-10 border-primary/10" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button 
                                    type="button" 
                                    onClick={() => setSearchTerm('')} 
                                    className="absolute right-2.5 top-3 text-muted-foreground hover:text-foreground"
                                    aria-label="Clear search"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
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
                                    {eligibleStaff.length > 0 && <SelectSeparator />}
                                    {eligibleStaff.map(staff => (
                                        <SelectItem key={staff.id} value={staff.id}>
                                            {staff.name || staff.email} {staff.department ? `(${staff.department})` : ''}
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
                                    <SelectItem value="awaiting_reply">Client Responded (Awaiting Reply)</SelectItem>
                                    <SelectItem value="Processing">Processing</SelectItem>
                                    <SelectItem value="Waiting on Customer">Waiting on Customer</SelectItem>
                                    <SelectItem value="Waiting on External">Waiting on External</SelectItem>
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
                    {statusCounts.awaitingReply > 0 && (
                        <Button
                            type="button"
                            variant={statusFilter === 'awaiting_reply' ? 'default' : 'outline'}
                            size="sm"
                            className={cn(
                                "h-8 text-xs font-semibold rounded-full gap-1.5 border-amber-400/80 transition-all",
                                statusFilter === 'awaiting_reply' 
                                  ? "bg-amber-600 hover:bg-amber-700 text-white" 
                                  : "text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100"
                            )}
                            onClick={() => handleStatusFilterChange('awaiting_reply')}
                        >
                            <MessageSquare className="h-3 w-3 text-amber-500" />
                            Client Responded
                            <span className={cn("px-1.5 py-0.2 rounded-full text-[10px] font-black", statusFilter === 'awaiting_reply' ? "bg-white/20 text-white" : "bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100")}>
                                {statusCounts.awaitingReply}
                            </span>
                        </Button>
                    )}
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
                        variant={statusFilter === 'Waiting on External' ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 text-xs font-semibold rounded-full gap-1.5"
                        onClick={() => handleStatusFilterChange('Waiting on External')}
                    >
                        Waiting on External
                        <span className={cn("px-1.5 py-0.2 rounded-full text-[10px]", statusFilter === 'Waiting on External' ? "bg-primary-foreground/20 text-primary-foreground" : "bg-cyan-100 text-cyan-800")}>
                            {statusCounts.external}
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
            <OrdersTable
                orders={filteredOrders}
                allOrders={orders}
                staff={allStaff}
                eligibleStaff={eligibleStaff}
                canAssign={user?.role === 'admin' || user?.role === 'staff'}
                isLoading={isLoading}
                onAssign={handleAssignment}
                onUpdateStatus={handleUpdateStatus}
                onRowView={setQuickViewOrder}
                toolbarRight={
                    <SavedViewsMenu
                        views={savedViews.views}
                        activeView={activeViewName}
                        currentState={{ searchTerm, statusFilter, assignedFilter }}
                        onApply={applySavedView}
                        onSave={savedViews.saveView}
                        onDelete={savedViews.deleteView}
                    />
                }
                subheader={
                    <div className="space-y-2">
                        <FilterChips chips={filterChips} onClearAll={clearAllFilters} />
                        <FeatureTip id="saved-views" title="Save the filters you use every day">
                            Set up a search and filters, then hit the bookmark icon to save them as a view —
                            &quot;My overdue&quot;, &quot;Waiting for client&quot;, whatever fits how you work. Select rows to
                            assign or change status in bulk.
                        </FeatureTip>
                    </div>
                }
                empty={
                    <EmptyState
                        icon={Search}
                        title="No orders match your filters"
                        description="Try a different search term or clear the active filters to see all orders."
                        action={<Button variant="outline" onClick={clearAllFilters}>Clear Filters</Button>}
                    />
                }
            />
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
            <OrderQuickView
                order={quickViewOrder ? orders.find(o => o.id === quickViewOrder.id) ?? quickViewOrder : null}
                staff={allStaff}
                onOpenChange={(open) => { if (!open) setQuickViewOrder(null); }}
                onUpdateStatus={handleUpdateStatus}
                canEdit={user?.role === 'admin' || user?.role === 'staff'}
            />
        </Card>
    </div>
  );
}
