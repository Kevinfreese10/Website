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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAuth, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, orderBy, where, serverTimestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { useState, useEffect, useMemo } from 'react';
import { Loader2, Briefcase, CheckCircle2, UserPlus, Wallet2, CreditCard, Sparkles, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Service, Order } from '@/lib/types';
import { sendEmail } from '@/lib/email';
import { checkIfEmailExists } from '@/app/actions';
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
  slug: z.string().optional(),
  tier: z.literal('growth').default('growth'),
  wantsOutsourcedWork: z.boolean().default(false),
  cv: z.any().optional(),
  certificate: z.any().optional(),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: 'You must accept the terms and conditions.',
  }),
  designations: z.array(z.string()).optional(),
  capableServices: z.array(z.string()).optional(),
}).refine(data => {
    if (data.wantsOutsourcedWork) {
      return data.cv?.[0] && data.certificate?.[0];
    }
    return true;
}, {
    message: 'CV and Certificate are required to be considered for outsourced work.',
    path: ['wantsOutsourcedWork'],
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
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [isServicesLoading, setIsServicesLoading] = useState(true);



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
          } catch (err) {
              setEmailExists(null);
          } finally {
              setCheckingEmail(false);
          }
      };

      const timer = setTimeout(checkEmail, 600);
      return () => clearTimeout(timer);
  }, [currentEmail]);

  // Update email if currentUser changes after initial render
  useEffect(() => {
      if (currentUser?.email) {
          form.setValue('email', currentUser.email);
      }
  }, [currentUser, form]);

  const selectedTier = form.watch('tier');
  const companyName = form.watch('companyName');

  useEffect(() => {
    const fetchServicesAndCategories = async () => {
        setIsServicesLoading(true);
        try {
            const servicesQuery = query(collection(db, "services"), orderBy("title"));
            const servicesSnapshot = await getDocs(servicesQuery);
            const fetchedServices = servicesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Service));
            setAllServices(fetchedServices);

            const categoriesQuery = query(collection(db, "categories"), orderBy("order"));
            const categoriesSnapshot = await getDocs(categoriesQuery);
            const fetchedCategories = categoriesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Category));
            setAllCategories(fetchedCategories);

        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsServicesLoading(false);
        }
    };
    fetchServicesAndCategories();
  }, []);

  const categorizedServices = useMemo(() => {
    if (!allCategories.length || !allServices.length) return [];
    return allCategories
      .map(category => ({
        ...category,
        services: allServices.filter(service => service.category === category.name),
      }))
      .filter(category => category.services.length > 0);
  }, [allCategories, allServices]);

  const wantsOutsourcedWork = form.watch('wantsOutsourcedWork');

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, file);
    return await getDownloadURL(fileRef);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
        const { password, cv, certificate, ...partnerData } = values;

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
            
            // Set profile display name (naturally delays execution to prevent Firestore auth state race conditions)
            await updateProfile(newFirebaseUser, { displayName: `${values.name} ${values.surname}` });
        }
        
        let cvUrl = '';
        let certificateUrl = '';

        if (values.wantsOutsourcedWork && values.cv?.[0] && values.certificate?.[0]) {
            toast({ title: 'Uploading Documents...', description: 'Please wait while we upload your files.' });
            cvUrl = await uploadFile(values.cv[0], `partner-applications/${authUid}/cv-${values.cv[0].name}`);
            certificateUrl = await uploadFile(values.certificate[0], `partner-applications/${authUid}/certificate-${values.certificate[0].name}`);
        }
        
        const contactPersonFullName = `${values.name} ${values.surname}`;

        // 2. Create the User Document
        const newUserDocRef = doc(db, "users", authUid);
        
        const periodEndDate = new Date('2099-12-31');

        await setDoc(newUserDocRef, {
            ...partnerData,
            contactPerson: contactPersonFullName,
            name: contactPersonFullName,
            id: authUid,
            uid: authUid,
            role: 'partner',
            partnerTier: 'growth',
            status: 'Active', 
            creditBalance: 0,
            createdAt: serverTimestamp(),
            cvUrl: cvUrl,
            certificateUrl: certificateUrl,
            landingPage: {
                enabled: false,
                slug: '',
                companyName: values.companyName,
            },
            partnerSubscription: {
                status: 'active',
                currentPeriodEnd: Timestamp.fromDate(periodEndDate),
                aiCompanyLimit: 0,
                aiPayrollLimit: 0,
                staffSeatLimit: 1,
                hasTaskManager: false,
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

        toast({
            title: 'Welcome to My Accountant!',
            description: `Your partner account has been created successfully.`,
        });
        router.push('/partner/dashboard');

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

  const handleNextOrLogin = async () => {
      const fieldsToValidate: any = ['companyName', 'name', 'surname', 'email'];
      if (!currentUser) fieldsToValidate.push('password', 'contactNumber');
      
      const isValid = await form.trigger(fieldsToValidate);
      if (isValid) {
          if (emailExists && !currentUser) {
              // Perform Login
              setIsLoggingIn(true);
              try {
                  const values = form.getValues();
                  const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password || '');
                  
                  // Successfully logged in! Now pull their data to pre-fill the form.
                  const userDocRef = doc(db, 'users', userCredential.user.uid);
                  const userDoc = await getDoc(userDocRef);
                  if (userDoc.exists()) {
                      const data = userDoc.data();
                      if (data.name) form.setValue('name', data.name.split(' ')[0]);
                      if (data.surname) form.setValue('surname', data.surname || data.name.split(' ')[1] || '');
                      if (data.companyName) form.setValue('companyName', data.companyName);
                      if (data.contactNumber) form.setValue('contactNumber', data.contactNumber);
                  }

                  toast({ title: 'Logged In Successfully!', description: 'Your account was found. Please continue completing your Partner Profile.' });
                  setStep(2);
              } catch (error: any) {
                  console.error('Login failed:', error);
                  toast({ title: 'Login Failed', description: 'Incorrect password for this email address. Please try again.', variant: 'destructive' });
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
                        <FormField control={form.control} name="email" render={({ field }) => ( 
                            <FormItem>
                                <FormLabel>Login Email Address</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input placeholder="john@acme.co.za" {...field} disabled={!!currentUser} />
                                        {checkingEmail && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground absolute right-3 top-2.5" />}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        {!currentUser && (
                            <FormField control={form.control} name="password" render={({ field }) => ( 
                                <FormItem>
                                    <FormLabel>{emailExists ? 'Enter Existing Password' : 'Create Password'}</FormLabel>
                                    <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}
                        <FormField control={form.control} name="companyName" render={({ field }) => ( <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input placeholder="Acme Consulting" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="contactNumber" render={({ field }) => ( <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input placeholder="082 123 4567" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Contact First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="surname" render={({ field }) => ( <FormItem><FormLabel>Contact Surname</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    {emailExists && !currentUser && (
                        <div className="bg-green-50 border border-green-200 border-l-4 border-l-green-600 text-green-900 p-4 rounded-md my-4 animate-in fade-in zoom-in-95 shadow-sm">
                            <h4 className="font-bold flex items-center gap-2 text-green-700 text-base"><UserPlus className="h-5 w-5" /> Account Found!</h4>
                            <p className="text-sm mt-1 text-green-800">We found an existing account for this email. Enter your password above and click "Login & Continue" to securely upgrade to a Partner.</p>
                        </div>
                    )}
                </div>

                <Button type="button" onClick={handleNextOrLogin} disabled={checkingEmail || isLoggingIn} className="w-full h-12 font-bold mt-4">
                    {isLoggingIn ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                    {emailExists && !currentUser ? 'Login & Continue' : 'Next: Overflow Work & Summary'}
                </Button>
            </div>
        )}

        {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        Step 2: Overflow Work & Capabilities (Optional)
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
                                            Apply for the Overflow Work Program?
                                        </FormLabel>
                                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                                            We regularly have more work than our team can handle. If you are a member of a professional body, we can outsource overflow projects to your practice at wholesale rates.
                                        </p>
                                    </div>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {wantsOutsourcedWork && (
                        <div className="space-y-6 pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="cv"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Upload Professional CV (PDF)</FormLabel>
                                            <FormControl>
                                                <Input type="file" accept=".pdf" onChange={(e) => field.onChange(e.target.files)} />
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
                                            <FormLabel className="text-xs">Professional Certificate / Membership Proof</FormLabel>
                                            <FormControl>
                                                <Input type="file" accept=".pdf,.jpg,.png" onChange={(e) => field.onChange(e.target.files)} />
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
                                            <p className="text-xs text-muted-foreground mt-1">Select all designations that apply to you.</p>
                                        </div>
                                        <div className="space-y-3 max-h-48 overflow-y-auto p-4 border rounded-lg bg-white mb-6">
                                            {[
                                                "CA(SA) – Chartered Accountant (South Africa)",
                                                "AGA(SA) – Associate General Accountant",
                                                "AT(SA) – Accounting Technician",
                                                "BAP(SA) – Business Accountant in Practice",
                                                "CBA(SA) – Chartered Business Accountant (SA)",
                                                "CBP(SA) – Chartered Business Professional",
                                                "Professional Accountant (SA)",
                                                "Professional Tax Practitioner (SA)",
                                                "Master Tax Practitioner (SA)",
                                                "General Tax Practitioner",
                                                "Registered Tax Practitioner",
                                                "Registered Auditor (RA)",
                                                "ACMA / CGMA",
                                                "CFA Charterholder",
                                                "ACCA"
                                            ].map((designation) => (
                                                <div key={designation} className="flex flex-row items-center space-x-3 space-y-0">
                                                    <Checkbox
                                                        id={`designation-${designation.replace(/\s+/g, '-').toLowerCase()}`}
                                                        checked={parentField.value?.includes(designation)}
                                                        onCheckedChange={(checked) => {
                                                            const current = parentField.value || [];
                                                            const updated = checked
                                                                ? [...current, designation]
                                                                : current.filter(val => val !== designation);
                                                            parentField.onChange(updated);
                                                        }}
                                                    />
                                                    <Label htmlFor={`designation-${designation.replace(/\s+/g, '-').toLowerCase()}`} className="font-normal text-xs cursor-pointer leading-tight">
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
                                                <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                                            ) : (
                                                categorizedServices.map(category => (
                                                    <div key={category.id}>
                                                        <h4 className="font-bold text-[10px] uppercase text-primary mb-3 tracking-widest">{category.name}</h4>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                                            {category.services.map((service) => (
                                                                <div key={service.id} className="flex flex-row items-center space-x-3 space-y-0">
                                                                    <Checkbox
                                                                        id={`check-${service.id}`}
                                                                        checked={parentField.value?.includes(service.id)}
                                                                        onCheckedChange={(checked) => {
                                                                            const current = parentField.value || [];
                                                                            const updated = checked
                                                                                ? [...current, service.id]
                                                                                : current.filter(val => val !== service.id);
                                                                            parentField.onChange(updated);
                                                                        }}
                                                                    />
                                                                    <Label htmlFor={`check-${service.id}`} className="font-normal text-xs cursor-pointer leading-tight">
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

                <Separator />

                <div className="space-y-4">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Plan Summary
                    </h3>
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-sm">Partner Program Base Access</span>
                                <span className="font-black text-md text-primary">Free / R0</span>
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                                Includes partner community chat, 10% wholesale discount, and outsourcing backend access.
                            </div>
                            <div className="flex justify-between items-center border-t border-primary/20 pt-2 font-bold text-sm">
                                <span>Total Due Today</span>
                                <span>R0.00</span>
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
                                        I agree to the <Link href="/terms" className="underline font-bold" target="_blank">terms and conditions</Link> and approve the plan.
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
                        {isLoading ? 'Creating Account...' : 'Complete Registration'}
                    </Button>
                </div>
            </div>
        )}
      </form>
    </Form>
  );
}
