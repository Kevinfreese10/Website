'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Rocket, ShieldCheck, Wallet, Bot, Cpu, Briefcase, Users, FileText, GraduationCap, CheckCircle2, ArrowRight, LayoutDashboard, LifeBuoy, Percent, TrendingUp, ShieldAlert, ClipboardList, ShoppingBag, CheckCircle, Globe, Scale, Loader2, ExternalLink, BadgeDollarSign, XCircle, MessageSquare } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import dynamicImport from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';

import { getFirestore, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Service } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

const TrustIndexWidget = dynamicImport(() => import('@/components/shared/TrustIndexWidget'), {
  ssr: false,
});

const CommunityCarouselWidget = dynamicImport(() => import('@/components/become-a-partner/CommunityCarouselWidget'), {
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
                        Practice members receive a 10% wholesale discount on all services.
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
                                            <TableHead className="text-right text-primary">Partner Price (10% Off)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {services.filter(s => !s.isPriceTbc).map((service) => (
                                            <TableRow key={service.id}>
                                                <TableCell className="font-medium text-xs sm:text-sm">{service.title}</TableCell>
                                                <TableCell className="text-right text-xs opacity-50 line-through">{formatPrice(service.price)}</TableCell>
                                                <TableCell className="text-right font-bold text-primary text-xs sm:text-sm">{formatPrice(service.resellerPrice || service.price * 0.90)}</TableCell>
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



const featureBenefits = [
    {
        icon: Percent,
        feature: 'Wholesale Partner Discount',
        benefit: 'Increase your profit margins instantly. Buy services at wholesale rates (10% discount) and sell at retail prices.',
        showPricing: true,
        bgClass: 'bg-emerald-500/10',
        borderClass: 'border-emerald-500/20',
        iconClass: 'text-emerald-600 dark:text-emerald-400',
        checkClass: 'text-emerald-600 dark:text-emerald-400',
    },
    {
        icon: LayoutDashboard,
        feature: 'White-Label Dashboard',
        benefit: 'Manage your entire practice, staff, and client workflows from a single secure portal that carries your branding, not ours.',
        bgClass: 'bg-violet-500/10',
        borderClass: 'border-violet-500/20',
        iconClass: 'text-violet-600 dark:text-violet-400',
        checkClass: 'text-violet-600 dark:text-violet-400',
    },
    {
        icon: Globe,
        feature: 'Custom Practice Landing Page',
        benefit: 'Get a 24/7 online store with 50+ re-branded services. Let your clients browse, order, and pay while you sleep.',
        bgClass: 'bg-cyan-500/10',
        borderClass: 'border-cyan-500/20',
        iconClass: 'text-cyan-600 dark:text-cyan-400',
        checkClass: 'text-cyan-600 dark:text-cyan-400',
    },
    {
        icon: Users,
        feature: 'Elastic Outsourcing Capacity',
        benefit: 'Never say "no" to a complex project again. Confidently scale your business capacity by leveraging our expert backend team.',
        bgClass: 'bg-amber-500/10',
        borderClass: 'border-amber-500/20',
        iconClass: 'text-amber-600 dark:text-amber-400',
        checkClass: 'text-amber-600 dark:text-amber-400',
    },
    {
        icon: GraduationCap,
        feature: 'Onboarding & Professional Support',
        benefit: 'Full setup, training, and direct access to senior Chartered Accountants and tax experts to help you navigate complex technical hurdles.',
        bgClass: 'bg-blue-500/10',
        borderClass: 'border-blue-500/20',
        iconClass: 'text-blue-600 dark:text-blue-400',
        checkClass: 'text-blue-600 dark:text-blue-400',
    },
    {
        icon: Scale,
        feature: 'Flexible Pricing Control',
        benefit: 'Total control over your client-facing prices. Set your own markup on services while our underlying wholesale cost remains fixed.',
        bgClass: 'bg-indigo-500/10',
        borderClass: 'border-indigo-500/20',
        iconClass: 'text-indigo-600 dark:text-indigo-400',
        checkClass: 'text-indigo-600 dark:text-indigo-400',
    },
];

const challenges = [
    {
        title: 'Limited Service Range',
        description: 'Offering only bookkeeping services limits your earning potential. Sell our full suite — from company registration to VAT, COIDA, CIDB, NCR, and more.',
        icon: Briefcase,
        bgClass: 'bg-blue-500/10',
        borderClass: 'border-blue-100/80 dark:border-blue-900/30',
        hoverBorderClass: 'hover:border-blue-500/30',
        iconClass: 'text-blue-600 dark:text-blue-400',
        barClass: 'bg-blue-500',
    },
    {
        title: 'Lack of Mentorship',
        description: 'Many bookkeepers work alone. We provide mentorship from senior accountants and industry experts who help you grow your capabilities.',
        icon: GraduationCap,
        bgClass: 'bg-amber-500/10',
        borderClass: 'border-amber-100/80 dark:border-amber-900/30',
        hoverBorderClass: 'hover:border-amber-500/30',
        iconClass: 'text-amber-600 dark:text-amber-400',
        barClass: 'bg-amber-500',
    },
    {
        title: 'Technology Gaps',
        description: 'Without proper systems, document management is messy. Get our cloud-based dashboard to manage and outsource client orders seamlessly.',
        icon: Cpu,
        bgClass: 'bg-violet-500/10',
        borderClass: 'border-violet-100/80 dark:border-violet-900/30',
        hoverBorderClass: 'hover:border-violet-500/30',
        iconClass: 'text-violet-600 dark:text-violet-400',
        barClass: 'bg-violet-500',
    },
    {
        title: 'Manual Sales & Quoting',
        description: 'Quoting manually and chasing EFTs is a time-sink. Your white-labeled online store automates sales, PayFast, and document collection.',
        icon: ShoppingBag,
        bgClass: 'bg-emerald-500/10',
        borderClass: 'border-emerald-100/80 dark:border-emerald-900/30',
        hoverBorderClass: 'hover:border-emerald-500/30',
        iconClass: 'text-emerald-600 dark:text-emerald-400',
        barClass: 'bg-emerald-500',
    },
    {
        title: 'Capacity Constraints',
        description: 'Handling large clients alone isn’t easy. Our qualified team handles your overflow work securely, accurately, and on time.',
        icon: Users,
        bgClass: 'bg-cyan-500/10',
        borderClass: 'border-cyan-100/80 dark:border-cyan-900/30',
        hoverBorderClass: 'hover:border-cyan-500/30',
        iconClass: 'text-cyan-600 dark:text-cyan-400',
        barClass: 'bg-cyan-500',
    },
    {
        title: 'Compliance Overwhelm',
        description: 'Advanced statutory rules can be deterring. We provide ready-to-use templates and guides to help you stay compliant and confident.',
        icon: ShieldAlert,
        bgClass: 'bg-rose-500/10',
        borderClass: 'border-rose-100/80 dark:border-rose-900/30',
        hoverBorderClass: 'hover:border-rose-500/30',
        iconClass: 'text-rose-600 dark:text-rose-400',
        barClass: 'bg-rose-500',
    }
];

const faqs = [
    {
        question: "How does the outsourcing work?",
        answer: "You can decide to complete the order yourself or outsource to us directly through your Partner Portal. The process is completely white-labeled, and all communication is done strictly through your company — we never contact your clients directly. We act as your back-office team behind the scenes while you maintain 100% control of the client relationship. We charge you a fixed wholesale price (10% discount), and you keep the markup."
    },
    {
        question: "Is there a setup fee?",
        answer: "No, there are no upfront setup fees — joining the Partner Program is completely free."
    },
    {
        question: "How much does the partner program cost?",
        answer: "Joining the Partner Program is free! You get a 10% wholesale discount on all services. You can activate premium add-ons directly from your dashboard as you need them: Custom Practice Landing Page (R2450 once-off), AI Accountant (R950/mo), AI Payroll (R950/mo), Task & Workflow Manager (R200/mo), and additional staff seats (R50/seat/mo)."
    },
    {
        question: "Do I need to be a registered accountant?",
        answer: "Anyone can join the Bookkeeper Empowerment Initiative to use the software and manage their own clients. While being registered with a professional body is beneficial, it is not a strict requirement to use our backend and outsource work to us."
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
            <h1 className="text-4xl font-black tracking-tight md:text-6xl lg:text-7xl text-hero-gradient pb-2">
                10X Your Practice — <span className="text-gradient">Without Hiring More Staff.</span>
            </h1>
            <p className="mt-6 text-xl text-foreground/80 max-w-4xl mx-auto font-medium leading-relaxed">
                Never lose a client because you lack capacity, specialised expertise, or time. With the Bookkeeper Empowerment Initiative (BEI), you can confidently outsource complex work while keeping full control of the client relationship and growing your revenue.
            </p>
            <p className="mt-6 text-2xl font-bold text-foreground/90 uppercase tracking-tighter">Expand your services. Protect your clients. Scale your practice.</p>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <TrustIndexWidget />
      </div>

      <section className="py-24">
        <div className="container mx-auto px-4">
            <div className="text-center mb-16 space-y-4">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">Pricing</Badge>
                <h2 className="text-4xl md:text-5xl font-black leading-tight text-foreground">Free to Join Partner Program</h2>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                    Get started today at no cost. Activate add-ons directly from your dashboard as your practice grows.
                </p>
            </div>
            
            <div className="max-w-md mx-auto">
                <div className="relative p-[2px] rounded-2xl bg-gradient-to-r from-primary via-blue-500 to-violet-600 shadow-2xl hover:shadow-primary/20 transition-all duration-300 group md:scale-105">
                    {/* Glowing background blob */}
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary to-violet-600 opacity-25 blur transition duration-1000 group-hover:opacity-40 group-hover:duration-200" />
                    
                    <div className="relative bg-white dark:bg-slate-900 rounded-[14px] overflow-hidden flex flex-col justify-between h-full">
                        <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-lg z-20">
                            Partner Plan
                        </div>
                        <div>
                            <CardHeader className="bg-gradient-to-b from-primary/5 via-blue-50/10 to-transparent border-b border-slate-100 p-8 text-center">
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-primary/80">Standard Practice Access</CardTitle>
                                <div className="mt-4 flex flex-col items-center justify-center gap-1">
                                    <span className="text-xl text-muted-foreground line-through font-bold decoration-red-500/80 decoration-2">R950/mo</span>
                                    <span className="text-6xl font-black bg-gradient-to-r from-primary via-indigo-600 to-rose-600 bg-clip-text text-transparent pb-1">Free</span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8">
                                <ul className="space-y-4">
                                    {[
                                        {
                                            id: 'landing',
                                            text: 'Custom Practice Landing Page (Domain linked) - Optional R2450 Add-on',
                                            icon: Globe,
                                            isDemo: true,
                                            bgClass: 'bg-cyan-500/10',
                                            textClass: 'text-cyan-600 dark:text-cyan-400',
                                        },
                                        {
                                            id: 'collab',
                                            text: 'Access outsourcing and collaboration opportunities',
                                            icon: Users,
                                            bgClass: 'bg-amber-500/10',
                                            textClass: 'text-amber-600 dark:text-amber-400',
                                        },
                                        {
                                            id: 'overflow',
                                            text: 'Outsource overflow work securely',
                                            icon: Briefcase,
                                            bgClass: 'bg-indigo-500/10',
                                            textClass: 'text-indigo-600 dark:text-indigo-400',
                                        },
                                        {
                                            id: 'discount',
                                            text: '10% Wholesale outsourcing discount',
                                            icon: Percent,
                                            bgClass: 'bg-emerald-500/10',
                                            textClass: 'text-emerald-600 dark:text-emerald-400',
                                        },
                                        {
                                            id: 'chat',
                                            text: 'Partner Community Chat',
                                            icon: MessageSquare,
                                            bgClass: 'bg-rose-500/10',
                                            textClass: 'text-rose-600 dark:text-rose-400',
                                        }
                                    ].map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <li key={item.id} className="flex items-start gap-3 text-sm font-semibold text-foreground/80 hover:translate-x-1 transition-transform duration-200">
                                                <div className={`flex items-center justify-center h-8 w-8 rounded-lg ${item.bgClass} ${item.textClass} shrink-0 mt-0.5`}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                {item.isDemo ? (
                                                    <span className="leading-tight pt-1">
                                                        Custom Practice Landing Page (Domain linked) - <span className="font-bold text-amber-600">Optional R2450 Add-on</span> <br/>
                                                        <a href="https://www.myacc.co.za/p/interscope" target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold text-xs">
                                                            Click here to view a demo page
                                                        </a>
                                                    </span>
                                                ) : (
                                                    <span className="leading-tight pt-1">{item.text}</span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </CardContent>
                        </div>
                        <CardFooter className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col gap-3">
                            <Button asChild size="lg" className="w-full h-14 text-lg font-black shadow-lg hover:shadow-primary/30 hover:scale-[1.02] transition-all duration-300 bg-gradient-to-r from-primary to-blue-600 text-white">
                                <Link href="/partner-signup">Join Partner Program Free</Link>
                            </Button>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest text-center">No credit card required to join</p>
                        </CardFooter>
                    </div>
                </div>
            </div>
        </div>
      </section>

      <section className="container mx-auto px-4 scroll-m-20">
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">Our Philosophy</Badge>
                <h2 className="text-4xl font-black leading-tight text-foreground">Our philosophy has always been simple</h2>
            </div>
            
            <div className="bg-gradient-to-br from-white via-slate-50/40 to-blue-50/20 border border-slate-200/80 shadow-2xl rounded-3xl overflow-hidden p-6 md:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 rounded-full filter blur-3xl pointer-events-none" />
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    {/* Left Column: Avatar & Credentials */}
                    <div className="md:col-span-5 flex flex-col items-center text-center p-6 bg-slate-100/50 border border-slate-200/60 rounded-2xl shadow-sm">
                        <img
                            src="/kevin-freese.jpg"
                            alt="Kevin Freese"
                            className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md shrink-0 mb-4"
                        />
                        <h4 className="text-lg font-black text-slate-900">Kevin Freese</h4>
                        <p className="text-xs text-primary font-bold uppercase tracking-wider mt-0.5">Managing Director & Founder</p>
                        
                        <div className="mt-2.5 px-3 py-1 bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 rounded-full font-bold text-[10px] uppercase tracking-wider border border-amber-500/20">
                            20+ Years Experience
                        </div>

                        <div className="mt-5 w-full border-t border-slate-200 pt-4 space-y-3 text-xs font-semibold text-slate-500 text-left">
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                                <span className="text-slate-400 font-medium">SARS Tax ID</span>
                                <span className="text-slate-800 font-mono font-bold">PR-0098553</span>
                            </div>
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                                <span className="text-slate-400 font-medium">CIBA SBA</span>
                                <span className="text-slate-800 font-mono font-bold">201509-5372</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 font-medium">SAIT Practitioner</span>
                                <span className="text-slate-800 font-mono font-bold">47011519</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Quote & vision info */}
                    <div className="md:col-span-7 space-y-6">
                        <div>
                            <p className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight italic font-serif relative z-10">
                                &quot;A client referred to someone else is a client lost.&quot;
                            </p>
                        </div>
                        
                        <div className="space-y-4 text-base md:text-lg text-slate-600/90 font-medium leading-relaxed">
                            <p>
                                With the Bookkeeper Empowerment Initiative, you never have to turn a client away or lose revenue because you lack capacity, specialised expertise, or time.
                            </p>
                            <p>
                                You can easily submit, monitor, and manage outsourced tasks directly through your <strong className="font-bold text-slate-900">Partner Portal</strong>. All work is carried out discreetly in the background by our qualified specialists, acting as an extension of your own team.
                            </p>
                            <p>
                                Crucially, <strong className="font-bold text-slate-900">all communication is done strictly through your company</strong>. We operate under a 100% white-label model — we never contact your clients directly, ensuring your brand stays front and center while you retain complete control over your client relationships.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2">
                            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-full font-bold text-xs border border-emerald-100 shadow-sm">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> You stay in control
                            </div>
                            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-full font-bold text-xs border border-emerald-100 shadow-sm">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> You keep the client
                            </div>
                            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-full font-bold text-xs border border-emerald-100 shadow-sm">
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> You protect your brand
                            </div>
                        </div>

                        <p className="font-bold text-slate-900 text-sm md:text-base pt-4 border-t border-slate-200">
                            We handle the complexity behind the scenes so your client never needs to move to another accountant.
                        </p>
                    </div>
                </div>
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
                    <Card key={idx} className={`relative overflow-hidden border ${item.borderClass} ${item.hoverBorderClass} shadow-md bg-white dark:bg-slate-900 hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}>
                        <div className={`h-1.5 w-full absolute top-0 left-0 ${item.barClass}`} />
                        <CardHeader className="text-center pb-2 pt-6">
                            <div className={`mx-auto h-16 w-16 rounded-full ${item.bgClass} border ${item.borderClass} flex items-center justify-center mb-4 shadow-sm`}>
                                <item.icon className={`h-8 w-8 ${item.iconClass}`} />
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

      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <CommunityCarouselWidget />
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
                                    <div className={`h-10 w-10 rounded-xl ${item.bgClass} border ${item.borderClass} flex items-center justify-center shrink-0 shadow-sm`}>
                                        <item.icon className={`h-5 w-5 ${item.iconClass}`} />
                                    </div>
                                    <h3 className="font-bold text-lg text-foreground leading-tight">{item.feature}</h3>
                                </div>
                            </div>
                            <div className="p-6 bg-white group-hover:bg-transparent transition-colors flex flex-col justify-center items-start">
                                <span className="md:hidden text-[10px] font-black uppercase text-green-600 tracking-widest block mb-2">The Benefit to You</span>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className={`h-5 w-5 ${item.checkClass} shrink-0 mt-0.5`} />
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
         <div className="w-full space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-border pb-6 last:border-0">
                <h3 className="text-lg font-bold text-foreground mb-2">{faq.question}</h3>
                <div className="whitespace-pre-line text-muted-foreground leading-relaxed text-base">{faq.answer}</div>
              </div>
            ))}
          </div>
      </section>
      
      <section className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto space-y-8">
            <h2 className="text-4xl font-bold tracking-tight text-foreground">Ready to Empower Your Practice?</h2>
            <p className="text-xl text-muted-foreground">
                Get started today at no cost and start growing your practice.
            </p>
            <div className="flex items-center justify-center">
                <Button asChild size="lg" className="h-14 px-10 text-lg font-bold shadow-lg">
                    <Link href="/partner-signup">Join Partner Program Free</Link>
                </Button>
            </div>
        </div>
      </section>
    </div>
  );
}
