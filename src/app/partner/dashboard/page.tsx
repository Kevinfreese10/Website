'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePartner } from '@/contexts/PartnerContext';
import { FormattedNoteText } from '@/components/orders/FormattedNoteText';
import {
  Loader2,
  ArrowRight,
  Briefcase,
  Users,
  BadgeDollarSign,
  MessageSquare,
  Inbox,
  Archive,
  Bot,
  Sparkles,
  Settings,
  Calculator,
  ClipboardCheck,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Order, User, OrderNote } from '@/lib/types';
import {
  getFirestore,
  doc,
  collection,
  query,
  where,
  updateDoc,
  onSnapshot,
  arrayUnion,
  or,
} from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import {
  FirestorePermissionError,
  type SecurityRuleContext,
} from '@/firebase/errors';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const db = getFirestore(firebaseApp);

const userColors = [
  'bg-red-200 text-red-800',
  'bg-blue-200 text-blue-800',
  'bg-green-200 text-green-800',
  'bg-yellow-200 text-yellow-800',
  'bg-purple-200 text-purple-800',
  'bg-pink-200 text-pink-800',
];

const getUserColor = (userId: string) => {
  if (!userId) return 'bg-gray-200 text-gray-800';
  const hash = userId
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return userColors[hash % userColors.length];
};

