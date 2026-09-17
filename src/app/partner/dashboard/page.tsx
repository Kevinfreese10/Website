'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePartner } from '@/contexts/PartnerContext';
import { useBlog } from '@/contexts/BlogContext';
import { FormattedNoteText } from '@/components/orders/FormattedNoteText';
import { 
  Loader2, 
  ArrowRight, 
  Banknote, 
  Building, 
  Clock, 
  MoreHorizontal, 
  PlusCircle, 
  BrainCircuit, 
  Briefcase, 
  Users, 
  CheckCircle, 
  BadgeDollarSign, 
  UserPlus, 
  MessageSquare, 
  Inbox, 
  Archive, 
  Wallet2, 
  TrendingUp, 
  Bot, 
  AlertCircle, 
  Sparkles, 
  Settings, 
  CheckCircle2, 
  Circle, 
  RefreshCw,
  PartyPopper,
  MessageSquareQuote,
  Play,
  RotateCcw
} from 'lucide-react';
import Image from 'next/image';
import { format, formatDistanceToNow } from 'date-fns';
import { Order, Service, User, OrderNote, ImportedTransaction } from '@/lib/types';
import { getFirestore, doc, getDoc, collection, getDocs, orderBy, query, where, updateDoc, setDoc, Timestamp, onSnapshot, arrayUnion, increment, or } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from '@/components/ui/dropdown-menu';
import { services as allServices } from '@/lib/data';
import { Separator } from "@/components/ui/separator";
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { submitPayFastPayment } from '@/lib/payfast-client';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { getNextOrderId } from '@/lib/sequence';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

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

