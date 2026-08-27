'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getFirestore, doc, setDoc, Timestamp, collection, query, where, getDocs, serverTimestamp, or } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { checkExistingUserByEmail, createCheckoutOrderAction } from '@/app/actions';
import { Order } from '@/lib/types';
import { customAlphabet } from 'nanoid';
import { Separator } from '../ui/separator';

import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { submitPayFastPayment } from '@/lib/payfast-client';

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);

const formSchema = z.object({
  firstName: z.string().min(2, 'First name is required.'),
  lastName: z.string().min(2, 'Surname is required.'),
  email: z.string().email('Please enter a valid email.'),
  phone: z.string().min(10, 'Please enter a valid cell number.'),
  confirmPrerequisites: z.boolean().refine(val => val === true, {
    message: 'You must confirm that you have all required prerequisites.',
  }),
  agreeRefundPolicy: z.boolean().refine(val => val === true, {
    message: 'You must agree to the refund policy to proceed.',
  }),
});

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(price);
};

export default function CheckoutForm({
  appliedPromo = null,
}: {
  appliedPromo?: { code: string; percentage: number; discountAmount: number } | null;
}) {
  const router = useRouter();
  const { user, reauthenticate } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [linkedUser, setLinkedUser] = useState<{name: string, id: string} | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: (user?.role === 'client' ? user?.name?.split(' ')[0] : '') || '',
      lastName: (user?.role === 'client' ? user?.name?.split(' ').slice(1).join(' ') : '') || '',
      email: (user?.role === 'client' ? user?.email : '') || '',
      phone: (user?.role === 'client' ? user?.contactNumber : '') || '',
      confirmPrerequisites: false,
      agreeRefundPolicy: false,
    },
  });

  const watchedEmail = form.watch('email');

  useEffect(() => {
    if (user && user.role === 'client') {
      form.reset({
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.contactNumber || '',
        confirmPrerequisites: form.getValues('confirmPrerequisites'),
        agreeRefundPolicy: form.getValues('agreeRefundPolicy'),
      });
    }
  }, [user, form]);

  // Automatic user lookup when email is entered
  useEffect(() => {
    const lookupUser = async () => {
        const rawEmail = watchedEmail?.trim();
        // Don't lookup if user is already logged in as a client
        if ((user && user.role === 'client') || !rawEmail || !rawEmail.includes('@') || rawEmail.length < 5) {
            setLinkedUser(null);
            return;
        }
        
        setIsCheckingUser(true);
        try {
            const result = await checkExistingUserByEmail(rawEmail);
            
            if (result.exists && result.id && result.name) {
                setLinkedUser({ 
                    name: result.name, 
                    id: result.id 
                });

                // Auto-populate fields
                const nameParts = result.name.split(' ');
                form.setValue('firstName', nameParts[0] || '');
                form.setValue('lastName', nameParts.slice(1).join(' ') || '');
                form.setValue('phone', result.phone || '');
                form.trigger();
            } else {
                setLinkedUser(null);
            }
        } catch (e) {
            console.error("User lookup failed:", e);
        } finally {
            setIsCheckingUser(false);
        }
    };

    const timer = setTimeout(lookupUser, 600);
    return () => clearTimeout(timer);
  }, [watchedEmail, user, form]);
  
  const submitToPayFast = async (order: Order) => {
    toast({
      title: 'Redirecting to PayFast...',
      description: 'Opening secure payment gateway...',
    });
    const res = await submitPayFastPayment({
      orderId: order.id,
      amount: order.total,
      itemName: `Order #${order.id}`,
      itemDescription: (order.items || []).map(i => i.title).join(', '),
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      returnPath: `/payment-success/${order.id}`,
      cancelPath: `/cart`,
    });
    if (!res.success) {
      toast({
        title: 'Payment Error',
        description: res.error || 'Could not redirect to PayFast.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };


  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    toast({
        title: 'Processing Order...',
        description: 'Please wait while we prepare your order.',
    });

    try {
        const finalUserId = (user?.role === 'client' ? user?.uid : null) || linkedUser?.id || null;
        const items = cartItems.map(item => ({
            id: item.service.id,
            title: item.service.title,
            price: item.service.price,
            quantity: item.quantity
        }));

        const promoDiscountAmount = appliedPromo ? Math.round((cartTotal * appliedPromo.percentage) / 100) : 0;
        const finalTotal = Math.max(0, cartTotal - promoDiscountAmount);

        const result = await createCheckoutOrderAction({
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            phone: values.phone,
            items,
            total: finalTotal,
            paymentMethod: 'PayFast',
            userId: finalUserId,
            discountCode: appliedPromo?.code || null,
        });

        if (!result.success) {
            toast({
                title: result.error === 'auth/email-already-in-use' ? 'Account Exists' : 'Order Failed',
                description: result.message || 'There was a problem saving your order.',
                variant: 'destructive',
            });
            setIsLoading(false);
            return;
        }

        // If it was a new user, log them in on the client side using the generated credentials
        if (result.isNewUser && result.generatedPassword) {
            try {
                const { signInWithEmailAndPassword } = await import('firebase/auth');
                await signInWithEmailAndPassword(auth, values.email, result.generatedPassword);
                if (auth.currentUser) {
                    await reauthenticate(auth.currentUser);
                }
            } catch (authError) {
                console.error("Failed to sign in new user client-side:", authError);
            }
        } else if (auth.currentUser) {
            await reauthenticate(auth.currentUser);
        }

        const orderData: Order = {
            id: result.orderId!,
            userId: result.userId,
            customerName: `${values.firstName} ${values.lastName}`,
            customerEmail: values.email,
            customerPhone: values.phone,
            items,
            total: finalTotal,
            discountCode: appliedPromo?.code || null,
            discountAmount: promoDiscountAmount || null,
            status: 'Pending Payment',
            date: Timestamp.now(),
            source: 'Client',
        };

        clearCart();
        submitToPayFast(orderData);

    } catch (error: any) {
        console.error("Error creating order: ", error);
        toast({
            title: 'Order Failed',
            description: error.message || 'There was a problem saving your order.',
            variant: 'destructive',
        });
        setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
         <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Email Address
              </FormLabel>
              <FormControl>
                <div className="relative">
                    <Input placeholder="Start here..." {...field} className="h-12 border-primary/20 focus-visible:ring-primary font-medium" />
                    {isCheckingUser && <Loader2 className="absolute right-3 top-4 h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
              </FormControl>
              {linkedUser && (
                <div className="flex items-center gap-2 text-[10px] text-green-600 font-bold bg-green-50 p-2 rounded border border-green-100 mt-1">
                    <CheckCircle2 className="h-3 w-3" /> Matched: {linkedUser.name}
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl><Input placeholder="John" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Surname</FormLabel>
                <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cell Number</FormLabel>
              <FormControl><Input type="tel" placeholder="082 123 4567" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3 pt-2">
          <FormField
            control={form.control}
            name="confirmPrerequisites"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
                </FormControl>
                <div className="space-y-1 leading-tight">
                  <FormLabel className="text-xs font-semibold text-slate-700 cursor-pointer">
                    I confirm I have all the prerequisites for the services in my order.
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="agreeRefundPolicy"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-slate-200 p-3 bg-slate-50/50">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
                </FormControl>
                <div className="space-y-1 leading-tight">
                  <FormLabel className="text-xs font-semibold text-slate-700 cursor-pointer">
                    I agree to the{' '}
                    <Link href="/refund-policy" target="_blank" className="text-primary underline font-bold">
                      refund policy
                    </Link>.
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <Button type="submit" className="w-full h-12 text-base font-extrabold shadow-md rounded-xl" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Processing Order...' : `Proceed to Payment – ${formatPrice(cartTotal)}`}
        </Button>
      </form>
    </Form>
  );
}
