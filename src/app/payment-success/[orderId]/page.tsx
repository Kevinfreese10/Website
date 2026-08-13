'use client';
import { useEffect, useState, useMemo } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Order, Service, User, OrderNote } from '@/lib/types';
import { Loader2, CheckCircle, Banknote } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { format, addDays } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { services as allServices } from '@/lib/data';
import { sendDocumentRequestEmailAction } from '@/app/actions';
import Script from 'next/script';
import { useToast } from '@/hooks/use-toast';

const db = getFirestore(firebaseApp);

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(price);
};

export default function PaymentSuccessPage() {
    const params = useParams();
    const orderId = params.orderId as string;
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [assignee, setAssignee] = useState<User | null>(null);
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const orderUrl = useMemo(() => {
        if (!currentUser) return '/login';
        if (currentUser.role === 'admin' || currentUser.role === 'staff') return `/admin/orders/${orderId}`;
        if (currentUser.role === 'partner' || currentUser.role === 'partner_staff') return `/partner/orders/${orderId}`;
        return `/dashboard/orders/${orderId}`;
    }, [currentUser, orderId]);

    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        if (!order || !currentUser) return;
        if (currentUser.role === 'partner' || currentUser.role === 'partner_staff') {
            router.push('/partner/orders');
            return;
        }

        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    router.push(orderUrl);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [order, currentUser, router, orderUrl]);

    useEffect(() => {
        if (orderId) {
            const fetchOrderDetails = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const orderRef = doc(db, 'orders', orderId);
                    const orderSnap = await getDoc(orderRef);

                    if (orderSnap.exists()) {
                        const orderData = { ...orderSnap.data(), id: orderSnap.id } as Order;
                        
                        // Trigger Google Customer Reviews Opt-in
                        const deliveryDate = format(addDays(new Date(), 10), 'yyyy-MM-dd');
                        const reviewProducts = orderData.items
                            .map((item: any) => item.gtin ? { gtin: item.gtin } : null)
                            .filter(Boolean);

                        if (typeof window !== 'undefined' && (window as any).renderOptIn) {
                            (window as any).renderOptIn({
                                id: orderData.id,
                                customerEmail: orderData.customerEmail,
                                estimated_delivery_date: deliveryDate,
                                delivery_country: "ZA",
                                products: reviewProducts.length > 0 ? reviewProducts : undefined
                            });
                        }

                        // Fetch reseller details if it's a white-label order
                        let resellerData: User | undefined;
                        if (orderData.resellerId) {
                            const resellerSnap = await getDoc(doc(db, 'users', orderData.resellerId));
                            if (resellerSnap.exists()) {
                                resellerData = { ...resellerSnap.data(), id: resellerSnap.id } as User;
                            }
                        }

                        // CHECK IF NOTIFICATION HAS BEEN SENT
                        const alreadyNotified = orderData.notes?.some(n => n.subject === `Action Required for Your Order #${orderId}`);

                        if (!alreadyNotified) {
                            const recipientEmail = orderData.resellerId && orderData.documentContact === 'client' 
                                ? orderData.endCustomerEmail 
                                : orderData.customerEmail;

                            if (recipientEmail) {
                                try {
                                    await sendDocumentRequestEmailAction({
                                        orderId,
                                        recipientEmail,
                                    });
                                } catch(e) {
                                     console.error("Failed to send document request email:", e);
                                     toast({ title: 'Email Failed', description: 'Could not notify client. Please check your SMTP settings.', variant: 'destructive'});
                                }
                            }
                        }
                        
                        setOrder(orderData);

                        if (orderData.assignedTo && orderData.assignedTo.length > 0) {
                             const staffQuery = query(collection(db, "users"), where('uid', '==', orderData.assignedTo[0]));
                             const staffSnapshot = await getDocs(staffQuery);
                             if (!staffSnapshot.empty) {
                                 setAssignee(staffSnapshot.docs[0].data() as User);
                             }
                        }
                    } else {
                        notFound();
                    }
                } catch (err: any) {
                    console.error("Error fetching order details:", err);
                    if (err.code === 'permission-denied') {
                        setError('permission-denied');
                    } else {
                        setError('error');
                    }
                } finally {
                    setIsLoading(false);
                }
            };

            fetchOrderDetails();
        }
    }, [orderId, toast]);

    // orderUrl moved to top
    
    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <h1 className="mt-4 text-2xl font-semibold">Finalizing your order...</h1>
                <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
            </div>
        );
    }

    if (error === 'permission-denied') {
        return (
            <div className="container mx-auto px-4 py-20 text-center max-w-md">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Authentication Required</CardTitle>
                        <CardDescription>
                            You must be logged in to view the details of this order.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button asChild className="w-full">
                            <Link href={`/login?redirect=/payment-success/${orderId}`}>
                                Log In to Your Account
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/">Go to Home</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-20 text-center max-w-md">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl text-destructive">Error Loading Order</CardTitle>
                        <CardDescription>
                            There was a problem loading your order details. Please try again.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => window.location.reload()} className="w-full">
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (!order) {
        return notFound();
    }

    const orderedServices = order.items.map(item => {
        return allServices.find(s => s.id === item.id);
    }).filter((s): s is Service => s !== undefined);


    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <Script id="google-ads-conversion" strategy="afterInteractive">
                {`
                  gtag('event', 'conversion', {
                      'send_to': 'AW-18282670193/v02BCKW9vsccEPHQ7Y1E',
                      'value': ${order.total || 1.0},
                      'currency': 'ZAR',
                      'transaction_id': '${order.id}'
                  });
                `}
            </Script>
            <Card>
                <CardHeader className="text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                    <CardTitle className="text-3xl mt-4">
                        {order.paymentMethod === 'EFT' ? 'Order Placed Successfully!' : 'Payment Successful!'}
                    </CardTitle>
                    <CardDescription>
                       {order.paymentMethod === 'EFT' 
                        ? "We have received your order. Please complete your payment via EFT to begin processing."
                        : "Your payment was successful! We have received your order and will begin processing it."}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                     <section>
                        <h3 className="font-semibold text-lg mb-2">Order Summary</h3>
                        <div className="border rounded-lg p-4 space-y-2">
                           <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Order ID:</span>
                                <span className="font-mono">{order.id}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Order Date:</span>
                                <span>{order.date?.toDate ? format(order.date.toDate(), 'dd/MM/yyyy') : format(new Date(order.date), 'dd/MM/yyyy')}</span>
                            </div>
                            <Separator />
                            {order.items.map((item, index) => (
                                <div key={index} className="flex justify-between items-center">
                                    <p>{item.title}</p>
                                    <p className="font-semibold">{formatPrice(item.price || item.unitPrice || 0)}</p>
                                </div>
                            ))}
                             <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <p>Total Due</p>
                                <p>{formatPrice(order.clientTotal || order.total)}</p>
                            </div>
                        </div>
                    </section>
                    
                    <section>
                        <h3 className="font-semibold text-lg mb-2">Next Steps: Action Required</h3>
                         <p className="text-sm text-muted-foreground mb-4">
                            To get started, please click the button below to log into your dashboard. You can then securely upload all the required documents so that we can start processing your order immediately.
                        </p>
                        <div className="space-y-4">
                            {orderedServices.map(service => (
                                <div key={service.id}>
                                    <h4 className="font-semibold">{service.title}</h4>
                                    <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-muted-foreground">
                                        {service.clientRequirements.map((req, index) => (
                                            <li key={index}>{req}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>
                    
                    <div className="flex flex-col items-center gap-3 pt-4">
                        <Button asChild size="lg">
                            <Link href={orderUrl}>
                                Go to Document Upload Portal
                            </Link>
                        </Button>
                        <p className="text-sm text-muted-foreground animate-pulse">
                            Redirecting to your document upload portal in {countdown} seconds...
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
