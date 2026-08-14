'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Service, Order, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, User as UserIcon, CheckCircle2, ShieldCheck, Lock, RefreshCw, MessageSquare, AlertCircle, Check, Clock } from 'lucide-react';
import { getFirestore, doc, setDoc, Timestamp, getDoc, serverTimestamp, collection, query, where, getDocs, or } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase';
import { Checkbox } from '../ui/checkbox';
import { Separator } from '../ui/separator';
import { sendOrderConfirmationEmailAction, checkExistingUserByEmail, createCheckoutOrderAction } from '@/app/actions';
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
      const subject = encodeURIComponent(`Quote Request: ${service.title}`);
      const body = encodeURIComponent(
        `Name: ${values.name}\nEmail: ${values.email}\nPhone: ${values.phone}\n\nMessage:\n${values.message}`
      );
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
          <Input type="email" {...enquiryForm.register('email')} placeholder="john@example.com" className="mt-1 h-9 text-sm" />
          {enquiryForm.formState.errors.email && <p className="text-[10px] text-destructive mt-0.5">{enquiryForm.formState.errors.email.message}</p>}
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700">Cell Number</label>
          <Input type="tel" {...enquiryForm.register('phone')} placeholder="082 123 4567" className="mt-1 h-9 text-sm" />
          {enquiryForm.formState.errors.phone && <p className="text-[10px] text-destructive mt-0.5">{enquiryForm.formState.errors.phone.message}</p>}
        </div>
        <div>
          <label className="text-xs font-bold text-slate-700">Requirements / Message</label>
          <Textarea {...enquiryForm.register('message')} placeholder="Please describe what you need..." className="mt-1 text-sm min-h-[80px]" />
          {enquiryForm.formState.errors.message && <p className="text-[10px] text-destructive mt-0.5">{enquiryForm.formState.errors.message.message}</p>}
        </div>
        <Button type="submit" disabled={isSending} className="w-full h-10 text-sm font-bold mt-2">
          {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {isSending ? 'Sending...' : 'Submit Quote Request'}
        </Button>
      </form>
    </div>
  );
}

interface ServiceCheckoutFormProps {
  service: Service;
  partnerId?: string;
  selectedPrereqIds?: Set<string>;
  onTogglePrereq?: (serviceId: string) => void;
  arePrereqsConfirmed?: boolean;
}

