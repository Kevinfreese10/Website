'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Service, Order, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, User as UserIcon, CheckCircle2, ShieldCheck, Lock, RefreshCw, MessageSquare } from 'lucide-react';
import { getFirestore, doc, setDoc, Timestamp, getDoc, serverTimestamp, collection, query, where, getDocs, or } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { getNextOrderId } from '@/lib/sequence';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { sendOrderConfirmationEmailAction, checkExistingUserByEmail } from '@/app/actions';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { customAlphabet } from 'nanoid';

const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 10);

const checkoutSchema = z.object({
    firstName: z.string().min(2, "First name is required"),
    lastName: z.string().min(2, "Surname is required"),
    email: z.string().email("A valid email is required"),
    phone: z.string().min(10, "A valid cell number is required"),
    hasPrerequisites: z.boolean().refine(v => v === true, { message: "You must confirm prerequisites" }),
    agreedToRefundPolicy: z.boolean().refine(v => v === true, { message: "You must agree to the refund policy" }),
});

const enquirySchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("A valid email is required"),
    phone: z.string().min(10, "A valid cell number is required"),
    message: z.string().min(5, "Please tell us about your requirements"),
});

function PriceOnRequestForm({ service }: { service: Service }) {
  const { toast } = useToast();
  const [isSent, setIsSent] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const enquiryForm = useForm<z.infer<typeof enquirySchema>>({
    resolver: zodResolver(enquirySchema),
    defaultValues: { name: '', email: '', phone: '', message: '' },
  });

  const handleEnquiry = async (values: z.infer<typeof enquirySchema>) => {
    setIsSending(true);
    try {
      // Build a mailto fallback — a server action for email can be wired later
      const subject = encodeURIComponent(`Quote Request: ${service.title}`);
      const body = encodeURIComponent(
        `Name: ${values.name}\nEmail: ${values.email}\nPhone: ${values.phone}\n\nMessage:\n${values.message}`
      );
      // Fire-and-forget: open mailto (will silently fail if no email client)
      window.location.href = `mailto:info@myacc.co.za?subject=${subject}&body=${body}`;
      setIsSent(true);
      toast({ title: 'Enquiry Sent!', description: 'We will respond within 1 business day.' });
    } catch {
      toast({ title: 'Error', description: 'Could not send. Please contact us directly.', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  if (isSent) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center space-y-3 animate-in fade-in">
        <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
        <h3 className="font-extrabold text-green-800 text-base">Enquiry Received!</h3>
        <p className="text-sm text-green-700">We&apos;ll get back to you with a personalised quote within 1 business day.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-slate-50 p-5">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">Request a Quote</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        This service is priced on request. Fill in your details and we&apos;ll send you a personalised quote.
      </p>
      <form onSubmit={enquiryForm.handleSubmit(handleEnquiry)} className="space-y-3">
        <div>
          <label className="text-xs font-bold text-slate-700">Full Name</label>
          <Input {...enquiryForm.register('name')} placeholder="John Doe" className="mt-1 h-9 text-sm" />
          {enquiryForm.formState.errors.name && <p className="text-[10px] text-destructive mt-0.5">{enquiryForm.formState.errors.name.message}</p>}
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700">Email Address</label>
          <Input {...enquiryForm.register('email')} type="email" placeholder="john@example.com" className="mt-1 h-9 text-sm" />
          {enquiryForm.formState.errors.email && <p className="text-[10px] text-destructive mt-0.5">{enquiryForm.formState.errors.email.message}</p>}
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700">Cell Number</label>
          <Input {...enquiryForm.register('phone')} placeholder="082 123 4567" className="mt-1 h-9 text-sm" />
          {enquiryForm.formState.errors.phone && <p className="text-[10px] text-destructive mt-0.5">{enquiryForm.formState.errors.phone.message}</p>}
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700">Tell us about your requirements</label>
          <Textarea {...enquiryForm.register('message')} placeholder="Briefly describe your business and what you need..." rows={3} className="mt-1 text-sm resize-none" />
          {enquiryForm.formState.errors.message && <p className="text-[10px] text-destructive mt-0.5">{enquiryForm.formState.errors.message.message}</p>}
        </div>
        <Button type="submit" disabled={isSending} className="w-full h-11 font-extrabold text-sm partner-btn">
          {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
          {isSending ? 'Sending...' : 'Send Quote Request'}
        </Button>
        <p className="text-center text-[10px] text-muted-foreground">Or call us: <a href="tel:+27123456789" className="font-bold text-primary hover:underline">+27 12 345 6789</a></p>
      </form>
    </div>
  );
}

export default function ServiceCheckoutForm({ service, partnerId }: { service: Service, partnerId?: string }) {
  const router = useRouter();
  const { user, reauthenticate } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [linkedUser, setLinkedUser] = useState<{name: string, id: string} | null>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(false);

  const form = useForm<z.infer<typeof checkoutSchema>>({
      resolver: zodResolver(checkoutSchema),
      defaultValues: {
          firstName: (user?.role === 'client' ? user?.name?.split(' ')[0] : '') || '',
          lastName: (user?.role === 'client' ? user?.name?.split(' ').slice(1).join(' ') : '') || '',
          email: (user?.role === 'client' ? user?.email : '') || '',
          phone: (user?.role === 'client' ? user?.contactNumber : '') || '',
          hasPrerequisites: false,
          agreedToRefundPolicy: false,
      }
  });

  const watchedEmail = form.watch('email');

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

  useEffect(() => {
    if (user && user.role === 'client') {
      form.reset({
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: user.contactNumber || '',
        hasPrerequisites: form.getValues('hasPrerequisites'),
        agreedToRefundPolicy: form.getValues('agreedToRefundPolicy'),
      });
    }
  }, [user, form]);

  const onError = (errors: any) => {
    console.error("Checkout Validation Errors:", errors);
    const firstError = Object.values(errors)[0] as any;
    if (firstError) {
        toast({
            title: "Action Required",
            description: firstError.message || "Please complete all required fields.",
            variant: "destructive"
        });
    }
  };

  async function handleCheckout(values: z.infer<typeof checkoutSchema>) {
    setIsLoading(true);
    toast({
      title: 'Placing Your Order...',
      description: 'Please wait while we prepare your order.',
    });

    try {
        let finalUserId = (user?.role === 'client' ? user?.uid : null) || linkedUser?.id || null;
        const email = values.email.toLowerCase().trim();

        // Final verification check in case debounce didn't catch it
        if (!finalUserId) {
            const result = await checkExistingUserByEmail(values.email);
            if (result.exists && result.id) {
                toast({
                    title: 'Account Exists',
                    description: 'An account already exists with this email address. Please log in to your existing account to continue.',
                    variant: 'destructive',
                });
                setIsLoading(false);
                return;
            }
        }

        let isNewUser = false;
        let generatedPassword = null;

        // 1. Create account if truly a new guest
        if (!finalUserId) {
            isNewUser = true;
            generatedPassword = nanoid();
            
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, values.email, generatedPassword);
                finalUserId = userCredential.user.uid;

                const userDocRef = doc(db, 'users', finalUserId);
                await setDoc(userDocRef, {
                    id: finalUserId,
                    uid: finalUserId,
                    name: `${values.firstName} ${values.lastName}`,
                    email: values.email.toLowerCase().trim(),
                    contactNumber: values.phone,
                    role: 'client',
                    source: partnerId ? 'Partner Landing Page' : 'Website',
                    createdAt: serverTimestamp(),
                });

                if (auth.currentUser) {
                    await reauthenticate(auth.currentUser);
                }
            } catch (authError: any) {
                if (authError.code === 'auth/email-already-in-use') {
                    toast({
                        title: 'Account Exists',
                        description: 'An account already exists with this email address. Please log in to your existing account to continue.',
                        variant: 'destructive',
                    });
                    setIsLoading(false);
                    return;
                }
                throw authError;
            }
        }

        let resellerData: User | undefined;
        if (partnerId) {
            const partnerSnap = await getDoc(doc(db, 'users', partnerId));
            if (partnerSnap.exists()) {
                resellerData = { ...partnerSnap.data(), id: partnerSnap.id } as User;
            }
        }

        const orderId = await getNextOrderId();
        const orderData: Order = {
            id: orderId,
            userId: finalUserId,
            customerName: `${values.firstName} ${values.lastName}`,
            customerEmail: values.email,
            customerPhone: values.phone,
            items: [{ id: service.id, title: service.title, price: service.price, quantity: 1 }],
            total: service.price,
            discountCode: null,
            discountAmount: null,
            paymentMethod: resellerData?.bankingDetails?.bankName ? 'EFT' : 'PayFast',
            status: 'Pending Payment',
            date: Timestamp.now(),
            department: service.department || null,
            source: partnerId ? 'Partner Landing Page' : 'Client',
            ...(partnerId ? { resellerId: partnerId } : {}),
        };

        await setDoc(doc(db, 'orders', orderId), orderData);
        
        try {
            const serializableOrder = JSON.parse(JSON.stringify(orderData));
            const serializableReseller = resellerData ? JSON.parse(JSON.stringify(resellerData)) : undefined;

            await sendOrderConfirmationEmailAction({
                orderData: serializableOrder,
                resellerData: serializableReseller,
                isNewUser,
                generatedPassword,
                showPaymentButton: !resellerData?.bankingDetails?.bankName,
            });
        } catch (emailError) {
            console.error("Non-blocking order email send error:", emailError);
        }

        router.push(`/order-confirmation/${orderId}`);

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

  const formatPrice = (price: number) => new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);

  if (service.isPriceTbc) {
      return <PriceOnRequestForm service={service} />;
  }

  return (
    <Form {...form}>
        <form id="checkout" onSubmit={form.handleSubmit(handleCheckout, onError)} className="space-y-6">
            {(!user || user.role !== 'client') && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground tracking-widest mb-2">
                        <UserIcon className="h-3 w-3" /> Personal Details
                    </div>
                    
                    <FormField control={form.control} name="email" render={({ field }) => ( 
                        <FormItem>
                            <FormLabel className="text-xs">Email Address</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input type="email" placeholder="Start here..." {...field} className="h-10 border-primary/20 focus-visible:ring-primary font-medium" />
                                    {isCheckingUser && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />}
                                </div>
                            </FormControl>
                            {linkedUser && (
                                <div className="flex items-center gap-2 text-[10px] text-green-600 font-bold bg-green-50 p-2 rounded border border-green-100 mt-1">
                                    <CheckCircle2 className="h-3 w-3" /> Matched: {linkedUser.name}
                                </div>
                            )}
                            <FormMessage />
                        </FormItem> 
                    )} />

                    <div className="grid grid-cols-2 gap-3">
                        <FormField control={form.control} name="firstName" render={({ field }) => ( <FormItem><FormLabel className="text-xs">First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="lastName" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Surname</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    </div>
                    <FormField control={form.control} name="phone" render={({ field }) => ( <FormItem><FormLabel className="text-xs">Cell Number</FormLabel><FormControl><Input placeholder="082 123 4567" {...field} /></FormControl><FormMessage /></FormItem> )} />
                    <Separator />
                </div>
            )}

            <div className="space-y-4">
                <FormField
                    control={form.control}
                    name="hasPrerequisites"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-medium cursor-pointer">I confirm I have all the prerequisites for this service.</FormLabel>
                                <FormMessage />
                            </div>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="agreedToRefundPolicy"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                            <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-medium cursor-pointer">
                                    I agree to the <Link href="/refund-policy" className="text-primary underline" target="_blank">refund policy</Link>.
                                </FormLabel>
                                <FormMessage />
                            </div>
                        </FormItem>
                    )}
                />
            </div>
        
            <Button 
                type="submit"
                disabled={isLoading}
                className="w-full partner-btn h-12 text-base font-extrabold"
            >
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                {isLoading ? 'Processing...' : `Proceed to Payment${!service.isPriceTbc ? ` – ${formatPrice(service.price)}` : ''}`}
            </Button>

            {/* Trust bar */}
            <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-wider pt-1">
              <span className="flex items-center gap-1"><Lock className="h-3 w-3 text-green-600" />Secure</span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-blue-600" />SARS Compliant</span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3 text-amber-600" />Refund Policy</span>
            </div>

            {!user && (
                <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                        Already have an account? <Link href="/login" className="text-primary hover:underline">Login here</Link>
                    </p>
                </div>
            )}
        </form>
    </Form>
  );
}