export default function PartnerDashboardPage() {
  const { user, updateUser } = useAuth();
  const { tier, tierPlan, discountPercent, limits, usage } = usePartner();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [allStaff, setAllStaff] = useState<User[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  const partnerId = user?.role === 'partner' ? user.uid : user?.partnerId;
  const archivedNotifications = user?.archivedNotifications || [];

  const archiveNotification = async (noteId: string) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      archivedNotifications: arrayUnion(noteId),
    }).catch(async () => {
      const permissionError = new FirestorePermissionError({
        path: userRef.path,
        operation: 'update',
        requestResourceData: { archivedNotifications: arrayUnion(noteId) },
      } satisfies SecurityRuleContext);
      errorEmitter.emit('permission-error', permissionError);
    });
    updateUser({
      ...user,
      archivedNotifications: [...(user.archivedNotifications || []), noteId],
    });
  };

  useEffect(() => {
    if (!user?.uid || !partnerId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    let staffUnsubscribe = () => {};
    if (user?.role === 'admin') {
      const staffRef = collection(db, 'users');
      staffUnsubscribe = onSnapshot(
        query(
          staffRef,
          where('role', 'in', [
            'staff',
            'admin',
            'partner',
            'partner_staff',
            'ai_accountant',
          ])
        ),
        (snapshot) => {
          setAllStaff(
            snapshot.docs.map(
              (d) => ({ ...d.data(), id: d.id, uid: d.id } as User)
            )
          );
        }
      );
    } else if (partnerId) {
      const staffRef = collection(db, 'users');
      const q = query(staffRef, where('partnerId', '==', partnerId));
      staffUnsubscribe = onSnapshot(q, (snapshot) => {
        setAllStaff(
          snapshot.docs.map(
            (d) => ({ ...d.data(), id: d.id, uid: d.id } as User)
          )
        );
      });
    }

    const ordersRef = collection(db, 'orders');
    const partnerOrdersQuery = user?.email
      ? query(
          ordersRef,
          or(
            where('resellerId', '==', partnerId),
            where('partnerId', '==', partnerId),
            where('userId', '==', partnerId),
            where('customerEmail', '==', user.email)
          )
        )
      : query(ordersRef, where('resellerId', '==', partnerId));

    const unsubOrders = onSnapshot(
      partnerOrdersQuery,
      (snapshot) => {
        const fetchedOrders = snapshot.docs.map((d) => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            date: data.date?.toDate
              ? data.date.toDate()
              : data.date
              ? new Date(data.date)
              : new Date(),
          } as Order;
        });
        fetchedOrders.sort((a, b) => b.date.getTime() - a.date.getTime());
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

    const transRef = collection(
      db,
      'aiAccountantClients',
      partnerId,
      'transactions'
    );
    const transQ = query(transRef, where('status', 'in', ['new', 'ai_review']));
    const unsubTrans = onSnapshot(transQ, (snap) => {
      setPendingCount(snap.size);
    });

    return () => {
      staffUnsubscribe();
      unsubOrders();
      unsubTrans();
    };
  }, [user?.uid, user?.email, partnerId]);

  const notifications = useMemo(() => {
    if (!user) return [];
    const allNotes: (OrderNote & {
      orderId: string;
      orderTitle: string;
      customerName: string;
      link: string;
      authorFallback: string;
    })[] = [];

    orders.forEach((order) => {
      const notes = (order.notes || [])
        .filter((note) => note.authorId !== user.id && note.type === 'note')
        .map((note) => ({
          ...note,
          date: note.date?.toDate
            ? note.date.toDate()
            : note.date
            ? new Date(note.date)
            : new Date(),
          orderId: order.id,
          orderTitle: order.items?.[0]?.title || 'Order',
          customerName: order.endCustomerName || order.customerName,
          link: `/partner/orders/${order.id}`,
          authorFallback: 'My Accountant Back-Office',
        }));
      allNotes.push(...notes);
    });

    return allNotes.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [orders, user]);

  const getAuthor = (authorId: string): User | undefined => {
    return allStaff.find((u) => u.id === authorId);
  };

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingAvatar(true);
    try {
      const { getStorage, ref, uploadBytesResumable, getDownloadURL } =
        await import('firebase/storage');
      const storage = getStorage(firebaseApp);
      const storageRef = ref(
        storage,
        `avatars/${user.uid}/${Date.now()}-${file.name}`
      );
      const uploadTask = uploadBytesResumable(storageRef, file);

      await uploadTask;
      const downloadUrl = await getDownloadURL(storageRef);

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { photoUrl: downloadUrl }).catch(async () => {
        const permissionError = new FirestorePermissionError({
          path: userRef.path,
          operation: 'update',
          requestResourceData: { photoUrl: downloadUrl },
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });

      updateUser({ ...user, photoUrl: downloadUrl });
      toast({
        title: 'Success',
        description: 'Profile picture updated successfully.',
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload profile picture.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const formatLimit = (val: number) => (val >= 999999 ? 'Unlimited' : val);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer h-16 w-16">
            <label
              htmlFor="avatar-upload"
              className="cursor-pointer block h-full w-full"
            >
              <div
                className={cn(
                  'h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden shadow-sm border border-border/50',
                  !user?.photoUrl && getUserColor(user?.uid || '')
                )}
              >
                {user?.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={user.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  user?.name?.charAt(0) || 'U'
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isUploadingAvatar ? (
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                ) : (
                  <Settings className="h-6 w-6 text-white" />
                )}
              </div>
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
              disabled={isUploadingAvatar}
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                Welcome, {user?.contactPerson || user?.name}!
              </h1>
              <Badge variant="default" className="font-bold">
                {tierPlan.name} Tier ({discountPercent}% Off)
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground">
              {user?.companyName || 'Practice Back-Office Portal'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="font-semibold">
            <Link href="/partner/services">Wholesale Catalog</Link>
          </Button>
          <Button asChild className="font-bold">
            <Link href="/partner/orders">
              Practice Orders <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* 4 Practice Back-Office KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. AI Accounting Clients */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Calculator className="h-4 w-4 text-primary" />
                  AI Accounting
                </CardTitle>
                <div className="text-3xl font-black text-slate-900 tracking-tight pt-1">
                  {usage.aiCompanies} / {formatLimit(limits.aiCompanies)}
                </div>
              </div>
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                <Calculator className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[11px] text-muted-foreground font-medium">
              Active AI Accounting client entities
            </p>
          </CardContent>
          <CardFooter className="pt-2 pb-3 border-t flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-600">
              {tierPlan.aiCompanyLabel}
            </span>
            <Button
              size="sm"
              variant="ghost"
              asChild
              className="h-7 text-xs font-bold text-primary px-2"
            >
              <Link href="/partner/ai-accountant/clients">
                Open <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* 2. AI Payroll Clients */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-primary" />
                  AI Payroll
                </CardTitle>
                <div className="text-3xl font-black text-slate-900 tracking-tight pt-1">
                  {usage.aiPayroll} / {formatLimit(limits.aiPayroll)}
                </div>
              </div>
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[11px] text-muted-foreground font-medium">
              Active AI Payroll client entities
            </p>
          </CardContent>
          <CardFooter className="pt-2 pb-3 border-t flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-600">
              {tierPlan.aiPayrollLabel}
            </span>
            <Button
              size="sm"
              variant="ghost"
              asChild
              className="h-7 text-xs font-bold text-primary px-2"
            >
              <Link href="/partner/ai-payroll/clients">
                Open <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* 3. Active Orders */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Practice Orders
                </CardTitle>
                <div className="text-3xl font-black text-slate-900 tracking-tight pt-1">
                  {
                    orders.filter(
                      (o) =>
                        o.status !== 'Completed' && o.status !== 'Cancelled'
                    ).length
                  }
                </div>
              </div>
              <div className="p-2.5 bg-slate-100 rounded-xl text-slate-700 shrink-0">
                <Briefcase className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[11px] text-muted-foreground font-medium">
              {orders.length} total back-office orders
            </p>
          </CardContent>
          <CardFooter className="pt-2 pb-3 border-t flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-600">
              100% Partner Contact
            </span>
            <Button
              size="sm"
              variant="ghost"
              asChild
              className="h-7 text-xs font-bold text-primary px-2"
            >
              <Link href="/partner/orders">
                Manage <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* 4. Wholesale Discount */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <BadgeDollarSign className="h-4 w-4 text-emerald-600" />
                  Wholesale Rate
                </CardTitle>
                <div className="text-3xl font-black text-emerald-600 tracking-tight pt-1">
                  {discountPercent}% OFF
                </div>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
                <BadgeDollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-[11px] text-muted-foreground font-medium">
              {discountPercent}% off retail on 100+ services
            </p>
          </CardContent>
          <CardFooter className="pt-2 pb-3 border-t flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-600">
              {tierPlan.name} Tier
            </span>
            <Button
              size="sm"
              variant="ghost"
              asChild
              className="h-7 text-xs font-bold text-primary px-2"
            >
              <Link href="/partner/services">
                Catalog <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {pendingCount > 0 && partnerId && (
            <Alert className="bg-primary/10 border-primary/20 shadow-sm border-2">
              <Bot className="h-5 w-5 text-primary" />
              <AlertTitle className="font-bold text-slate-950">
                Chat with Khai
              </AlertTitle>
              <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-slate-950 font-bold">
                  Chat with Khai waiting to finalize{' '}
                  <strong>{pendingCount}</strong> allocations.
                </span>
                <Button size="sm" asChild className="font-bold">
                  <Link href={`/dashboard/ai-accountant/${partnerId}/chat`}>
                    Open Chat <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Back-Office Communication History</CardTitle>
              <CardDescription>
                Latest notes, document requests, and status updates from our specialist team on your practice orders.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div
                  role="status"
                  aria-live="polite"
                  aria-busy="true"
                  className="flex justify-center py-8"
                >
                  <Loader2
                    className="h-8 w-8 animate-spin text-primary"
                    aria-hidden="true"
                  />
                  <span className="sr-only">Loading…</span>
                </div>
              ) : notifications.length > 0 ? (
                <ScrollArea className="h-72 pr-4">
                  <div className="space-y-4">
                    {notifications
                      .filter(
                        (n) =>
                          !archivedNotifications.includes(
                            n.orderId + n.date.toISOString()
                          )
                      )
                      .map((note, index) => {
                        const author = getAuthor(note.authorId);
                        const date = note.date;
                        const noteId = note.orderId + date.toISOString();
                        return (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-transparent hover:border-border transition-colors"
                          >
                            <div
                              className={cn(
                                'mt-1 h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm',
                                author
                                  ? getUserColor(author.id)
                                  : 'bg-gray-200'
                              )}
                            >
                              {author?.name.charAt(0) || 'M'}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <p className="text-sm">
                                  <span className="font-semibold">
                                    {author?.name || note.authorFallback}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {' '}
                                    left a note on order{' '}
                                  </span>
                                  <Link
                                    href={note.link}
                                    className="font-semibold text-primary hover:underline"
                                  >
                                    #{note.orderId}
                                  </Link>
                                </p>
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                  {formatDistanceToNow(date, {
                                    addSuffix: true,
                                  })}
                                </p>
                              </div>
                              <FormattedNoteText
                                text={note.text}
                                as="p"
                                className="mt-2 text-sm text-foreground/80 italic leading-relaxed whitespace-pre-wrap"
                                prefix='"'
                                suffix='"'
                              />
                              <div className="flex justify-end mt-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-muted-foreground"
                                  onClick={() => archiveNotification(noteId)}
                                >
                                  <Archive className="mr-2 h-3 w-3" /> Archive
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                  <Inbox className="h-12 w-12 mb-4 opacity-20" />
                  <p className="font-semibold text-sm">All caught up!</p>
                  <p className="text-xs">No new notes on your practice orders.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {tier !== 'enterprise' && (
            <Card className="border-2 border-primary/30 bg-primary/5 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {tier === 'starter'
                    ? 'Unlock 30%–50% Wholesale Discounts'
                    : 'Unlock 50% Discount & Unlimited Clients'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tier === 'starter'
                    ? 'Upgrade to Practice (R950/month) for 30% off all services and up to 10 AI Accounting & 10 Payroll clients, or Enterprise (R4,950/month) for 50% off and Unlimited clients.'
                    : 'Upgrade to Enterprise (R4,950/month) for a 50% wholesale discount across all 100+ services and Unlimited AI Accounting & Payroll clients.'}
                </p>
                <Button asChild size="sm" className="w-full font-bold shadow-sm">
                  <Link href="/partner/settings">View Upgrade Options</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Practice Back-Office</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <Button className="w-full justify-start font-semibold" asChild>
                <Link href="/partner/ai-accountant/clients">
                  <Calculator className="mr-3 h-4 w-4" />
                  AI Accounting Clients
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start font-semibold"
                asChild
              >
                <Link href="/partner/ai-payroll/clients">
                  <Users className="mr-3 h-4 w-4" />
                  AI Payroll Clients
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start font-semibold"
                asChild
              >
                <Link href="/partner/tasks">
                  <ClipboardCheck className="mr-3 h-4 w-4" />
                  Practice Task Manager
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start font-semibold"
                asChild
              >
                <Link href="/partner/services">
                  <Briefcase className="mr-3 h-4 w-4" />
                  Wholesale Catalog ({discountPercent}% Off)
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start font-semibold"
                asChild
              >
                <Link href="/partner/settings">
                  <Settings className="mr-3 h-4 w-4" />
                  Subscription & Team
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card
            className="hover:border-primary/50 transition-colors cursor-pointer"
            onClick={() => router.push('/partner/community')}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Partner Community Q&A
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect with bookkeepers and accountants across South Africa. Ask questions, share insights, and get answers from experts.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
