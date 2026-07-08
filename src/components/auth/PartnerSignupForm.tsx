'use client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, setDoc, collection, getDocs, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { useState, useEffect, useMemo } from 'react';
import { Loader2, Briefcase, CheckCircle2, UserPlus, Wallet2, CreditCard, Sparkles, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Service, Order } from '@/lib/types';
import { sendEmail } from '@/lib/email';
import { render } from '@react-email/components';
import PartnerWelcomeEmail from '../emails/PartnerWelcomeEmail';
import { getNextOrderId } from '@/lib/sequence';
import { Timestamp } from 'firebase/firestore';

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

const formSchema = z.object({
  companyName: z.string().min(2, 'Company name is required.'),
  name: z.string().min(2, 'First name is required.'),
  surname: z.string().min(2, 'Surname is required.'),
  email: z.string().email('Please enter a valid email.'),
  password: z.string().optional(),
  contactNumber: z.string().min(10, 'A valid contact number is required.'),
  slug: z.string()
    .min(3, 'Slug must be at least 3 characters.')
    .max(30, 'Slug must be at most 30 characters.')
    .regex(/^[a-z0-9\-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens.'),
  tier: z.literal('growth').default('growth'),
  setupAddon: z.boolean().default(false),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions.',
  }),
});

type Category = { 
    id: string; 
    name: string; 
    description: string; 
    order: number; 
};

