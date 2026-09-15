'use client';
import { useEffect, useState } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Order, User } from '@/lib/types';
import { Loader2, CheckCircle, Banknote, LogIn, ExternalLink, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { addDays, format } from 'date-fns';

import { getOrderDetailsAction } from '@/app/actions/order-actions';
import { submitPayFastPayment } from '@/lib/payfast-client';

const db = getFirestore(firebaseApp);

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(price);
};

export default function OrderConfirmationPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isAuthenticated } = useAuth();
    const orderId = params.orderId as string;
    const [order, setOrder] = useState<Order | null>(null);
    const [reseller, setReseller] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!orderId) return;
        let isMounted = true;
        const fetchOrder = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const res = await getOrderDetailsAction(orderId);
                if (!isMounted) return;

                if (res.success && res.order) {
                    setOrder(res.order as Order);
                    if (res.reseller) {
                        setReseller(res.reseller as User);
                    }

                    // Trigger Google Customer Reviews Opt-in
                    const deliveryDate = format(addDays(new Date(), 10), 'yyyy-MM-dd');
                    const reviewProducts = (res.order.items || [])
                        .map((item: any) => item.gtin ? { gtin: item.gtin } : null)
                        .filter(Boolean);

                    if (typeof window !== 'undefined' && (window as any).renderOptIn) {
                        (window as any).renderOptIn({
                            id: res.order.id,
                            customerEmail: res.order.customerEmail,
                            estimated_delivery_date: deliveryDate,
                            delivery_country: "ZA",
                            products: reviewProducts.length > 0 ? reviewProducts : undefined
                        });
                    }
                } else {
                    setError('not-found');
                }
            } catch (err: any) {
                console.error("Error fetching order:", err);
                if (isMounted) setError('error');
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchOrder();

        return () => {
            isMounted = false;
        };
    }, [orderId]); 

    const handlePayNow = async (order: Order) => {
        setIsLoading(true);
        const res = await submitPayFastPayment({
            orderId: order.id,
            amount: order.clientTotal || order.total,
            itemName: `Order #${order.id}`,
            itemDescription: (order.items || []).map(i => i.title).join(', ') || 'Service Order',
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            customerPhone: order.customerPhone,
            returnPath: `/payment-success/${order.id}`,
            cancelPath: `/dashboard/orders`,
        });
        if (!res.success) {
            alert(res.error || 'Failed to redirect to PayFast.');
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <h1 className="mt-4 text-2xl font-semibold">Loading Your Order...</h1>
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
                            <Link href={`/login?redirect=/order-confirmation/${orderId}`}>
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
    
    const isSetupOrTopup = order.items.some(i => i.id === 'partner_setup_fee' || i.id === 'partner_credit_topup');
    const showEft = !!order.resellerId && !isSetupOrTopup;

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <Card>
                <CardHeader className="text-center">
                    <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                    <CardTitle className="text-3xl mt-4">Order Placed Successfully!</CardTitle>
                    <CardDescription>
                       {showEft 
                        ? "Please complete your payment via EFT using the details below." 
                        : "Please complete payment for your order using the secure PayFast button below."}
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
                            <Separator />
                            {order.items.map((item: any, index: number) => (
                                <div key={index} className="flex justify-between items-center">
                                    <p>{item.title}</p>
                                    <p className="font-semibold">{formatPrice(item.clientPrice || item.price)}</p>
                                </div>
                            ))}
                            {order.discountAmount && order.discountAmount > 0 ? (
                                <div className="flex justify-between items-center text-emerald-600 font-semibold text-sm">
                                    <p>Discount {order.discountCode ? `(${order.discountCode})` : ''}</p>
                                    <p>-{formatPrice(order.discountAmount)}</p>
                                </div>
                            ) : null}
                             <Separator />
                            <div className="flex justify-between font-bold text-lg">
                                <p>Total Due</p>
                                <p>{formatPrice(order.clientTotal || order.total)}</p>
                            </div>
                        </div>
                    </section>
                    
                    <section className="text-center space-y-6">
                        {showEft ? (
                            <div className="space-y-6">
                                {reseller?.bankingDetails?.bankName ? (
                                    <div className="bg-muted p-6 rounded-lg border text-left space-y-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex items-center gap-2">
                                            <Banknote className="h-5 w-5 text-primary" />
                                            <h4 className="font-bold text-lg">Payment Instructions (EFT)</h4>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                                            <div>
                                                <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest mb-1">Bank Name</p>
                                                <p className="font-semibold">{reseller.bankingDetails.bankName}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest mb-1">Account Holder</p>
                                                <p className="font-semibold">{reseller.bankingDetails.accountHolder}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest mb-1">Account Number</p>
                                                <p className="font-semibold font-mono">{reseller.bankingDetails.accountNumber}</p>
                                            </div>
                                            <div>
                                                <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest mb-1">Branch Code</p>
                                                <p className="font-semibold font-mono">{reseller.bankingDetails.branchCode}</p>
                                            </div>
                                        </div>
                                        <div className="bg-primary/5 p-4 rounded border border-primary/20 flex flex-col items-center justify-center">
                                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">EFT Payment Reference</p>
                                            <p className="text-2xl font-black text-primary font-mono">{order.id}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground italic text-center">
                                            Please email proof of payment to <a href={`mailto:${reseller.email}`} className="text-primary font-bold hover:underline">{reseller.email}</a>
                                        </p>
                                    </div>
                                ) : (
                                    <Alert variant="destructive">
                                        <AlertTitle>Missing Payment Info</AlertTitle>
                                        <AlertDescription>
                                            The partner has not provided banking details. Please contact them at {reseller?.email || 'the practice email'} for payment instructions.
                                        </AlertDescription>
                                    </Alert>
                                )}
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <Button asChild size="lg" className="font-bold gap-2">
                                        <Link href={`/dashboard/orders/${order.id}`}>
                                            Next Step: Upload Documents <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    {reseller?.landingPage?.slug ? (
                                        <Button asChild variant="outline" className="gap-2">
                                            <Link href={`/p/${reseller.landingPage.slug}`}>
                                                Return to Practice Page <ExternalLink className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    ) : (
                                        <Button asChild variant="outline" className="gap-2">
                                            <Link href="/products">
                                                Browse More Services
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3">
                                {isAuthenticated ? (
                                    <Button onClick={() => handlePayNow(order)} className="w-full max-w-sm h-12 text-lg font-bold">
                                        Pay Now with PayFast
                                    </Button>
                                ) : (
                                    <Button onClick={() => handlePayNow(order)} className="w-full max-w-sm h-12 text-lg font-bold">
                                        <LogIn className="mr-2 h-5 w-5" /> Login to Pay
                                    </Button>
                                )}
                                <Button asChild variant="outline" className="w-full max-w-sm h-11 font-semibold gap-2 border-primary/30 text-primary hover:bg-primary/5">
                                    <Link href={`/dashboard/orders/${order.id}`}>
                                        Next Step: Upload Required Documents <ArrowRight className="h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </section>
                </CardContent>
            </Card>
        </div>
    );
}
