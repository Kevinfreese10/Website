'use client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { useState, useEffect, useMemo } from 'react';
import { Loader2, Briefcase, UserPlus, CreditCard, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Service } from '@/lib/types';
import { sendOwnWelcomeEmail } from '@/app/actions/email-gateway';
import { checkIfEmailExists } from '@/app/actions';
import { becomePartnerAction } from '@/app/actions/account-provisioning';
import { render } from '@react-email/components';
import PartnerWelcomeEmail from '../emails/PartnerWelcomeEmail';
import { Badge } from '@/components/ui/badge';
import { submitPayFastPayment } from '@/lib/payfast-client';
import { cn } from '@/lib/utils';
import {
  PARTNER_TIER_PLANS,
  NormalizedPartnerTier,
  normalizePartnerTier,
} from '@/lib/partner-pricing';

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

const formSchema = z
  .object({
    companyName: z.string().min(2, 'Company name is required.'),
    name: z.string().min(2, 'First name is required.'),
    surname: z.string().min(2, 'Surname is required.'),
    email: z.string().email('Please enter a valid email.'),
    password: z.string().optional(),
    contactNumber: z.string().min(10, 'A valid contact number is required.'),
    tier: z.enum(['starter', 'practice', 'enterprise']).default('starter'),
    wantsOutsourcedWork: z.boolean().default(false),
    cv: z.any().optional(),
    certificate: z.any().optional(),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions.',
    }),
    designations: z.array(z.string()).optional(),
    capableServices: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      if (data.wantsOutsourcedWork) {
        return data.cv?.[0] && data.certificate?.[0];
      }
      return true;
    },
    {
      message: 'CV and Certificate are required to be considered for outsourced work.',
      path: ['wantsOutsourcedWork'],
    }
  );

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
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [isServicesLoading, setIsServicesLoading] = useState(true);

  const initialTier = normalizePartnerTier(searchParams.get('tier'));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: '',
      name: searchParams.get('name') || '',
      surname: '',
      email: searchParams.get('email') || currentUser?.email || '',
      password: '',
      contactNumber: '',
      tier: initialTier,
      wantsOutsourcedWork: false,
      agreeTerms: false,
      capableServices: [],
    },
  });

  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const currentEmail = form.watch('email');

  useEffect(() => {
    if (!currentEmail || currentEmail.length < 5 || !currentEmail.includes('@')) {
      setEmailExists(null);
      return;
    }

    const checkEmail = async () => {
      setCheckingEmail(true);
      try {
        const res = await checkIfEmailExists(currentEmail);
        if (res.success) {
          setEmailExists(res.exists);
        } else {
          setEmailExists(null);
        }
      } catch {
        setEmailExists(null);
      } finally {
        setCheckingEmail(false);
      }
    };

    const timer = setTimeout(checkEmail, 600);
    return () => clearTimeout(timer);
  }, [currentEmail]);

  useEffect(() => {
    if (currentUser?.email) {
      form.setValue('email', currentUser.email);
    }
  }, [currentUser, form]);

  useEffect(() => {
    const fetchServicesAndCategories = async () => {
      setIsServicesLoading(true);
      try {
        const servicesQuery = query(collection(db, 'services'), orderBy('title'));
        const servicesSnapshot = await getDocs(servicesQuery);
        const fetchedServices = servicesSnapshot.docs.map(
          (d) => ({ ...d.data(), id: d.id } as Service)
        );
        setAllServices(fetchedServices);

        const categoriesQuery = query(collection(db, 'categories'), orderBy('order'));
        const categoriesSnapshot = await getDocs(categoriesQuery);
        const fetchedCategories = categoriesSnapshot.docs.map(
          (d) => ({ ...d.data(), id: d.id } as Category)
        );
        setAllCategories(fetchedCategories);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsServicesLoading(false);
      }
    };
    fetchServicesAndCategories();
  }, []);

  const categorizedServices = useMemo(() => {
    if (!allCategories.length || !allServices.length) return [];
    return allCategories
      .map((category) => ({
        ...category,
        services: allServices.filter((service) => service.category === category.name),
      }))
      .filter((category) => category.services.length > 0);
  }, [allCategories, allServices]);

  const wantsOutsourcedWork = form.watch('wantsOutsourcedWork');
  const selectedTier = form.watch('tier');
  const selectedPlan = PARTNER_TIER_PLANS[selectedTier];

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      const { password, cv, certificate, tier, ...partnerData } = values;

      let newFirebaseUser;
      let authUid;

      if (currentUser) {
        newFirebaseUser = auth.currentUser!;
        authUid = currentUser.uid;
      } else {
        if (!values.password || values.password.length < 6) {
          toast({
            title: 'Password Required',
            description: 'Please enter a password with at least 6 characters.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          values.email,
          values.password
        );
        newFirebaseUser = userCredential.user;
        authUid = newFirebaseUser.uid;

        await updateProfile(newFirebaseUser, {
          displayName: `${values.name} ${values.surname}`,
        });
      }

      let cvUrl = '';
      let certificateUrl = '';

      if (values.wantsOutsourcedWork && values.cv?.[0] && values.certificate?.[0]) {
        toast({
          title: 'Uploading Documents...',
          description: 'Please wait while we upload your files.',
        });
        cvUrl = await uploadFile(
          values.cv[0],
          `partner-applications/${authUid}/cv-${values.cv[0].name}`
        );
        certificateUrl = await uploadFile(
          values.certificate[0],
          `partner-applications/${authUid}/certificate-${values.certificate[0].name}`
        );
      }

      const contactPersonFullName = `${values.name} ${values.surname}`;
      const newUserDocRef = doc(db, 'users', authUid);

      await setDoc(
        newUserDocRef,
        {
          ...partnerData,
          contactPerson: contactPersonFullName,
          name: contactPersonFullName,
          id: authUid,
          uid: authUid,
          createdAt: serverTimestamp(),
          cvUrl,
          certificateUrl,
        },
        { merge: true }
      );

      const partnerIdToken = await newFirebaseUser.getIdToken();
      const becomePartnerResult = await becomePartnerAction(partnerIdToken);
      if (!becomePartnerResult.success) {
        throw new Error(becomePartnerResult.error || 'Could not activate partner account.');
      }

      await reauthenticate(newFirebaseUser);

      if (!currentUser) {
        try {
          const emailHtml = render(
            <PartnerWelcomeEmail
              partnerName={values.name}
              email={values.email}
              loginUrl={`${process.env.NEXT_PUBLIC_APP_URL}/login`}
            />
          );

          await sendOwnWelcomeEmail({
            idToken: partnerIdToken,
            cc: 'info@myacc.co.za',
            subject: `Welcome to the My Accountant Partner Program!`,
            html: emailHtml,
          });
        } catch (e) {
          console.error('Welcome email failed', e);
        }
      }

      const plan = PARTNER_TIER_PLANS[tier];

      if (plan.monthlyPrice > 0) {
        toast({
          title: 'Redirecting to PayFast...',
          description: `Setting up your ${plan.name} (R${plan.monthlyPrice.toLocaleString('en-ZA')}/month) subscription.`,
        });

        const todayStr = new Date().toISOString().split('T')[0];
        const res = await submitPayFastPayment({
          orderId: authUid,
          amount: plan.monthlyPrice,
          itemName: `My Accountant Partner - ${plan.name} Tier`,
          itemDescription: `${plan.name} Back-Office Subscription (${plan.discountPercent}% wholesale discount, ${plan.aiCompanyLabel}, ${plan.aiPayrollLabel})`,
          customerName: contactPersonFullName,
          customerEmail: values.email,
          customerPhone: values.contactNumber || '',
          returnPath: '/partner/dashboard?sub_success=true',
          cancelPath: '/partner/settings',
          customStr1: 'partner_subscription',
          customStr2: plan.id,
          subscription: {
            subscription_type: '1',
            billing_date: todayStr,
            recurring_amount: plan.monthlyPrice,
            frequency: '3',
            cycles: '0',
          },
        });

        if (!res.success) {
          toast({
            title: 'Payment Gateway Error',
            description: res.error || 'Could not redirect to PayFast.',
            variant: 'destructive',
          });
          setIsLoading(false);
        }
        return;
      }

      toast({
        title: 'Welcome to My Accountant!',
        description: 'Your Partner Practice Portal is ready.',
      });
      router.push('/partner/dashboard');
    } catch (error: any) {
      console.error('Partner signup error:', error);
      let description = 'There was a problem creating your account.';
      if (error.code === 'auth/email-already-in-use') {
        description =
          'An account with this email already exists. Please log in first to upgrade to a Partner account.';
        toast({
          title: 'Email Already In Use',
          description,
          variant: 'destructive',
          action: (
            <Button variant="outline" size="sm" asChild>
              <Link href="/login?redirect=/partner-signup">Go to Login</Link>
            </Button>
          ),
        });
        setIsLoading(false);
        return;
      }
      toast({ title: 'Signup Failed', description, variant: 'destructive' });
      setIsLoading(false);
    }
  }

  const handleNextOrLogin = async () => {
    const fieldsToValidate: any = ['companyName', 'name', 'surname', 'email'];
    if (!currentUser) fieldsToValidate.push('password', 'contactNumber');

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      if (emailExists && !currentUser) {
        setIsLoggingIn(true);
        try {
          const values = form.getValues();
          const userCredential = await signInWithEmailAndPassword(
            auth,
            values.email,
            values.password || ''
          );

          const userDocRef = doc(db, 'users', userCredential.user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            if (data.name) form.setValue('name', data.name.split(' ')[0]);
            if (data.surname)
              form.setValue('surname', data.surname || data.name.split(' ')[1] || '');
            if (data.companyName) form.setValue('companyName', data.companyName);
            if (data.contactNumber) form.setValue('contactNumber', data.contactNumber);
          }

          toast({
            title: 'Logged In Successfully!',
            description: 'Your account was found. Please choose your Partner Tier to continue.',
          });
          setStep(2);
        } catch (error: any) {
          console.error('Login failed:', error);
          toast({
            title: 'Login Failed',
            description: 'Incorrect password for this email address. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setIsLoggingIn(false);
        }
      } else {
        setStep(2);
      }
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
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Login Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="john@acme.co.za"
                            {...field}
                            disabled={!!currentUser}
                          />
                          {checkingEmail && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground absolute right-3 top-2.5" />
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {!currentUser && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {emailExists ? 'Enter Existing Password' : 'Create Password'}
                        </FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="••••••••" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Practice / Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Accounting" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input placeholder="082 123 4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="surname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Surname</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {emailExists && !currentUser && (
                <div className="bg-green-50 border border-green-200 border-l-4 border-l-green-600 text-green-900 p-4 rounded-md my-4 animate-in fade-in zoom-in-95 shadow-sm">
                  <h4 className="font-bold flex items-center gap-2 text-green-700 text-base">
                    <UserPlus className="h-5 w-5" /> Account Found!
                  </h4>
                  <p className="text-sm mt-1 text-green-800">
                    We found an existing account for this email. Enter your password above and click
                    &quot;Login &amp; Continue&quot; to securely upgrade to a Partner.
                  </p>
                </div>
              )}
            </div>

            <Button
              type="button"
              onClick={handleNextOrLogin}
              disabled={checkingEmail || isLoggingIn}
              className="w-full h-12 font-bold mt-4"
            >
              {isLoggingIn ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              {emailExists && !currentUser
                ? 'Login & Continue'
                : 'Next: Select Back-Office Tier'}
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            {/* Tier Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900">
                <CreditCard className="h-5 w-5 text-primary" />
                Step 2: Choose Your Practice Back-Office Tier
              </h3>

              <div className="grid grid-cols-1 gap-3">
                {(['starter', 'practice', 'enterprise'] as NormalizedPartnerTier[]).map(
                  (tierKey) => {
                    const plan = PARTNER_TIER_PLANS[tierKey];
                    const isSelected = selectedTier === tierKey;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => form.setValue('tier', plan.id)}
                        className={cn(
                          'p-4 rounded-xl border-2 transition-all cursor-pointer select-none',
                          isSelected
                            ? 'bg-primary/5 border-primary shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={cn(
                                'h-5 w-5 rounded-full border-2 flex items-center justify-center',
                                isSelected
                                  ? 'border-primary bg-primary text-white'
                                  : 'border-slate-300'
                              )}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                            <span className="font-bold text-base text-slate-900">{plan.name}</span>
                            <Badge variant={isSelected ? 'default' : 'secondary'} className="text-xs">
                              {plan.discountPercent}% Service Discount
                            </Badge>
                          </div>
                          <div className="font-black text-base text-slate-900">
                            {plan.monthlyPrice === 0
                              ? 'R0 / month'
                              : `R${plan.monthlyPrice.toLocaleString('en-ZA')} / month`}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5 pl-7">
                          {plan.aiCompanyLabel} • {plan.aiPayrollLabel} • {plan.staffSeatLabel} •
                          Practice Task Manager
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            <Separator />

            {/* Optional Overflow Work */}
            <div className="space-y-4">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Overflow Work Program (Optional)
              </h3>
              <FormField
                control={form.control}
                name="wantsOutsourcedWork"
                render={({ field }) => (
                  <FormItem className="flex flex-col space-y-3 rounded-md border p-4 bg-muted/20">
                    <div className="flex flex-row items-start space-x-3">
                      <FormControl>
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-bold cursor-pointer">
                          Apply to receive overflow accounting & compliance work from My Accountant?
                        </FormLabel>
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                          If you are a qualified member of a professional body, we can assign overflow client projects to your practice.
                        </p>
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {wantsOutsourcedWork && (
                <div className="space-y-6 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cv"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Upload Professional CV (PDF)</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept=".pdf"
                              onChange={(e) => field.onChange(e.target.files)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="certificate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">
                            Professional Certificate / Membership Proof
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept=".pdf,.jpg,.png"
                              onChange={(e) => field.onChange(e.target.files)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="designations"
                    render={({ field: parentField }) => (
                      <FormItem>
                        <div className="mb-2">
                          <FormLabel className="text-base">Professional Designations</FormLabel>
                          <p className="text-xs text-muted-foreground mt-1">
                            Select all designations that apply to you.
                          </p>
                        </div>
                        <div className="space-y-3 max-h-48 overflow-y-auto p-4 border rounded-lg bg-white mb-6">
                          {[
                            'CA(SA) – Chartered Accountant (South Africa)',
                            'AGA(SA) – Associate General Accountant',
                            'AT(SA) – Accounting Technician',
                            'BAP(SA) – Business Accountant in Practice',
                            'CBA(SA) – Chartered Business Accountant (SA)',
                            'CBP(SA) – Chartered Business Professional',
                            'Professional Accountant (SA)',
                            'Professional Tax Practitioner (SA)',
                            'Master Tax Practitioner (SA)',
                            'General Tax Practitioner',
                            'Registered Tax Practitioner',
                            'Registered Auditor (RA)',
                            'ACMA / CGMA',
                            'CFA Charterholder',
                            'ACCA',
                          ].map((designation) => (
                            <div
                              key={designation}
                              className="flex flex-row items-center space-x-3 space-y-0"
                            >
                              <Checkbox
                                id={`designation-${designation.replace(/\s+/g, '-').toLowerCase()}`}
                                checked={parentField.value?.includes(designation)}
                                onCheckedChange={(checked) => {
                                  const current = parentField.value || [];
                                  const updated = checked
                                    ? [...current, designation]
                                    : current.filter((val) => val !== designation);
                                  parentField.onChange(updated);
                                }}
                              />
                              <Label
                                htmlFor={`designation-${designation
                                  .replace(/\s+/g, '-')
                                  .toLowerCase()}`}
                                className="font-normal text-xs cursor-pointer leading-tight"
                              >
                                {designation}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="capableServices"
                    render={({ field: parentField }) => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-base">Service Expertise</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Select services you are qualified to handle for the network.
                          </p>
                        </div>
                        <div className="space-y-4 max-h-60 overflow-y-auto p-4 border rounded-lg bg-white">
                          {isServicesLoading ? (
                            <div
                              role="status"
                              aria-live="polite"
                              aria-busy="true"
                              className="flex justify-center py-4"
                            >
                              <Loader2
                                className="h-6 w-6 animate-spin text-primary"
                                aria-hidden="true"
                              />
                              <span className="sr-only">Loading…</span>
                            </div>
                          ) : (
                            categorizedServices.map((category) => (
                              <div key={category.id}>
                                <h4 className="font-bold text-[10px] uppercase text-primary mb-3 tracking-widest">
                                  {category.name}
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                  {category.services.map((service) => (
                                    <div
                                      key={service.id}
                                      className="flex flex-row items-center space-x-3 space-y-0"
                                    >
                                      <Checkbox
                                        id={`check-${service.id}`}
                                        checked={parentField.value?.includes(service.id)}
                                        onCheckedChange={(checked) => {
                                          const current = parentField.value || [];
                                          const updated = checked
                                            ? [...current, service.id]
                                            : current.filter((val) => val !== service.id);
                                          parentField.onChange(updated);
                                        }}
                                      />
                                      <Label
                                        htmlFor={`check-${service.id}`}
                                        className="font-normal text-xs cursor-pointer leading-tight"
                                      >
                                        {service.title}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white flex justify-between items-center font-bold text-base shadow-inner">
              <div>
                <div>{selectedPlan.name} Tier Subscription</div>
                <div className="text-xs font-normal text-slate-300">
                  {selectedPlan.discountPercent}% wholesale discount • {selectedPlan.aiCompanyLabel}
                </div>
              </div>
              <span className="text-xl text-emerald-400 font-black">
                {selectedPlan.monthlyPrice === 0
                  ? 'R0.00'
                  : `R${selectedPlan.monthlyPrice.toLocaleString('en-ZA')}/pm`}
              </span>
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
                        I agree to the{' '}
                        <Link href="/terms" className="underline font-bold" target="_blank">
                          terms and conditions
                        </Link>{' '}
                        and approve the selected practice tier.
                      </FormLabel>
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="w-1/3 h-12 font-bold"
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                type="submit"
                className="w-2/3 h-12 text-base font-black shadow-xl"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading
                  ? 'Processing...'
                  : selectedPlan.monthlyPrice === 0
                  ? 'Complete Free Registration'
                  : `Continue to PayFast (R${selectedPlan.monthlyPrice.toLocaleString('en-ZA')}/pm)`}
              </Button>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