export default function ServiceCheckoutForm({
  service,
  partnerId,
  selectedPrereqIds,
  onTogglePrereq,
  arePrereqsConfirmed,
}: ServiceCheckoutFormProps) {
  const router = useRouter();
  const { user, reauthenticate } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [linkedUser, setLinkedUser] = useState<{name: string, id: string} | null>(null);

  const allPrereqsMet = arePrereqsConfirmed !== undefined ? arePrereqsConfirmed : true;
  const [isCheckingUser, setIsCheckingUser] = useState(false);
  const [prereqServices, setPrereqServices] = useState<Service[]>([]);
  const [localSelectedPrereqIds, setLocalSelectedPrereqIds] = useState<Set<string>>(new Set());
  const [loadingPrereqs, setLoadingPrereqs] = useState<boolean>(true);

  const activeSelectedPrereqIds = selectedPrereqIds || localSelectedPrereqIds;

  // Load prerequisite products for this service
  useEffect(() => {
    let isMounted = true;

    async function loadPrereqs() {
      const productIds = new Set<string>();

      if (service.requiredProductIds) {
        service.requiredProductIds.forEach((id) => productIds.add(id));
      }

      if (service.clientRequirements) {
        service.clientRequirements.forEach((req) => {
          if (typeof req !== 'string' && req.type === 'product' && req.productId) {
            productIds.add(req.productId);
          }
        });
      }

      if (productIds.size === 0) {
        if (isMounted) {
          setPrereqServices([]);
          setLoadingPrereqs(false);
        }
        return;
      }

      try {
        const snap = await getDocs(collection(db, 'services'));
        const allServices = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Service));

        const matched: Service[] = [];
        productIds.forEach((pid) => {
          const found = allServices.find(
            (s) => s.id === pid || s.slug === pid || s.title.toLowerCase() === pid.toLowerCase()
          );
          if (found && found.id !== service.id && !matched.some((m) => m.id === found.id)) {
            matched.push(found);
          }
        });

        if (isMounted) {
          setPrereqServices(matched);
          setLoadingPrereqs(false);
        }
      } catch (err) {
        console.error('Error fetching prerequisite products in ServiceCheckoutForm:', err);
        if (isMounted) setLoadingPrereqs(false);
      }
    }

    loadPrereqs();

    return () => {
      isMounted = false;
    };
  }, [service.id, service.requiredProductIds, service.clientRequirements]);

  const togglePrereq = (id: string) => {
    if (onTogglePrereq) {
      onTogglePrereq(id);
    } else {
      setLocalSelectedPrereqIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }
  };

  const selectedPrereqList = prereqServices.filter((p) => activeSelectedPrereqIds.has(p.id));
  const hasPackageDiscount = selectedPrereqList.length > 0;

  const rawPrereqsTotal = selectedPrereqList.reduce((sum, p) => sum + (p.price || 0), 0);
  const rawOrderTotal = (service.price || 0) + rawPrereqsTotal;

  // 20% discount applies to the ENTIRE order when prerequisites are included
  const packageDiscount = hasPackageDiscount ? Math.round(rawOrderTotal * 0.2) : 0;
  const orderTotal = rawOrderTotal - packageDiscount;

  const form = useForm<z.infer<typeof checkoutSchema>>({
      resolver: zodResolver(checkoutSchema),
      defaultValues: {
          firstName: (user?.role === 'client' ? user?.name?.split(' ')[0] : '') || '',
          lastName: (user?.role === 'client' ? user?.name?.split(' ').slice(1).join(' ') : '') || '',
          email: (user?.role === 'client' ? user?.email : '') || '',
          phone: (user?.role === 'client' ? user?.contactNumber : '') || '',
          hasPrerequisites: allPrereqsMet,
          agreedToRefundPolicy: false,
      }
  });

  useEffect(() => {
    form.setValue('hasPrerequisites', allPrereqsMet);
  }, [allPrereqsMet, form]);

  const watchedEmail = form.watch('email');
  const watchedAgreedToRefundPolicy = form.watch('agreedToRefundPolicy');

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
        const finalUserId = (user?.role === 'client' ? user?.uid : null) || linkedUser?.id || null;
        
        const orderItems = [
          {
            id: service.id,
            title: service.title,
            price: hasPackageDiscount ? Math.round((service.price || 0) * 0.8) : (service.price || 0),
            quantity: 1,
          },
          ...selectedPrereqList.map((p) => ({
            id: p.id,
            title: p.title,
            price: Math.round((p.price || 0) * 0.8),
            quantity: 1,
          })),
        ];

        const result = await createCheckoutOrderAction({
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            phone: values.phone,
            items: orderItems,
            total: orderTotal,
            partnerId,
            userId: finalUserId,
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

        router.push(`/order-confirmation/${result.orderId}`);

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
            {/* Prerequisite Product Checkbox Selection Box */}
            {!loadingPrereqs && prereqServices.length > 0 && (
                <div className="space-y-2 rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950">
                        <AlertCircle className="h-4 w-4 text-blue-600 shrink-0" />
                        Include Required Prerequisite Products
                    </div>
                    <p className="text-[11px] text-blue-900 leading-tight">
                        Select any prerequisites you don&apos;t have so they can be included directly in your order:
                    </p>

                    <div className="space-y-2 pt-1">
                        {prereqServices.map((p) => {
                            const isChecked = activeSelectedPrereqIds.has(p.id);
                            return (
                                <div
                                    key={p.id}
                                    onClick={() => togglePrereq(p.id)}
                                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border transition-all select-none cursor-pointer ${
                                        isChecked
                                            ? 'bg-white border-blue-300 shadow-2xs'
                                            : 'bg-white/70 border-slate-200 opacity-70 hover:opacity-100'
                                    }`}
                                >
                                    <div
                                        className={`h-4 w-4 shrink-0 rounded-sm border flex items-center justify-center transition-all mt-0.5 ${
                                            isChecked
                                                ? 'bg-blue-600 border-blue-600 text-white'
                                                : 'border-slate-300 bg-white'
                                        }`}
                                    >
                                        {isChecked && <Check className="h-3 w-3 text-white stroke-[3]" />}
                                    </div>
                                    <div className="text-xs space-y-1 min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-1">
                                            <span className="font-bold text-slate-900 leading-none truncate">{p.title}</span>
                                            <span className="font-black text-blue-700 text-xs shrink-0">
                                                {p.isPriceTbc ? 'Quote' : formatPrice(p.price || 0)}
                                            </span>
                                        </div>
                                        {p.turnaroundTime && (
                                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold pt-0.5">
                                                <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                                                <span>{p.turnaroundTime}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

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
                {!allPrereqsMet ? (
                    <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-center space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-center gap-1.5 text-amber-900 font-extrabold text-xs">
                            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                            Prerequisites Action Required
                        </div>
                        <p className="text-xs text-amber-800 font-semibold leading-relaxed">
                            Please confirm all required prerequisites on the left by ticking each requirement box before proceeding to payment.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                        <FormField
                            control={form.control}
                            name="agreedToRefundPolicy"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl><Checkbox checked={field.value ?? false} onCheckedChange={(c) => field.onChange(Boolean(c))} /></FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel className="text-sm font-medium cursor-pointer">
                                            I agree to the <Link href="/refund-policy" className="text-primary underline" target="_blank">refund policy</Link>.
                                        </FormLabel>
                                        <FormMessage />
                                    </div>
                                </FormItem>
                            )}
                        />

                        {hasPackageDiscount && packageDiscount > 0 && (
                            <div className="rounded-xl bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white border border-emerald-300 p-3 space-y-2 text-xs animate-in fade-in shadow-2xs">
                                <div className="flex items-center justify-between text-slate-600 font-semibold">
                                    <span>Order Subtotal</span>
                                    <span className="line-through text-slate-400">{formatPrice(rawOrderTotal)}</span>
                                </div>
                                <div className="flex items-center justify-between text-emerald-800 font-black">
                                    <span className="flex items-center gap-1.5">
                                        <span className="text-sm">🎁</span> 20% Package Discount (Total Order)
                                    </span>
                                    <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                                        -{formatPrice(packageDiscount)}
                                    </span>
                                </div>
                            </div>
                        )}

                        <Button 
                            type="submit"
                            disabled={isLoading || !watchedAgreedToRefundPolicy}
                            className={`w-full h-12 text-base font-extrabold transition-all ${
                                !watchedAgreedToRefundPolicy
                                    ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed shadow-none'
                                    : 'partner-btn shadow-md hover:shadow-lg'
                            }`}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                            {isLoading
                                ? 'Processing...'
                                : !watchedAgreedToRefundPolicy
                                ? '🔒 Please Agree to Refund Policy to Proceed'
                                : `Proceed to Payment${!service.isPriceTbc ? ` – ${formatPrice(orderTotal)}` : ''}`}
                        </Button>
                    </div>
                )}
            </div>

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
