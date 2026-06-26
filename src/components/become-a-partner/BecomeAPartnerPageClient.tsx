'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Rocket, ShieldCheck, Wallet, Bot, Cpu, Briefcase, Users, FileText, GraduationCap, CheckCircle2, ArrowRight, LayoutDashboard, LifeBuoy, Percent, TrendingUp, ShieldAlert, ClipboardList, ShoppingBag, CheckCircle, Globe, Scale, Loader2, ExternalLink, BadgeDollarSign, XCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import dynamicImport from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { saveDemoLead } from '@/app/actions';
import { getFirestore, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Service } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

const TrustIndexWidget = dynamicImport(() => import('@/components/shared/TrustIndexWidget'), {
  ssr: false,
});

const db = getFirestore(firebaseApp);

function PartnerPricingDialog() {
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const fetchPricing = async () => {
        setIsLoading(true);
        try {
            const q = query(collection(db, "services"), orderBy("title"));
            const snap = await getDocs(q);
            setServices(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as Service)));
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) fetchPricing();
    }, [isOpen]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-ZA', {
          style: 'currency',
          currency: 'ZAR',
        }).format(price);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <button className="text-primary font-bold text-xs flex items-center gap-1 mt-2 hover:underline ml-8 animate-in fade-in">
                    View Partner Pricing <ExternalLink className="h-3 w-3" />
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 bg-slate-50 border-b shrink-0">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <BadgeDollarSign className="h-6 w-6 text-primary" />
                        Wholesale Partner Pricing
                    </DialogTitle>
                    <DialogDescription>
                        Practice members receive wholesale discounts: 5% off on Community Free, and 25% off on Growth.
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex-grow overflow-hidden px-6 py-2 bg-white">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm font-medium text-muted-foreground">Fetching latest rates...</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-full pr-4">
                            <div className="border rounded-lg overflow-hidden my-4">
                                <Table>
                                    <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead className="w-[40%]">Service Description</TableHead>
                                            <TableHead className="text-right">Retail Price</TableHead>
                                            <TableHead className="text-right text-foreground/80">Free Partner (5% Off)</TableHead>
                                            <TableHead className="text-right text-primary">Growth Partner (25% Off)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {services.filter(s => !s.isPriceTbc).map((service) => (
                                            <TableRow key={service.id}>
                                                <TableCell className="font-medium text-xs sm:text-sm">{service.title}</TableCell>
                                                <TableCell className="text-right text-xs opacity-50 line-through">{formatPrice(service.price)}</TableCell>
                                                <TableCell className="text-right font-medium text-foreground/80 text-xs sm:text-sm">{formatPrice(service.price * 0.95)}</TableCell>
                                                <TableCell className="text-right font-bold text-primary text-xs sm:text-sm">{formatPrice(service.resellerPrice || service.price * 0.75)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </ScrollArea>
                    )}
                </div>
                <DialogFooter className="p-4 bg-muted/30 border-t shrink-0 sm:justify-between items-center">
                    <p className="text-[10px] text-muted-foreground italic px-4">
                        * Prices exclude 3rd party statutory costs (e.g. CIPC fees) which are passed through at cost.
                    </p>
                    <Button onClick={() => setIsOpen(false)}>Close List</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const demoFormSchema = z.object({
  name: z.string().min(2, "First name is required."),
  surname: z.string().min(2, "Surname is required."),
  email: z.string().email("A valid email is required."),
  cell: z.string().min(10, "A valid cell number is required."),
});

function BookDemoDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    
    const form = useForm<z.infer<typeof demoFormSchema>>({
        resolver: zodResolver(demoFormSchema),
        defaultValues: { name: '', surname: '', email: '', cell: '' },
    });

    const onSubmit = async (values: z.infer<typeof demoFormSchema>) => {
        setIsLoading(true);
        try {
            const res = await saveDemoLead(values);
            if (res.success) {
                toast({ title: "Request Sent!", description: "A consultant will contact you shortly to schedule your demo." });
                setIsOpen(false);
                form.reset();
            } else {
                toast({ title: "Submission Failed", variant: "destructive" });
            }
        } catch (e) {
            toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="lg" className="h-14 px-10 text-lg border-2 border-slate-200">
                    Book a demo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Book a Live Demo</DialogTitle>
                    <DialogDescription>
                        Enter your details and our team will reach out to schedule a personalized walkthrough of the BEI platform.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>First Name</FormLabel><FormControl><Input placeholder="John" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="surname" render={({ field }) => ( <FormItem><FormLabel>Surname</FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        </div>
                        <FormField control={form.control} name="email" render={({ field }) => ( <FormItem><FormLabel>Work Email</FormLabel><FormControl><Input type="email" placeholder="john@practice.co.za" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="cell" render={({ field }) => ( <FormItem><FormLabel>Cell Number</FormLabel><FormControl><Input placeholder="082 123 4567" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        
                        <Button type="submit" className="w-full h-12 text-md font-bold mt-4" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Request Demo
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

const featureBenefits = [
    {
        icon: Percent,
        feature: 'Wholesale Partner Discount',
        benefit: 'Increase your profit margins instantly. Buy services at wholesale rates (5% discount on Free tier, 25% discount on Growth tier) and sell at retail prices.',
        showPricing: true,
    },
    {
        icon: LayoutDashboard,
        feature: 'White-Label Dashboard',
        benefit: 'Manage your entire practice, staff, and client workflows from a single secure portal that carries your branding, not ours.',
    },
    {
        icon: Globe,
        feature: 'Custom Practice Landing Page',
        benefit: 'Get a 24/7 online store with 50+ re-branded services. Let your clients browse, order, and pay while you sleep.',
    },
    {
        icon: Users,
        feature: 'Elastic Outsourcing Capacity',
        benefit: 'Never say "no" to a complex project again. Confidently scale your business capacity by leveraging our expert backend team.',
    },
    {
        icon: GraduationCap,
        feature: 'Onboarding & Professional Support',
        benefit: 'Full setup, training, and direct access to senior Chartered Accountants and tax experts to help you navigate complex technical hurdles.',
    },
    {
        icon: ClipboardList,
        feature: 'Automated Compliance Roadmap',
        benefit: 'Never miss a SARS or CIPC deadline again. The system automatically monitors your client requirements and creates tasks for your team.',
    },
    {
        icon: FileText,
        feature: 'Professional Template Library',
        benefit: 'Save hundreds of hours with ready-to-use, legally compliant engagement letters, contracts, and pricing schedules.',
    },
    {
        icon: Scale,
        feature: 'Flexible Pricing Control',
        benefit: 'Total control over your client-facing prices. Set your own markup on services while our underlying wholesale cost remains fixed.',
    },
];

const challenges = [
    {
        title: 'Limited Service Range',
        description: 'Offering only bookkeeping services limits your earning potential. Sell our full suite — from company registration to VAT, COIDA, CIDB, NCR, and more.',
        icon: Briefcase
    },
    {
        title: 'Lack of Mentorship',
        description: 'Many bookkeepers work alone. We provide mentorship from senior accountants and industry experts who help you grow your capabilities.',
        icon: GraduationCap
    },
    {
        title: 'Technology Gaps',
        description: 'Without proper systems, document management is messy. Get our cloud-based dashboard to manage and outsource client orders seamlessly.',
        icon: Cpu
    },
    {
        title: 'Manual Sales & Quoting',
        description: 'Quoting manually and chasing EFTs is a time-sink. Your white-labeled online store automates sales, PayFast, and document collection.',
        icon: ShoppingBag
    },
    {
        title: 'Capacity Constraints',
        description: 'Handling large clients alone isn’t easy. Our qualified team handles your overflow work securely, accurately, and on time.',
        icon: Users
    },
    {
        title: 'Compliance Overwhelm',
        description: 'Advanced statutory rules can be deterring. We provide ready-to-use templates and guides to help you stay compliant and confident.',
        icon: ShieldAlert
    }
];

const faqs = [
    {
        question: "How does the outsourcing work?",
        answer: "You can decide to complete the order yourself or outsource to us. The process is completely white-labeled, so your client doesn't know the work is being outsourced. We charge you a fixed wholesale price (5% discount for Free partners, 25% discount for Growth partners), and you keep the markup."
    },
    {
        question: "Is there a setup fee?",
        answer: "No, joining the Bookkeeper Empowerment Initiative is completely free on our base tier. If you choose the Growth tier, there are no upfront setup fees either — only the R950/month subscription."
    },
    {
        question: "How much does the Growth tier cost?",
        answer: "The Growth tier costs R950/month. This unlocks your custom practice landing page, chatbot, task manager, and up to 3 staff seats with granular permissions."
    },
    {
        question: "What happens to existing R4,950 partners?",
        answer: "Existing partners who previously paid the R4,950 once-off fee are grandfathered onto the Growth tier free of charge for 3 months. After that, they can transition to the partner-only subscription of R950/month."
    },
    {
        question: "Do I need to be a registered accountant?",
        answer: "Anyone can join the BEI to use the software and manage their own clients. However, to receive outsourced overflow work from the My Accountant network, you must be a registered member in good standing with a recognized professional body (SAICA, SAIT, CIBA, or SAIPA)."
    }
];

export default function BecomeAPartnerPageClient() {
  return (
    <div className="space-y-16 pb-16 bg-background relative overflow-hidden">
      <section className="relative overflow-hidden bg-background">
        {/* Aurora background blobs */}
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="aurora-blob aurora-blue w-[300px] h-[300px] bottom-0 left-1/3 animate-aurora-drift" style={{ animationDelay: '-10s' }} />
        {/* Dot grid overlay */}
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <div className="absolute top-10 left-10"><Bot size={120} /></div>
            <div className="absolute bottom-10 right-10"><Wallet size={120} /></div>
        </div>
        <div className="container mx-auto px-4 py-20 text-center relative z-10">
            <h1 className="text-4xl font-black tracking-tight md:text-6xl lg:text-7xl text-foreground">
                10X Your Practice — <span className="text-gradient">Without Hiring More Staff.</span>
            </h1>
            <p className="mt-6 text-xl text-foreground/80 max-w-4xl mx-auto font-medium leading-relaxed">
                Never lose a client because you lack capacity, specialised expertise, or time. With the Bookkeeper Empowerment Initiative (BEI), you can confidently outsource complex work while keeping full control of the client relationship and growing your revenue.
            </p>
            <p className="mt-6 text-2xl font-bold text-foreground/90 uppercase tracking-tighter">Expand your services. Protect your clients. Scale your practice.</p>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">Pricing Plans</Badge>
                <h2 className="text-4xl md:text-5xl font-black leading-tight text-foreground">Choose the Plan for Your Practice</h2>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                    Get started for free to access our community and jobs, or upgrade to Growth for a complete, white-labeled practice backend.
                </p>
            </div>
            
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                {/* Free Tier */}
                <Card className="glass-card border shadow-lg overflow-hidden flex flex-col justify-between">
                    <div>
                        <CardHeader className="bg-slate-50/50 border-b p-8 text-center">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-500 font-bold">Community Free</CardTitle>
                            <div className="mt-4 flex items-baseline justify-center gap-1">
                                <span className="text-2xl font-bold text-foreground">R</span>
                                <span className="text-7xl font-black text-foreground">0</span>
                                <span className="text-lg text-muted-foreground">/mo</span>
                            </div>
                            <p className="mt-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">Perfect for getting started</p>
                        </CardHeader>
                        <CardContent className="p-8 space-y-4">
                            <ul className="space-y-3">
                                {[
                                    'Access the Partner Community',
                                    'Access Outsourced Overflow Jobs',
                                    '5% Wholesale outsourcing discount',
                                    'Direct client billing dashboard'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                                        <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0" />
                                        {item}
                                    </li>
                                ))}
                                {[
                                    'Practice Landing Page',
                                    'AI Accountant & Payroll Companies',
                                    'Interactive Chatbot',
                                    'Staff Management & seats',
                                    'Task & Kanban Manager'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm font-medium text-slate-400 line-through opacity-70">
                                        <CheckCircle2 className="h-4.5 w-4.5 text-slate-300 shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </div>
                    <CardFooter className="p-8 bg-slate-50/50 border-t flex flex-col gap-3">
                        <Button asChild variant="outline" size="lg" className="w-full h-12 text-md font-bold">
                            <Link href="/partner-signup?tier=free">Join Free</Link>
                        </Button>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest text-center">No credit card required</p>
                    </CardFooter>
                </Card>

                {/* Growth Tier */}
                <Card className="glass-card border-2 border-primary shadow-2xl overflow-hidden flex flex-col justify-between relative transform md:scale-105">
                    <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-lg">
                        Most Popular
                    </div>
                    <div>
                        <CardHeader className="bg-primary/5 border-b p-8 text-center">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-primary font-bold">Growth Partner</CardTitle>
                            <div className="mt-4 flex items-baseline justify-center gap-1">
                                <span className="text-2xl font-bold text-foreground">R</span>
                                <span className="text-7xl font-black text-foreground">950</span>
                                <span className="text-lg text-muted-foreground">/mo</span>
                            </div>
                            <p className="mt-2 text-xs font-bold text-primary uppercase tracking-wider">All-in-one practice backend</p>
                        </CardHeader>
                        <CardContent className="p-8 space-y-4">
                            <ul className="space-y-3">
                                {[
                                    'Everything in Community Free',
                                    'Custom Practice Landing Page (Domain linked)',
                                    '1 to 5 AI Accountant Companies',
                                    '1 to 5 AI Payroll Companies',
                                    'Interactive Client Chatbot',
                                    'Task & Workflow Manager',
                                    '3 Staff Seats (Owner + 2 staff)',
                                    'Granular staff permission controls',
                                    '25% Wholesale outsourcing discount'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                                        <CheckCircle2 className="h-4.5 w-4.5 text-primary shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </div>
                    <CardFooter className="p-8 bg-slate-50/50 border-t flex flex-col gap-3">
                        <Button asChild size="lg" className="w-full h-12 text-md font-bold shadow-md">
                            <Link href="/partner-signup?tier=growth">Start 14-Day Free Trial</Link>
                        </Button>
                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest text-center">Cancel anytime • Secure PayFast checkout</p>
                    </CardFooter>
                </Card>
            </div>

            {/* Detailed Feature Comparison */}
            <div className="max-w-5xl mx-auto mt-20 animate-in fade-in duration-500">
                <div className="text-center mb-10">
                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">Detailed Plan Comparison</h3>
                    <p className="text-sm text-muted-foreground mt-1">Compare the specific features and workflows of each tier</p>
                </div>
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xl">
                    <Table>
                        <TableHeader className="bg-slate-50/70 border-b">
                            <TableRow>
                                <TableHead className="w-[40%] font-black text-foreground/90 uppercase tracking-wider text-xs">Feature / Capability</TableHead>
                                <TableHead className="font-black text-slate-600 text-center uppercase tracking-wider text-xs">Community Free</TableHead>
                                <TableHead className="font-black text-primary text-center uppercase tracking-wider text-xs">Growth Partner</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y">
                            <TableRow>
                                <TableCell className="font-semibold text-foreground py-4">Monthly Subscription</TableCell>
                                <TableCell className="text-center font-bold text-foreground/80 py-4">R0 / month</TableCell>
                                <TableCell className="text-center font-black text-primary py-4">R950 / month</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="py-4">
                                    <div className="font-semibold text-foreground">Wholesale Discount</div>
                                    <div className="text-[10px] text-muted-foreground">Discount on all outsourced client services</div>
                                </TableCell>
                                <TableCell className="text-center font-semibold text-slate-600 py-4">5% Discount</TableCell>
                                <TableCell className="text-center font-bold text-primary py-4">25% Discount</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="py-4">
                                    <div className="font-semibold text-foreground">Service Pricing & Markup</div>
                                    <div className="text-[10px] text-muted-foreground">Ability to set your own retail prices for clients</div>
                                </TableCell>
                                <TableCell className="text-center text-xs text-slate-500 py-4">Fixed Wholesale Rates Only</TableCell>
                                <TableCell className="text-center text-xs font-semibold text-foreground/90 py-4">Fully Customizable Markup</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="py-4">
                                    <div className="font-semibold text-foreground">Order Billing Workflow</div>
                                    <div className="text-[10px] text-muted-foreground">How orders are processed and paid for</div>
                                </TableCell>
                                <TableCell className="text-center text-xs text-slate-500 py-4">Pay-As-You-Order (Direct to PayFast)</TableCell>
                                <TableCell className="text-center text-xs font-semibold text-foreground/90 py-4">Generate Client Invoices & EFT Links</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="py-4">
                                    <div className="font-semibold text-foreground">Order Fulfillment</div>
                                    <div className="text-[10px] text-muted-foreground">Who completes the professional services</div>
                                </TableCell>
                                <TableCell className="text-center text-xs text-slate-500 py-4">Auto-Outsourced to My Accountant</TableCell>
                                <TableCell className="text-center text-xs font-semibold text-foreground/90 py-4">Choose to Do Internally or Outsource</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="py-4">
                                    <div className="font-semibold text-foreground">White-Label Landing Page</div>
                                    <div className="text-[10px] text-muted-foreground">Your own public practice website linked to a custom slug/domain</div>
                                </TableCell>
                                <TableCell className="py-4"><XCircle className="h-5 w-5 text-slate-300 mx-auto" /></TableCell>
                                <TableCell className="py-4"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="py-4">
                                    <div className="font-semibold text-foreground">Custom Branding (Logo & Themes)</div>
                                    <div className="text-[10px] text-muted-foreground">Upload your logo and apply custom color palettes</div>
                                </TableCell>
                                <TableCell className="py-4"><XCircle className="h-5 w-5 text-slate-300 mx-auto" /></TableCell>
                                <TableCell className="py-4"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="py-4">
                                    <div className="font-semibold text-foreground">Staff Seats Included</div>
                                    <div className="text-[10px] text-muted-foreground">Additional logins for your team or partners</div>
                                </TableCell>
                                <TableCell className="text-center font-medium text-slate-600 py-4">0 Staff Seats (Owner Only)</TableCell>
                                <TableCell className="text-center font-bold text-primary py-4">3 Seats (Owner + 2 Staff)</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="py-4">
                                    <div className="font-semibold text-foreground">Granular Staff Permissions</div>
                                    <div className="text-[10px] text-muted-foreground">Restrict team access to specific modules (e.g. financials)</div>
                                </TableCell>
                                <TableCell className="py-4"><XCircle className="h-5 w-5 text-slate-300 mx-auto" /></TableCell>
                                <TableCell className="py-4"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="py-4">
                                    <div className="font-semibold text-foreground">AI Accountant & Payroll Companies</div>
                                    <div className="text-[10px] text-muted-foreground">Automate compliance & calculations using AI tools</div>
                                </TableCell>
                                <TableCell className="text-center text-xs text-slate-500 py-4">Not Included</TableCell>
                                <TableCell className="text-center text-xs font-semibold text-foreground/90 py-4">5 Companies of Each Included</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="py-4">
                                    <div className="font-semibold text-foreground">Practice Workflow & Kanban</div>
                                    <div className="text-[10px] text-muted-foreground">Manage client tasks, deadlines, and internal projects</div>
                                </TableCell>
                                <TableCell className="py-4"><XCircle className="h-5 w-5 text-slate-300 mx-auto" /></TableCell>
                                <TableCell className="py-4"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="py-4">
                                    <div className="font-semibold text-foreground">Community & Overflow Job Pool</div>
                                    <div className="text-[10px] text-muted-foreground">Receive client requests and overflow work from the network</div>
                                </TableCell>
                                <TableCell className="py-4"><CheckCircle className="h-5 w-5 text-primary mx-auto" /></TableCell>
                                <TableCell className="py-4"><CheckCircle className="h-5 w-5 text-green-500 mx-auto" /></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <TrustIndexWidget />
      </div>

      <section className="container mx-auto px-4 scroll-m-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">Our Philosophy</Badge>
                <h2 className="text-4xl font-bold leading-tight text-foreground">Our philosophy has always been simple</h2>
                <p className="text-2xl font-bold text-foreground/90 italic">"A client referred to someone else is a client lost."</p>
            </div>
            
            <div className="space-y-6 text-lg text-muted-foreground leading-relaxed text-left sm:text-center">
                <p>
                    With the Bookkeeper Empowerment Initiative, you never have to send your client away because you lack capacity, specialised experience, or technical expertise.
                </p>
                <p>
                    Instead, you can confidently outsource the service through us — discreetly and professionally — while maintaining your client relationship.
                </p>
                
                <div className="flex flex-wrap justify-center gap-4 py-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full font-bold text-sm border border-green-100 shadow-sm">
                        <CheckCircle2 className="h-4 w-4" /> You stay in control
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full font-bold text-sm border border-green-100 shadow-sm">
                        <CheckCircle2 className="h-4 w-4" /> You keep the client
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full font-bold text-sm border border-green-100 shadow-sm">
                        <CheckCircle2 className="h-4 w-4" /> You protect your brand
                    </div>
                </div>

                <p className="font-bold text-foreground text-center text-xl">
                    We handle the complexity behind the scenes so your client never needs to move to another accountant.
                </p>
            </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">The Problem</Badge>
                <h2 className="text-4xl font-bold tracking-tight text-foreground">Challenges We Solve for Practitioners</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Running a practice shouldn't feel like a solo battle against paperwork.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {challenges.map((item, idx) => (
                    <Card key={idx} className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                        <CardHeader className="text-center pb-2">
                            <div className="mx-auto h-16 w-16 rounded-full bg-primary/5 border flex items-center justify-center mb-4">
                                <item.icon className="h-8 w-8 text-primary" />
                            </div>
                            <CardTitle className="text-xl font-bold text-foreground">{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-center">
                            <p className="text-sm text-muted-foreground leading-relaxed px-4">{item.description}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
      </section>
      
      <section id="benefits" className="bg-white py-24 border-t border-b scroll-m-20">
        <div className="container mx-auto px-4">
            <div className="text-center mb-16">
                <h2 className="text-4xl font-bold tracking-tight text-foreground">Features vs Benefits</h2>
                <p className="text-muted-foreground mt-4 max-w-2xl mx-auto text-lg">A powerful back-office engine for your accounting firm, designed for maximum results.</p>
            </div>
            
            <div className="max-w-5xl mx-auto border rounded-2xl overflow-hidden shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 bg-slate-100 border-b border-slate-200 text-foreground/90 font-black uppercase tracking-widest text-[10px]">
                    <div className="p-4 border-r border-slate-200 hidden md:block">The Platform Feature</div>
                    <div className="p-4 hidden md:block">The Business Benefit</div>
                </div>
                <div className="divide-y divide-slate-100">
                    {featureBenefits.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-1 md:grid-cols-2 group hover:bg-slate-50 transition-colors">
                            <div className="p-6 md:border-r border-slate-100 space-y-2">
                                <span className="md:hidden text-[10px] font-black uppercase text-primary tracking-widest block mb-2">Feature</span>
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 shadow-sm">
                                        <item.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <h3 className="font-bold text-lg text-foreground leading-tight">{item.feature}</h3>
                                </div>
                            </div>
                            <div className="p-6 bg-white group-hover:bg-transparent transition-colors flex flex-col justify-center items-start">
                                <span className="md:hidden text-[10px] font-black uppercase text-green-600 tracking-widest block mb-2">The Benefit to You</span>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">{item.benefit}</p>
                                </div>
                                {item.showPricing && <PartnerPricingDialog />}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl py-12">
         <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
        </div>
         <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left font-semibold hover:no-underline">{faq.question}</AccordionTrigger>
                <AccordionContent className="whitespace-pre-line text-muted-foreground leading-relaxed text-base">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
      </section>
      
      <section className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-4xl font-bold tracking-tight text-foreground">Ready to Empower Your Practice?</h2>
            <p className="text-xl text-muted-foreground">
                Choose the plan that fits your practice size and start onboarding today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="h-14 px-10 text-lg font-bold shadow-lg">
                    <Link href="/partner-signup?tier=growth">Register Growth Plan</Link>
                </Button>
                <BookDemoDialog />
            </div>
        </div>
      </section>
    </div>
  );
}