function TopUpDialog({ partner }: { partner: User }) {
    const [amount, setAmount] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const { toast } = useToast();

    const handleTopUp = async () => {
        const numericAmount = parseFloat(amount);
        if (isNaN(numericAmount) || numericAmount < 100) {
            toast({ title: 'Invalid Amount', description: 'Minimum top-up amount is R100.', variant: 'destructive' });
            return;
        }

        setIsProcessing(true);
        try {
            const orderId = await getNextOrderId();
            const topupOrder: Order = {
                id: orderId,
                userId: partner.uid,
                customerName: partner.companyName || partner.name,
                customerEmail: partner.email,
                items: [{
                    id: 'partner_credit_topup',
                    title: 'Practice Credit Top-up',
                    price: numericAmount,
                    quantity: 1,
                }],
                total: numericAmount,
                discountCode: null,
                discountAmount: null,
                status: 'Pending Payment',
                date: Timestamp.now(),
                source: 'Partner',
                resellerId: partner.uid,
            };
            
            const orderRef = doc(db, 'orders', orderId);
            await setDoc(orderRef, topupOrder).catch(async (error) => {
                const permissionError = new FirestorePermissionError({
                    path: orderRef.path,
                    operation: 'create',
                    requestResourceData: topupOrder,
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            });

            const res = await submitPayFastPayment({
                orderId,
                amount: numericAmount,
                itemName: `Practice Credit Top-up`,
                itemDescription: `Practice credit wallet top-up of R${numericAmount.toFixed(2)}`,
                customerName: partner.name,
                customerEmail: partner.email,
                customerPhone: partner.contactNumber || '',
                returnPath: '/partner/dashboard',
                cancelPath: '/partner/dashboard',
            });

            if (!res.success) {
                toast({ title: 'Payment Gateway Error', description: res.error || 'Could not redirect to PayFast.', variant: 'destructive' });
                setIsProcessing(false);
            }

        } catch (e) {
            console.error(e);
            toast({ title: 'Error', description: 'Could not create top-up order.', variant: 'destructive' });
            setIsProcessing(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" className="font-bold shadow-sm h-8 px-3.5">
                    <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                    Top Up Wallet
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Top Up Practice Credits</DialogTitle>
                    <DialogDescription>Enter the amount you would like to add to your wallet.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="amount">Amount (ZAR)</Label>
                        <Input 
                            id="amount" 
                            type="number" 
                            placeholder="e.g. 1000" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <p className="text-[10px] text-muted-foreground">Minimum R100.</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleTopUp} disabled={isProcessing} className="w-full">
                        {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Proceed to Payment
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function PartnerDashboardPage() {
  const { user, updateUser } = useAuth();
  const { isGrowthActive, hasPlatformFee } = usePartner();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [outsourcedOrders, setOutsourcedOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [allStaff, setAllStaff] = useState<User[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [overrideCount, setOverrideCount] = useState(0);
  const [practiceProfile, setPracticeProfile] = useState<User | null>(null);
  
  const partnerId = user?.role === 'partner' ? user.uid : user?.partnerId;
  const archivedNotifications = user?.archivedNotifications || [];

  const archiveNotification = async (noteId: string) => {
        if (!user) return;
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
            archivedNotifications: arrayUnion(noteId)
        }).catch(async (error) => {
            const permissionError = new FirestorePermissionError({
                path: userRef.path,
                operation: 'update',
                requestResourceData: { archivedNotifications: arrayUnion(noteId) },
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        });
        updateUser({ ...user, archivedNotifications: [...(user.archivedNotifications || []), noteId] });
    };
    
    useEffect(() => {
      if (!user?.uid || !partnerId) {
        setIsLoading(false);
        return;
      };
      setIsLoading(true);

      const unsubPractice = onSnapshot(doc(db, 'users', partnerId), (snap) => {
          if (snap.exists()) setPracticeProfile({ ...snap.data(), id: snap.id } as User);
          setIsLoading(false);
      }, async (error) => {
          const permissionError = new FirestorePermissionError({
              path: `users/${partnerId}`,
              operation: 'get',
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
          setIsLoading(false);
      });

      let staffUnsubscribe = () => {};
      if (user?.role === 'admin') {
          const staffRef = collection(db, "users");
          staffUnsubscribe = onSnapshot(query(staffRef, where('role', 'in', ['staff', 'admin', 'partner', 'partner_staff', 'ai_accountant'])), (snapshot) => {
              setAllStaff(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as User)));
          }, (error) => {
              console.error("Error fetching staff:", error);
          });
      } else if (partnerId) {
          const staffRef = collection(db, "users");
          const q = query(staffRef, where('partnerId', '==', partnerId));
          staffUnsubscribe = onSnapshot(q, (snapshot) => {
              setAllStaff(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id, uid: doc.id } as User)));
          }, (error) => {
              console.error("Error fetching practice staff:", error);
          });
      }

      const ordersRef = collection(db, 'orders');
      
      const clientOrdersQuery = user?.email
        ? query(
            ordersRef,
            or(
              where('resellerId', '==', partnerId),
              where('userId', '==', partnerId),
              where('customerEmail', '==', user.email)
            )
          )
        : query(ordersRef, where('resellerId', '==', partnerId));
      const unsubClientOrders = onSnapshot(clientOrdersQuery, (snapshot) => {
          let clientOrders = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              date: data.date?.toDate ? data.date.toDate() : (data.date ? new Date(data.date) : new Date()),
            } as Order;
          });
          // Sort in memory descending by date
          clientOrders.sort((a, b) => b.date.getTime() - a.date.getTime());
          setOrders(clientOrders.filter(order => order.status !== 'Cancelled' && !order.originalOrderId));
      }, async (error) => {
          const permissionError = new FirestorePermissionError({
              path: 'orders',
              operation: 'list',
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
      });

      const outsourcedOrdersQuery = query(ordersRef, where('resellerId', '==', partnerId));
      const unsubOutsourcedOrders = onSnapshot(outsourcedOrdersQuery, (snapshot) => {
          let fetchedOutsourcedOrders = snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                  ...data,
                  id: doc.id,
                  date: data.date?.toDate ? data.date.toDate() : (data.date ? new Date(data.date) : new Date()),
              } as Order;
          });
          // Sort in memory descending by date
          fetchedOutsourcedOrders.sort((a, b) => b.date.getTime() - a.date.getTime());
          setOutsourcedOrders(fetchedOutsourcedOrders.filter(order => order.status !== 'Cancelled' && (order.isOutsourced || order.originalOrderId)));
      }, async (error) => {
          const permissionError = new FirestorePermissionError({
              path: 'orders',
              operation: 'list',
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
      });

      const transRef = collection(db, 'aiAccountantClients', partnerId, 'transactions');
      const transQ = query(transRef, where('status', 'in', ['new', 'ai_review']));
      const unsubTrans = onSnapshot(transQ, (snap) => {
          setPendingCount(snap.size);
      });

      // REAL-TIME LISTENER FOR OVERRIDES (to update progress bar instantly)
      const overridesRef = collection(db, 'users', partnerId, 'serviceOverrides');
      const unsubOverrides = onSnapshot(overridesRef, (snap) => {
          setOverrideCount(snap.size);
      });

      return () => {
          unsubPractice();
          staffUnsubscribe();
          unsubClientOrders();
          unsubOutsourcedOrders();
          unsubTrans();
          unsubOverrides();
      }
    }, [user?.uid, partnerId]);

    const setupChecklist = useMemo(() => {
        const source = practiceProfile || user;
        if (!source) return [];
        
        const watchedBanking = (source as User).bankingDetails;
        const watchedLp = (source as User).landingPage;

        return [
            { label: 'Update Pricing', done: overrideCount > 0, description: 'Set your markups in the Services tab.' },
            { label: 'Update Banking Details', done: !!(watchedBanking?.bankName && watchedBanking?.accountNumber), description: 'Required for client EFT payments.' },
            { label: 'Edit Landing Content & Images', done: !!(watchedLp?.heroImageUrl && watchedLp?.aboutUs && watchedLp?.aboutUs.length > 50), description: 'Customize your public practice website.' },
            { 
                label: 'Branding & Theme', 
                done: !!watchedLp?.themePreset && (watchedLp?.themePreset !== 'custom' || (watchedLp?.primaryColor && watchedLp?.primaryColor !== '#214392')), 
                description: 'Apply your custom colors and styling.' 
            },
        ];
    }, [user, practiceProfile, overrideCount]);

    const progressPercentage = useMemo(() => {
        const completed = setupChecklist.filter(i => i.done).length;
        const total = setupChecklist.length;
        if (total === 0) return 0;
        return Math.round((completed / total) * 100);
    }, [setupChecklist]);

    const notifications = useMemo(() => {
        if (!user) return [];
        let allNotes: (OrderNote & { orderId: string, orderTitle: string, customerName: string, link: string, authorFallback: string })[] = [];
        
        outsourcedOrders.forEach(order => {
          const notes = (order.notes || [])
            .filter(note => note.authorId !== user.id && note.type === 'note')
            .map(note => ({
              ...note,
              date: note.date?.toDate ? note.date.toDate() : (note.date ? new Date(note.date) : new Date()),
              orderId: order.id,
              orderTitle: order.items[0]?.title || 'Untitled Order',
              customerName: order.customerName,
              link: `/partner/orders/${order.id}`,
              authorFallback: 'My Accountant Support'
            }));
          allNotes.push(...notes);
        });

        orders.forEach(order => {
          const notes = (order.notes || [])
            .filter(note => note.authorId !== user.id && note.type === 'note')
            .map(note => ({
              ...note,
              date: note.date?.toDate ? note.date.toDate() : (note.date ? new Date(note.date) : new Date()),
              orderId: order.id,
              orderTitle: order.items[0]?.title || 'Untitled Order',
              customerName: order.customerName,
              link: `/partner/orders/${order.id}`,
              authorFallback: order.customerName || 'Client'
            }));
          allNotes.push(...notes);
        });

        return allNotes.sort((a, b) => b.date.getTime() - a.date.getTime());
    }, [outsourcedOrders, orders, user]);

    const getAuthor = (authorId: string): User | undefined => {
        return allStaff.find(u => u.id === authorId);
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-ZA', {
        style: 'currency',
        currency: 'ZAR',
        minimumFractionDigits: price % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
        }).format(price);
    };

    const walletBalance = practiceProfile?.creditBalance || 0;

    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    
    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        
        setIsUploadingAvatar(true);
        try {
            const { getStorage, ref, uploadBytesResumable, getDownloadURL } = await import('firebase/storage');
            const storage = getStorage(firebaseApp);
            const storageRef = ref(storage, `avatars/${user.uid}/${Date.now()}-${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            
            await uploadTask;
            const downloadUrl = await getDownloadURL(storageRef);
            
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, { photoUrl: downloadUrl }).catch(async (error) => {
                const permissionError = new FirestorePermissionError({
                    path: userRef.path,
                    operation: 'update',
                    requestResourceData: { photoUrl: downloadUrl },
                } satisfies SecurityRuleContext);
                errorEmitter.emit('permission-error', permissionError);
            });
            
            updateUser({ ...user, photoUrl: downloadUrl });
            toast({ title: 'Success', description: 'Profile picture updated successfully.' });
        } catch (error) {
            console.error('Error uploading avatar:', error);
            toast({ title: 'Error', description: 'Failed to upload profile picture.', variant: 'destructive' });
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
                <div className="flex items-center gap-4">
                    <div className="relative group cursor-pointer h-16 w-16">
                        <label htmlFor="avatar-upload" className="cursor-pointer block h-full w-full">
                            <div className={cn("h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden shadow-sm border border-border/50", !user?.photoUrl && getUserColor(user?.uid || ''))}>
                                {user?.photoUrl ? (
                                    <img src={user.photoUrl} alt={user.name} className="h-full w-full object-cover" />
                                ) : (
                                    user?.name?.charAt(0) || 'U'
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                {isUploadingAvatar ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Settings className="h-6 w-6 text-white" />}
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
                            <h1 className="text-3xl font-bold tracking-tight text-slate-950">Welcome, {user?.contactPerson || user?.name}!</h1>
                            <Badge variant={isGrowthActive ? "default" : "secondary"} className="font-bold">
                                {isGrowthActive ? "Premium Partner" : "Free Partner"}
                            </Badge>
                        </div>
                        <p className="text-lg text-muted-foreground">{user?.companyName || 'Practice Member'}</p>
                    </div>
                </div>
            </div>

            {/* Wallet & Stats Overview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Wallet Balance & Top Up Card */}
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-blue-50/20 to-white shadow-md relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <Wallet2 className="h-4 w-4 text-primary" />
                                    Partner Wallet Balance
                                </CardTitle>
                                <div className="text-3xl font-black text-slate-900 tracking-tight pt-1">
                                    R{(user?.creditBalance ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                            <div className="p-2.5 bg-primary/10 rounded-xl text-primary shrink-0">
                                <Wallet2 className="h-5 w-5" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <p className="text-[11px] text-muted-foreground font-medium">
                            Used for outsourcing orders & platform royalties
                        </p>
                    </CardContent>
                    <CardFooter className="pt-2 pb-4 bg-primary/5 border-t border-primary/10 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-600">Instant PayFast Credit</span>
                        {user && <TopUpDialog partner={user} />}
                    </CardFooter>
                </Card>

                {/* 2. Active Orders Summary Card */}
                <Card className="border border-slate-200 shadow-sm relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <Briefcase className="h-4 w-4 text-primary" />
                                    Practice Orders
                                </CardTitle>
                                <div className="text-3xl font-black text-slate-900 tracking-tight pt-1">
                                    {orders.filter(o => o.status !== 'Completed' && o.status !== 'Cancelled').length}
                                </div>
                            </div>
                            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-700 shrink-0">
                                <Briefcase className="h-5 w-5" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <p className="text-[11px] text-muted-foreground font-medium">
                            {orders.length} total orders across your practice
                        </p>
                    </CardContent>
                    <CardFooter className="pt-2 pb-4 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-600">Active Workflows</span>
                        <Button size="xs" variant="ghost" asChild className="h-7 text-xs font-bold text-primary">
                            <Link href="/partner/orders">Manage Orders <ArrowRight className="ml-1 h-3 w-3" /></Link>
                        </Button>
                    </CardFooter>
                </Card>

                {/* 3. Wholesale Rates Card */}
                <Card className="border border-slate-200 shadow-sm relative overflow-hidden">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                                    <BadgeDollarSign className="h-4 w-4 text-emerald-600" />
                                    Wholesale Discount
                                </CardTitle>
                                <div className="text-3xl font-black text-emerald-600 tracking-tight pt-1">
                                    20% OFF
                                </div>
                            </div>
                            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 shrink-0">
                                <BadgeDollarSign className="h-5 w-5" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <p className="text-[11px] text-muted-foreground font-medium">
                            20% off retail pricing on 70+ services
                        </p>
                    </CardContent>
                    <CardFooter className="pt-2 pb-4 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-600">Wholesale Catalog</span>
                        <Button size="xs" variant="ghost" asChild className="h-7 text-xs font-bold text-primary">
                            <Link href="/partner/services">View Rates <ArrowRight className="ml-1 h-3 w-3" /></Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                    {isGrowthActive && (
                        <Card className="border-2 border-primary/20 bg-primary/5 shadow-md overflow-hidden animate-in fade-in slide-in-from-top-4">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                                            <Settings className="h-4 w-4" />
                                        </div>
                                        <CardTitle className="text-lg">Practice Setup Progress</CardTitle>
                                    </div>
                                    <Badge variant={progressPercentage === 100 ? "success" : "secondary"} className="font-bold">
                                        {progressPercentage === 100 && <PartyPopper className="h-3 w-3 mr-1" />}
                                        {progressPercentage}% Complete
                                    </Badge>
                                </div>
                                <Progress value={progressPercentage} className="h-2 mt-4" />
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {setupChecklist.map((item, idx) => (
                                        <div key={idx} className={cn("p-3 rounded-lg border flex flex-col gap-1 transition-all", item.done ? "bg-green-50/50 border-green-200" : "bg-muted/30 border-muted opacity-70")}>
                                            <div className="flex items-center gap-2">
                                                {item.done ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> : <Circle className="h-4 w-4 text-muted-foreground shrink-0" />}
                                                <span className={cn("text-xs font-bold truncate", item.done ? "text-green-800" : "text-slate-600")}>{item.label}</span>
                                            </div>
                                            <p className="text-[9px] text-muted-foreground leading-tight italic ml-6">{item.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter className="bg-primary/10 border-t border-primary/5 py-3 flex justify-between items-center">
                                <p className="text-[10px] text-primary font-bold uppercase tracking-widest italic">Complete your setup to scale faster.</p>
                                <Button size="sm" asChild variant="link" className="text-primary font-black h-auto p-0">
                                    <Link href="/partner/onboarding">Start Onboarding Wizard <ArrowRight className="ml-1 h-3 w-3" /></Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    )}

                    {pendingCount > 0 && partnerId && (
                        <Alert className="bg-primary/10 border-primary/20 shadow-sm animate-in fade-in slide-in-from-top-4 border-2">
                            <Bot className="h-5 w-5 text-primary" />
                            <AlertTitle className="font-bold text-slate-950">Chat with Khai</AlertTitle>
                            <AlertDescription className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <span className="text-slate-950 font-bold">Chat with Khai waiting to finalize <strong>{pendingCount}</strong> allocations.</span>
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
                            <CardTitle>Communication History</CardTitle>
                            <CardDescription>Latest notes and updates on your orders.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? <div role="status" aria-live="polite" aria-busy="true" className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary"aria-hidden="true" /><span className="sr-only">Loading…</span></div> :
                            notifications.length > 0 ? (
                            <ScrollArea className="h-72 pr-4">
                                <div className="space-y-4">
                                {notifications.filter(n => !archivedNotifications.includes(n.orderId + n.date.toISOString())).map((note, index) => {
                                    const author = getAuthor(note.authorId);
                                    const date = note.date;
                                    const noteId = note.orderId + date.toISOString();
                                    return (
                                        <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-transparent hover:border-border transition-colors">
                                            <div className={cn("mt-1 h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm", author ? getUserColor(author.id) : 'bg-gray-200')}>
                                                {author?.name.charAt(0) || 'U'}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-sm">
                                                        <span className="font-semibold">{author?.name || note.authorFallback}</span>
                                                        <span className="text-muted-foreground"> left a note on order </span>
                                                        <Link href={note.link} className="font-semibold text-primary hover:underline">{note.orderId}</Link>
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                                        {formatDistanceToNow(date, { addSuffix: true })}
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
                                                    <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" onClick={() => archiveNotification(noteId)}>
                                                        <Archive className="mr-2 h-3 w-3"/> Archive
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
                                <p className="font-semibold text-sm">All caught up!</p>
                                <p className="text-xs">No new notes on your orders.</p>
                            </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    {!hasPlatformFee && (
                      <Card className="border-2 border-dashed border-primary/45 bg-primary/5 shadow-md animate-in fade-in">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                                Unlock Client-Facing Storefront
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 pb-4">
                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                Get your branded online practice store (`/p/[slug]`), set custom service markups, link custom domains, and automate client document collection.
                            </p>
                            <Button asChild size="sm" className="w-full font-bold shadow-sm">
                                <Link href="/partner/onboarding">Unlock Storefront — R1,950</Link>
                            </Button>
                        </CardContent>
                      </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {isGrowthActive && (
                                <Button className="w-full justify-start font-semibold" asChild><Link href="/partner/onboarding"><Sparkles className="mr-3 h-4 w-4"/>Onboarding Wizard</Link></Button>
                            )}
                            <Button className="w-full justify-start font-semibold" asChild><Link href="/partner/services"><Briefcase className="mr-3 h-4 w-4"/>Services & Pricing</Link></Button>
                            <Button className="w-full justify-start font-semibold" asChild><Link href="/partner/profile"><Users className="mr-3 h-4 w-4"/>Manage Profile</Link></Button>
                        </CardContent>
                    </Card>

                    <Card className="hover:border-primary/50 transition-colors cursor-pointer" onClick={() => router.push('/partner/community')}>
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



                     <Card className="bg-muted/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                Statistics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Active Orders</span>
                                <span className="font-bold">{orders.length}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-muted-foreground">Outsourced Orders</span>
                                <span className="font-bold">{outsourcedOrders.length}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