export default function PartnerSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const { user: currentUser, reauthenticate } = useAuth();

  // Slug states
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [isSlugAvailable, setIsSlugAvailable] = useState<boolean | null>(null);
  const [isSlugManual, setIsSlugManual] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: '',
      name: searchParams.get('name') || '',
      surname: '',
      email: searchParams.get('email') || currentUser?.email || '',
      password: '',
      contactNumber: '',
      slug: '',
      tier: 'growth',
      setupAddon: false,
      agreeTerms: false,
    },
  });

  // Update email if currentUser changes after initial render
  useEffect(() => {
      if (currentUser?.email) {
          form.setValue('email', currentUser.email);
      }
  }, [currentUser, form]);

  const selectedTier = form.watch('tier');
  const companyName = form.watch('companyName');
  const currentSlug = form.watch('slug');
  
  // Auto-slugify company name
  useEffect(() => {
    if (!isSlugManual && companyName) {
      const slugified = companyName
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-');
      form.setValue('slug', slugified, { shouldValidate: true });
    }
  }, [companyName, isSlugManual, form]);

  // Check slug availability (debounced)
  useEffect(() => {
    if (!currentSlug || currentSlug.length < 3) {
      setIsSlugAvailable(null);
      return;
    }

    const checkSlug = async () => {
      setCheckingSlug(true);
      try {
        const q = query(collection(db, "users"), where("landingPage.slug", "==", currentSlug));
        const snap = await getDocs(q);
        setIsSlugAvailable(snap.empty);
      } catch (err) {
        console.error("Error checking slug:", err);
      } finally {
        setCheckingSlug(false);
      }
    };

    const timer = setTimeout(checkSlug, 500);
    return () => clearTimeout(timer);
  }, [currentSlug]);

  const setupAddon = form.watch('setupAddon');


  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (values.tier === 'growth' && isSlugAvailable === false) {
      toast({ title: 'Slug Unavailable', description: 'Please choose a different practice URL slug.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
        const { password, ...partnerData } = values;

        let newFirebaseUser;
        let authUid;

        if (currentUser) {
            newFirebaseUser = auth.currentUser!;
            authUid = currentUser.uid;
        } else {
            if (!values.password || values.password.length < 6) {
                toast({ title: 'Password Required', description: 'Please enter a password with at least 6 characters.', variant: 'destructive' });
                setIsLoading(false);
                return;
            }
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            newFirebaseUser = userCredential.user;
            authUid = newFirebaseUser.uid;
        }
        
        
        const contactPersonFullName = `${values.name} ${values.surname}`;

        // 2. Create the User Document
        const newUserDocRef = doc(db, "users", authUid);
        
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + 14);

        const initialStatus = values.setupAddon ? 'Pending Setup Payment' : 'Trial';
        const initialSubStatus = values.setupAddon ? 'pending' : 'trialing';

        await setDoc(newUserDocRef, {
            ...partnerData,
            contactPerson: contactPersonFullName,
            name: contactPersonFullName,
            id: authUid,
            uid: authUid,
            role: 'partner',
            partnerTier: 'growth',
            status: initialStatus, 
            creditBalance: 0,
            createdAt: serverTimestamp(),
            landingPage: {
                enabled: true,
                slug: values.slug.toLowerCase().trim(),
                companyName: values.companyName,
            },
            partnerSubscription: {
                status: initialSubStatus,
                currentPeriodEnd: Timestamp.fromDate(trialEndDate),
                aiCompanyLimit: 1,
                aiPayrollLimit: 1,
                staffSeatLimit: 3,
            }
        }, { merge: true });

        // 3. Trigger manual re-auth logic
        await reauthenticate(newFirebaseUser);

        // 4. Send welcome email (only if they created a new account)
        if (!currentUser) {
            try {
                const emailHtml = render(<PartnerWelcomeEmail 
                    partnerName={values.name} 
                    email={values.email}
                    loginUrl={`${process.env.NEXT_PUBLIC_APP_URL}/login`} 
                />);

                await sendEmail({
                    to: values.email,
                    cc: 'kev@thinkestry.co.za',
                    subject: `Welcome to the My Accountant Partner Program!`,
                    html: emailHtml,
                });
            } catch (e) {
                console.error("Welcome email failed", e);
            }
        }

        // 5. Subscription Checkout or Direct Dashboard
        if (values.setupAddon) {
            toast({
                title: 'Account Registered',
                description: `Redirecting to PayFast to set up your subscription and onboarding...`,
            });

            const amountVal = 1950;
            const billingDate = new Date();
            billingDate.setDate(billingDate.getDate() + 14);
            const billingDateStr = billingDate.toISOString().split('T')[0];

            const payfastUrl = process.env.NEXT_PUBLIC_PAYFAST_PROCESS_URL || 'https://www.payfast.co.za/eng/process';
            
            const formElement = document.createElement('form');
            formElement.method = 'POST';
            formElement.action = payfastUrl;

            const payfastData: { [key: string]: string } = {
                merchant_id: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_ID || '23836312',
                merchant_key: process.env.NEXT_PUBLIC_PAYFAST_MERCHANT_KEY || 'h4fkhz6ouoksx',
                return_url: `${process.env.NEXT_PUBLIC_APP_URL}/partner/dashboard`,
                cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/partner/dashboard`,
                notify_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payfast/notify`,
                name_first: values.name,
                name_last: values.surname,
                email_address: values.email,
                m_payment_id: authUid, // partnerId
                amount: amountVal.toFixed(2),
                item_name: 'BEI Growth Subscription + Onboarding Setup',
                
                // Subscription fields
                subscription_type: '1',
                recurring_amount: '950.00',
                frequency: '3', // monthly
                cycles: '0', // indefinite
                billing_date: billingDateStr,
                custom_str1: 'partner_subscription',
            };

            for (const key in payfastData) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = payfastData[key];
                formElement.appendChild(input);
            }
            
            document.body.appendChild(formElement);
            formElement.submit();
        } else {
            // Free trial, no upfront setup payment
            toast({
                title: 'Welcome to My Accountant!',
                description: `Your 14-day free trial has started.`,
            });
            router.push('/partner/dashboard');
        }

    } catch (error: any) {
        console.error("Partner signup error:", error);
        let description = 'There was a problem creating your account.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'An account with this email already exists. Are you a My Accountant client? Please log in first to upgrade to a Partner account.';
            toast({ 
                title: 'Email Already In Use', 
                description, 
                variant: 'destructive',
                action: <Button variant="outline" size="sm" asChild><Link href={`/login?redirect=/partner-signup`}>Go to Login</Link></Button>
            });
            setIsLoading(false);
            return;
        }
        toast({ title: 'Signup Failed', description, variant: 'destructive' });
        setIsLoading(false);
    }
  }

  const handleNext = async () => {
      const isValid = await form.trigger(['companyName', 'name', 'surname', 'email', 'password', 'contactNumber', 'slug']);
      if (isValid) {
          if (selectedTier === 'growth' && isSlugAvailable === false) {
              toast({ title: 'Slug Unavailable', description: 'Please select an available practice URL slug.', variant: 'destructive' });
              return;
          }
          setStep(2);
      }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Step 1: Practice Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="companyName" render={({ field }) => ( <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input placeholder="Acme Consulting" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="contactNumber" render={({ field }) => ( <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input placeholder="082 123 4567" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Contact First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="surname" render={({ field }) => ( <FormItem><FormLabel>Contact Surname</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Login Email Address</FormLabel><FormControl><Input placeholder="john@acme.co.za" {...field} disabled={!!currentUser} /></FormControl><FormMessage /></FormItem>)} />
                        {!currentUser && (
                            <FormField control={form.control} name="password" render={({ field }) => ( <FormItem><FormLabel>Create Password</FormLabel><FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        )}
                    </div>
                </div>

                <Separator />

                <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        Step 2: Practice URL
                    </h3>
                    <FormField 
                        control={form.control} 
                        name="slug" 
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Practice Landing Page Address</FormLabel>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-semibold text-muted-foreground bg-muted h-10 px-3 flex items-center border rounded-l-md border-r-0 select-none">
                                        myacc.co.za/p/
                                    </span>
                                    <FormControl>
                                        <Input 
                                            placeholder="acme" 
                                            className="rounded-l-none" 
                                            {...field} 
                                            onChange={(e) => {
                                                setIsSlugManual(true);
                                                field.onChange(e.target.value.toLowerCase().trim().replace(/[^a-z0-9\-]/g, ''));
                                            }}
                                        />
                                    </FormControl>
                                </div>
                                <FormDescription className="text-amber-600 font-medium">
                                    Warning: This URL cannot be changed later. Choose carefully!
                                </FormDescription>
                                <div className="text-xs mt-1">
                                    {checkingSlug && <p className="text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Checking availability...</p>}
                                    {isSlugAvailable === true && <p className="text-green-600 font-semibold">✓ Custom URL is available!</p>}
                                    {isSlugAvailable === false && <p className="text-red-500 font-semibold">✗ This URL address is already in use.</p>}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )} 
                    />
                </div>
                
                <Button type="button" onClick={handleNext} className="w-full h-12 font-bold mt-4">Next: Pricing & Capabilities</Button>
            </div>
        )}

        {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Step 3: Account Setup
                    </h3>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
                        <FormField
                            control={form.control}
                            name="setupAddon"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel className="font-bold cursor-pointer text-primary">
                                            Add "Done-For-You Onboarding" Setup? (R1,950 once-off)
                                        </FormLabel>
                                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                                            We will setup your re-branded landing page, link your custom domain, load your service pricing markups, and schedule a 1-on-1 CA training session.
                                        </p>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
                <Separator />

                <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Plan Summary
                    </h3>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-sm">Growth Tier Monthly Subscription</span>
                                <span className="font-black text-md text-primary">R950.00 /mo</span>
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                                Includes branded landing page, 1 Free AI Accountant company, 1 Free AI Payroll company, 3 staff seats, task board, and Partner Community Chat.
                            </div>
                            {setupAddon && (
                                <div className="flex justify-between items-center border-t pt-2 mt-2">
                                    <span className="font-medium text-xs">Done-For-You Setup (Once-off Add-on)</span>
                                    <span className="font-bold text-xs text-primary">+ R1,950.00</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center border-t border-primary/20 pt-2 font-bold text-sm">
                                <span>Total Due Today</span>
                                <span>R{(setupAddon ? 1950 : 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="agreeTerms"
                    render={({ field }) => (
                        <FormItem className="flex flex-col space-y-3">
                            <div className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel className="cursor-pointer font-medium text-xs">
                                        I agree to the <Link href="/terms" className="underline font-bold" target="_blank">terms and conditions</Link> and approve the plan pricing.
                                    </FormLabel>
                                </div>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-1/3 h-12 font-bold" disabled={isLoading}>Back</Button>
                    <Button type="submit" className="w-2/3 h-12 text-lg font-black shadow-xl" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? 'Creating Account...' : 'Proceed to Checkout'}
                    </Button>
                </div>
            </div>
        )}
      </form>
    </Form>
  );
}
