'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { 
  Rocket, 
  ShieldCheck, 
  Wallet, 
  CheckCircle2, 
  ArrowRight, 
  Calculator, 
  Landmark, 
  Building, 
  MapPin,
  CheckCircle, 
  RefreshCw, 
  Globe, 
  HardHat, 
  Camera, 
  User, 
  Utensils, 
  Loader2, 
  Clock,
  PlusCircle,
  Users,
  TrendingUp,
  Phone,
  MessageCircle,
  FileUp,
  ShoppingCart,
  Sparkles,
  BrainCircuit,
  Zap,
  Check,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import Script from 'next/script';
import { useBlog } from '@/contexts/BlogContext';
import { format } from 'date-fns';
import { Service } from '@/lib/types';
import { getFirestore, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';

const db = getFirestore(firebaseApp);

export default function HomePageClient() {
  const [mounted, setMounted] = useState(false);
  const { blogPosts, isLoading: isBlogLoading } = useBlog();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);

  // Pricing Calculator State
  const [turnover, setTurnover] = useState(500000); // Annual turnover in ZAR
  const [payrollEmployees, setPayrollEmployees] = useState(5);
  const [needsVat, setNeedsVat] = useState(false);
  const [needsPayroll, setNeedsPayroll] = useState(true);

  useEffect(() => {
    setMounted(true);
    const unsub = onSnapshot(query(collection(db, 'services'), orderBy('title')), (snap) => {
        setServices(snap.docs.map(d => ({ ...d.data(), id: d.id } as Service)));
        setIsLoadingServices(false);
    });
    return () => unsub();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getServicePrice = (slug: string, fallback: string): string => {
    const service = services.find(s => s.slug === slug);
    if (service && service.price !== undefined && service.price !== null) {
      return formatPrice(service.price);
    }
    return fallback;
  };

  const calculatedPackage = useMemo(() => {
    let basePrice = 0;
    let name = "Essential";
    let desc = "Best for small startups & sole proprietors with turnover under R1M.";
    let features: string[] = [];

    // Tiers and pricing based on the Monthly Accounting packages:
    // Essential: R3,500 (turnover under R1M)
    // Growth: R7,000 (turnover up to R7M)
    // Executive: R11,500 (turnover up to R25M)
    
    // If they require VAT, they must be on Growth or Executive (since Essential doesn't include VAT returns)
    const requiresGrowthOrHigher = needsVat || turnover > 1000000;
    const requiresExecutiveOrHigher = turnover > 7000000;

    let payrollFee = 0;
    if (needsPayroll && payrollEmployees > 0) {
      if (payrollEmployees <= 10) {
        payrollFee = 6400;
      } else {
        payrollFee = Math.min(6400 + (payrollEmployees - 10) * 190, 14000);
      }
    }

    if (turnover > 25000000) {
      return {
        name: "Outsourced CFO & Enterprise",
        desc: "Tailored for large SMEs and corporate groups seeking a complete outsourced accounting department.",
        priceText: "Custom Quote",
        features: [
          "Full outsourced bookkeeping & CFO consulting",
          "Dedicated Chartered Accountant & Auditor liaison",
          "Custom financial reporting & board packs",
          "Comprehensive SARS audit & dispute protection",
          "Full payroll & HR compliance (EMP501/COIDA)",
          "Tailored integrations with Xero/Sage"
        ],
        isCustom: true
      };
    }

    if (requiresExecutiveOrHigher) {
      basePrice = 11500 + payrollFee;
      name = "Executive";
      desc = "Comprehensive CFO & tax governance for turnover up to R25M.";
      features = [
        "Everything in Growth",
        "Monthly Management Reports",
        "Unlimited CFO Advisory Services",
        "Unlimited Strategic Business Reviews",
        "Priority Support Response"
      ];
      if (needsPayroll && payrollEmployees > 0) {
        features.push(`Monthly Payroll processing for ${payrollEmployees} staff (+R${payrollFee.toLocaleString('en-ZA')}/mo)`);
      }
    } else if (requiresGrowthOrHigher) {
      basePrice = 7000 + payrollFee;
      name = "Growth";
      desc = "Perfect for growing SME businesses with turnover up to R7M.";
      features = [
        "Everything in Essential",
        "VAT Returns & Submissions",
        "Bi-Monthly Management Reports",
        "Financial Manager Support",
        "Cash Flow & Budgeting Assistance",
        "CFO Advisory & Monthly Reviews"
      ];
      if (needsPayroll && payrollEmployees > 0) {
        features.push(`Monthly Payroll processing for ${payrollEmployees} staff (+R${payrollFee.toLocaleString('en-ZA')}/mo)`);
      }
    } else {
      basePrice = 3500 + payrollFee;
      name = "Essential";
      desc = "Best for small startups & sole proprietors with turnover under R1M.";
      features = [
        "Monthly Bookkeeping & Reconciliations",
        "Quarterly Management Reports",
        "Annual Financial Statements",
        "Income Tax & CIPC Annual Returns",
        "Payroll Processing & PAYE / UIF",
        "Dedicated Accountant support"
      ];
      if (needsPayroll && payrollEmployees > 0) {
        features.push(`Monthly Payroll processing for ${payrollEmployees} staff (+R${payrollFee.toLocaleString('en-ZA')}/mo)`);
      }
    }

    return {
      name,
      desc,
      priceText: formatPrice(basePrice) + " / mo",
      features,
      isCustom: false
    };
  }, [turnover, payrollEmployees, needsVat, needsPayroll]);

  const trustIndicators = [
    { label: "Trusted by South African Businesses", icon: CheckCircle },
    { label: "Professional Accounting & Compliance Support", icon: ShieldCheck },
    { label: "Online Service Delivery Nationwide", icon: Globe },
    { label: "Transparent Pricing", icon: Wallet },
    { label: "Secure Document Submission", icon: ShieldCheck }
  ];

  const trustBlocks = [
    { title: "Professional & Reliable", desc: "Our team focuses on practical accounting and compliance solutions designed specifically for South African businesses.", icon: ShieldCheck },
    { title: "Nationwide Online Support", desc: "We assist clients throughout Johannesburg, Pretoria, Durban, Cape Town, Gauteng, and across South Africa.", icon: Globe },
    { title: "Transparent Process", desc: "Our online system makes it easy to purchase services, upload documents, and track your compliance requirements.", icon: RefreshCw },
    { title: "Business Compliance Specialists", desc: "We assist businesses with ongoing SARS, CIPC, payroll, and accounting compliance requirements.", icon: Landmark }
  ];

  const faqData = [
    { q: "What accounting services do you provide for SMEs?", a: "We provide comprehensive bookkeeping, annual financial statements, management accounts, and outsourced CFO services tailored for South African SMEs." },
    { q: "How does the VAT registration process work?", a: "We handle the entire VAT registration process with SARS, ensuring your business meets the mandatory or voluntary requirements correctly." },
    { q: "Can you help with tax debt relief and SARS compromises?", a: "Yes, our specialists assist with Section 200 compromises and negotiations to settle outstanding tax debt legally and affordably." },
    { q: "Do you provide monthly management reports?", a: "Yes, we prepare regular management accounts, including Income Statements and Balance Sheets, to help you track your business performance." },
    { q: "What is the process for SARS disputes and objections?", a: "We analyze the grounds for assessment, draft Section 104 objections, and manage the entire dispute resolution process with SARS." },
    { q: "Where can I find the latest South African tax tips?", a: "You can visit our Tax Tip Blog, where we regularly publish articles on tax optimization, compliance updates, and financial advice for freelancers and business owners." },
    { q: "Do you assist with annual financial statement preparation?", a: "Yes, we prepare IFRS-compliant annual financial statements for companies and trusts to ensure year-end compliance and audit readiness." }
  ];


  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-background pt-16 lg:pt-24 pb-20 text-left">
        {/* Aurora background blobs */}
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="aurora-blob aurora-blue w-[300px] h-[300px] bottom-0 left-1/3 animate-aurora-drift" style={{ animationDelay: '-10s' }} />
        {/* Dot grid overlay */}
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Text Content */}
            <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full glass neon-border text-xs font-semibold text-primary uppercase tracking-widest">
                <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                AI-Powered Accounting Platform
              </div>
              <h1 className="mb-6 text-4xl font-black tracking-tight text-foreground md:text-5xl lg:text-6xl xl:text-7xl font-headline leading-tight">
                Online <span className="text-gradient">Accounting, Tax & Payroll</span> Services in South Africa
              </h1>
              <div className="mb-10 max-w-2xl text-base font-medium text-muted-foreground md:text-lg leading-relaxed space-y-4">
                <p>
                  My Accountant helps South African businesses stay compliant with professional accounting, tax, payroll, SARS, and CIPC services — all through a simple online process.
                </p>
                <p className="hidden md:block">
                  Whether you need company registration, VAT registration, bookkeeping, payroll, annual financial statements, tax compliance, or CIPC annual returns, our team assists businesses throughout Johannesburg, Randburg, Gauteng, and across South Africa.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center lg:justify-start">
                <Button asChild size="lg" className="h-14 px-8 text-base font-bold shadow-xl bg-gradient hover:opacity-90 text-white neon-glow transition-all duration-300">
                  <Link href="/contact">Book Free Consultation</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 px-8 text-base font-bold border border-white/10 bg-white/[0.04] backdrop-blur-sm hover:bg-white/[0.08] hover:border-primary/30 text-foreground transition-all duration-300">
                  <Link href="/contact">Speak to an Accountant</Link>
                </Button>
                <Button asChild variant="secondary" size="lg" className="h-14 px-8 text-base font-bold bg-secondary hover:bg-secondary/80 text-foreground transition-all duration-300">
                  <Link href="/products">Visit online store</Link>
                </Button>
              </div>
            </div>

            {/* Right Column: Interactive Dashboard Mockup */}
            <div className="lg:col-span-5 w-full flex justify-center">
              <div className="w-full max-w-md glass-card rounded-3xl border border-white/[0.08] p-5 shadow-2xl relative overflow-hidden neon-glow group transition-all duration-500 hover:border-primary/20">
                {/* Header of Mockup */}
                <div className="flex justify-between items-center pb-4 border-b border-white/[0.06] mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                      <Calculator className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-foreground">My Accountant Portal</h4>
                      <p className="text-[9px] text-muted-foreground">Acme South Africa Pty Ltd</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10 border-none font-bold text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Compliant
                  </Badge>
                </div>

                {/* Body of Mockup */}
                <div className="space-y-4">
                  {/* Monthly stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Bookkeeping Status</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Reconciled</span>
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">SARS VAT Period</span>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground text-gradient font-headline">Period 04</span>
                        <span className="text-[8px] text-muted-foreground">Due June 30</span>
                      </div>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-2">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider block">Compliance Checklist</span>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.01] border border-white/[0.04] text-[10px]">
                        <div className="flex items-center gap-2 text-foreground/85">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>CIPC Annual Return</span>
                        </div>
                        <span className="text-[9px] text-emerald-400 font-bold">Filed</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.01] border border-white/[0.04] text-[10px]">
                        <div className="flex items-center gap-2 text-foreground/85">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>UIF/PAYE Submission</span>
                        </div>
                        <span className="text-[9px] text-emerald-400 font-bold">Compliant</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.01] border border-white/[0.04] text-[10px]">
                        <div className="flex items-center gap-2 text-foreground/85">
                          <Clock className="h-3.5 w-3.5 text-amber-400" />
                          <span>VAT Return Preparation</span>
                        </div>
                        <span className="text-[9px] text-amber-400 font-bold">In Progress</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive AI Chat Mockup */}
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-2">
                    <div className="flex items-center gap-1.5">
                      <BrainCircuit className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[9px] text-primary font-bold uppercase tracking-wider">AI Compliance Assistant</span>
                    </div>
                    <div className="space-y-2 text-[10px]">
                      <div className="flex justify-end">
                        <div className="bg-primary/20 text-foreground px-2.5 py-1.5 rounded-2xl rounded-tr-none max-w-[85%] text-[9px] font-medium">
                          When is my VAT return due?
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-white/[0.04] text-muted-foreground px-2.5 py-1.5 rounded-2xl rounded-tl-none max-w-[90%] text-[9px] border border-white/[0.04] leading-relaxed font-medium">
                          Your VAT return for Period 04/2026 is due by June 30th. I have prepared the return for review.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Hero trust indicator badges */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-5 gap-4 max-w-5xl mx-auto border-t border-white/[0.06] pt-8">
              {trustIndicators.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 text-muted-foreground">
                      <item.icon className="h-5 w-5 text-primary animate-glow-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-tight">{item.label}</span>
                  </div>
              ))}
          </div>
        </div>
      </section>

      {/* LOGO CREDIBILITY RIBBON */}
      <div className="border-y border-white/[0.06] bg-white/[0.01] py-8 relative z-10">
        <div className="container mx-auto px-4 max-w-6xl">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center mb-6">
            Accredited Professional Memberships & Regulatory Compliance
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60 hover:opacity-90 transition-opacity duration-300">
            {/* CIBA Badge */}
            <div className="flex items-center gap-2 text-foreground font-black tracking-tight text-sm">
              <div className="h-7 w-7 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center"><Building className="h-4 w-4 text-primary" /></div>
              <div className="flex flex-col text-left">
                <span className="leading-none text-xs">CIBA Member</span>
                <span className="text-[8px] text-muted-foreground font-medium">Biz Accountant</span>
              </div>
            </div>
            {/* SAIT Badge */}
            <div className="flex items-center gap-2 text-foreground font-black tracking-tight text-sm">
              <div className="h-7 w-7 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center"><Landmark className="h-4 w-4 text-primary" /></div>
              <div className="flex flex-col text-left">
                <span className="leading-none text-xs">SAIT Member</span>
                <span className="text-[8px] text-muted-foreground font-medium">Tax Practitioner</span>
              </div>
            </div>
            {/* SAICA Badge */}
            <div className="flex items-center gap-2 text-foreground font-black tracking-tight text-sm">
              <div className="h-7 w-7 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center"><ShieldCheck className="h-4 w-4 text-primary" /></div>
              <div className="flex flex-col text-left">
                <span className="leading-none text-xs">SAICA Affiliate</span>
                <span className="text-[8px] text-muted-foreground font-medium">Chartered Accounting</span>
              </div>
            </div>
            {/* SARS Badge */}
            <div className="flex items-center gap-2 text-foreground font-black tracking-tight text-sm">
              <div className="h-7 w-7 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center font-bold text-primary">S</div>
              <div className="flex flex-col text-left">
                <span className="leading-none text-xs">SARS Registered</span>
                <span className="text-[8px] text-muted-foreground font-medium">Tax Practitioners</span>
              </div>
            </div>
            {/* CIPC Badge */}
            <div className="flex items-center gap-2 text-foreground font-black tracking-tight text-sm">
              <div className="h-7 w-7 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center"><Building className="h-4 w-4 text-primary" /></div>
              <div className="flex flex-col text-left">
                <span className="leading-none text-xs">CIPC Agent</span>
                <span className="text-[8px] text-muted-foreground font-medium">Company Registry</span>
              </div>
            </div>
            {/* Carte Blanche Badge */}
            <div className="flex items-center gap-2 border-l border-white/10 pl-6 text-foreground font-black tracking-tight text-sm">
              <div className="flex flex-col text-left">
                <span className="text-xs text-primary uppercase font-headline tracking-tighter">Carte Blanche</span>
                <span className="text-[8px] text-muted-foreground font-medium">Financial Management Partner</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TrustIndexWidget />

      {/* TRUST & AUTHORITY SECTION */}
      <section className="py-24 bg-background text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-grid opacity-50" />
        <div className="container relative z-10 mx-auto px-4 space-y-16">
          <div className="max-w-6xl mx-auto space-y-6">
            <h2 className="text-3xl font-black tracking-tight text-foreground md:text-4xl text-center font-headline">
              Why South African Businesses Choose My Accountant
            </h2>
            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed text-center">
              <p>
                At My Accountant, we focus on helping South African entrepreneurs, startups, SMEs, and established businesses simplify accounting, tax, payroll, SARS, and CIPC compliance through a modern online service model designed for convenience, efficiency, and ongoing business support.
              </p>
              <p>
                Our platform allows clients to purchase services online, upload documents securely, and receive professional accounting and compliance assistance from anywhere in South Africa without needing to visit a physical office. Whether you require bookkeeping, annual financial statements, VAT registration, payroll services, tax compliance, company registration, or ongoing CIPC support, our team provides practical solutions tailored to the South African business environment.
              </p>

              {/* Key Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 my-8 glass-card rounded-3xl p-8 text-center">
                <div className="space-y-2">
                  <p className="text-4xl md:text-5xl font-black text-gradient animate-glow-pulse">10,000+</p>
                  <p className="text-sm font-bold text-foreground/80">Company Registrations</p>
                  <p className="text-xs text-muted-foreground leading-normal">Successfully registered and compliant businesses nationwide.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-4xl md:text-5xl font-black text-gradient animate-glow-pulse" style={{ animationDelay: '0.5s' }}>R120M+</p>
                  <p className="text-sm font-bold text-foreground/80">Tax Savings & Debt Relief</p>
                  <p className="text-xs text-muted-foreground leading-normal">Legally negotiated debt compromise & tax structures for SA SMEs.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-4xl md:text-5xl font-black text-gradient animate-glow-pulse" style={{ animationDelay: '1s' }}>99.7%</p>
                  <p className="text-sm font-bold text-foreground/80">SARS Acceptance Rate</p>
                  <p className="text-xs text-muted-foreground leading-normal">Accurate submissions resulting in immediate system approvals.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-4xl md:text-5xl font-black text-gradient animate-glow-pulse" style={{ animationDelay: '1.5s' }}>200+</p>
                  <p className="text-sm font-bold text-foreground/80">5-Star Google Reviews</p>
                  <p className="text-xs text-muted-foreground leading-normal">Highest rated online business accountant in South Africa.</p>
                </div>
              </div>

              <p>
                My Accountant is backed by strong client satisfaction and has earned over 200+ 5-star Google reviews from businesses across South Africa. View our Google Reviews & Client Feedback to see what our clients have to say about our accounting, tax, payroll, SARS, and compliance services.
              </p>

              {/* Expert Quotation Section */}
              <div className="max-w-5xl mx-auto my-12 glass-card rounded-3xl border border-white/[0.06] overflow-hidden p-6 md:p-10 text-left relative group">
                <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 rounded-full filter blur-3xl pointer-events-none" />
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  {/* Left Column: Avatar & Credentials */}
                  <div className="md:col-span-4 flex flex-col items-center text-center p-6 bg-white/[0.01] border border-white/[0.04] rounded-2xl">
                    <div className="h-20 w-20 rounded-full bg-gradient flex items-center justify-center font-black text-white text-2xl border-4 border-white/5 shadow-xl shrink-0 mb-4 animate-pulse">
                      KF
                    </div>
                    <h4 className="text-lg font-black text-foreground">Kevin Freese</h4>
                    <p className="text-xs text-primary font-bold uppercase tracking-wider mt-0.5">Managing Director & Founder</p>
                    
                    <div className="mt-4 w-full border-t border-white/[0.06] pt-4 space-y-2 text-[10px] font-semibold text-muted-foreground text-left">
                      <div className="flex justify-between items-center bg-white/[0.02] p-1.5 rounded border border-white/[0.04]">
                        <span>SARS Tax ID:</span>
                        <span className="text-foreground font-mono font-bold">PR-0098553</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/[0.02] p-1.5 rounded border border-white/[0.04]">
                        <span>CIBA SBA:</span>
                        <span className="text-foreground font-mono font-bold">201509-5372</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/[0.02] p-1.5 rounded border border-white/[0.04]">
                        <span>SAIT Tax Practitioner:</span>
                        <span className="text-foreground font-mono font-bold">47011519</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Quote & Vision */}
                  <div className="md:col-span-8 space-y-4">
                    <span className="text-6xl text-primary/30 font-serif leading-none block -mb-8">&ldquo;</span>
                    <p className="text-base md:text-lg font-medium text-foreground/90 italic leading-relaxed pt-4 relative z-10">
                      &quot;Small and medium enterprises are the engine of South Africa's growth, but navigating the ever-shifting SARS and CIPC compliance landscapes can be a major roadblock. Our goal is to leverage technology to remove the accounting and compliance burden, allowing business owners to focus 100% on their core operations, scaling, and job creation.&quot;
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 border-emerald-500/20 bg-emerald-500/5">✓ CIBA Registered</Badge>
                      <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 border-emerald-500/20 bg-emerald-500/5">✓ SAIT Registered</Badge>
                      <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 border-emerald-500/20 bg-emerald-500/5">✓ SARS Approved</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <p>
                Our team includes professionals affiliated with recognised professional bodies including South African Institute of Chartered Accountants (SAICA), Chartered Institute for Business Accountants (CIBA), and South African Institute of Taxation (SAIT), with expertise spanning chartered accounting, management accounting, bookkeeping, taxation, and registered tax practitioner services. This provides clients with confidence that their accounting, tax, SARS, and compliance matters are handled professionally, ethically, and in accordance with recognised industry standards.
              </p>
              <p>
                We are also proud to be the appointed financial management partner for Carte Blanche, South Africa's longest-running and most trusted current affairs television programme, further reinforcing our commitment to professionalism, reliability, and high-quality financial management services.
              </p>
              <p>
                From startups and small businesses to established companies operating across Johannesburg, Randburg, Gauteng, and throughout South Africa, My Accountant remains committed to helping businesses stay compliant, organised, and financially supported through every stage of growth.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-12">
                {trustBlocks.map((block, idx) => (
                    <Card key={idx} className="border border-white/[0.06] shadow-none glass-card hover:border-primary/20 hover:shadow-[0_0_30px_rgba(0,229,255,0.06)] transition-all duration-300 text-center group">
                        <CardHeader className="pb-2 flex flex-col items-center">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-2 group-hover:neon-glow transition-all duration-300">
                              <block.icon className="h-5 w-5 text-primary" />
                            </div>
                            <CardTitle className="text-base font-bold text-foreground">{block.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground leading-relaxed">{block.desc}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* BEST SELLERS SECTION */}
      <section className="py-20 bg-secondary/50 border-t border-b border-white/[0.06] relative overflow-hidden">
        <div className="aurora-blob aurora-violet w-[300px] h-[300px] -bottom-20 -right-20 animate-aurora-drift" style={{ animationDelay: '-7s' }} />
        <div className="container relative z-10 mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline" className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary border-primary/20 bg-primary/5 rounded-full neon-border">
              Best Sellers
            </Badge>
            <h2 className="text-3xl font-black text-foreground md:text-5xl tracking-tight font-headline">
              Our Most Popular Services
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get started quickly with our top-selling compliance and accounting solutions, processed online with fast turnaround times.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* NCR Registration Card */}
            <Card className="flex flex-col glass-card border border-white/[0.06] hover:border-primary/20 hover:shadow-[0_0_30px_rgba(0,229,255,0.06)] transition-all duration-300 rounded-2xl overflow-hidden group">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:neon-glow transition-all duration-300">
                    <Building className="h-6 w-6" />
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/10 border-none font-bold text-[10px] uppercase tracking-wider">
                    NCR Registrations
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  NCR Registration
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 font-medium">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/60" /> 15-20 working days
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-6 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Legally register your business with the National Credit Regulator (NCR) to offer credit, credit facilities, or financial services in South Africa.
                </p>
                <ul className="space-y-2 text-xs font-semibold text-foreground/80">
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary shrink-0" /> Full CIPC & SARS vetting</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary shrink-0" /> Drafting of NCR application forms</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-primary shrink-0" /> Submission & liaison with officers</li>
                </ul>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-gradient">{getServicePrice('ncr-registration', 'R1,400')}</span>
                  <span className="text-xs text-muted-foreground font-semibold">once-off</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0 p-6 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                  <Lock className="h-3 w-3 text-emerald-400" /> Secure Link
                </div>
                <Button asChild size="sm" className="font-bold bg-gradient hover:opacity-90 text-white neon-glow transition-all duration-300">
                  <Link href="/products/ncr-registration">
                    Order
                    <ArrowRight className="h-4 w-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Accountant's Letter Card */}
            <Card className="flex flex-col glass-card border border-white/[0.06] hover:border-accent/20 hover:shadow-[0_0_30px_rgba(139,92,246,0.06)] transition-all duration-300 rounded-2xl overflow-hidden group">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:scale-110 group-hover:neon-glow-violet transition-all duration-300">
                    <FileUp className="h-6 w-6" />
                  </div>
                  <Badge className="bg-violet-500/10 text-violet-400 hover:bg-violet-500/10 border-none font-bold text-[10px] uppercase tracking-wider">
                    Accounting Services
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-foreground group-hover:text-accent transition-colors">
                  Accountant&apos;s Letter
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 font-medium">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/60" /> 1-2 working days
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-6 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Get a professional Accountant&apos;s Letter signed by a registered accountant for verifying income, financial standing, or loan and visa applications.
                </p>
                <ul className="space-y-2 text-xs font-semibold text-foreground/80">
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-accent shrink-0" /> Verified assets & liabilities</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-accent shrink-0" /> CIBA/SAIT official letterhead</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-accent shrink-0" /> Accepted by all SA banks & SARS</li>
                </ul>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-gradient">{getServicePrice('accountants-letter', 'R1,200')}</span>
                  <span className="text-xs text-muted-foreground font-semibold">once-off</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0 p-6 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                  <Lock className="h-3 w-3 text-emerald-400" /> Secure Link
                </div>
                <Button asChild size="sm" className="font-bold bg-gradient hover:opacity-90 text-white neon-glow transition-all duration-300">
                  <Link href="/products/accountants-letter">
                    Order
                    <ArrowRight className="h-4 w-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Tax Clearance Pin Card */}
            <Card className="flex flex-col glass-card border border-white/[0.06] hover:border-emerald-500/20 hover:shadow-[0_0_30px_rgba(16,185,129,0.06)] transition-all duration-300 rounded-2xl overflow-hidden group">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-all duration-300">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10 border-none font-bold text-[10px] uppercase tracking-wider">
                    SARS Services
                  </Badge>
                </div>
                <CardTitle className="text-xl font-bold text-foreground group-hover:text-emerald-400 transition-colors">
                  Tax Clearance Pin
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 font-medium">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground/60" /> 1-2 working days
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 pb-6 space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Acquire a SARS Tax Clearance PIN confirming your tax compliance status, essential for commercial tenders, public contracts, or foreign investments.
                </p>
                <ul className="space-y-2 text-xs font-semibold text-foreground/80">
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> Verified SARS compliance status</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> Tender-ready compliant PIN</li>
                  <li className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" /> Active verification link</li>
                </ul>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-2xl font-black text-gradient">{getServicePrice('tax-clearance-pin', 'R350')}</span>
                  <span className="text-xs text-muted-foreground font-semibold">once-off</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0 p-6 border-t border-white/[0.06] bg-white/[0.02] flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                  <Lock className="h-3 w-3 text-emerald-400" /> Secure Link
                </div>
                <Button asChild size="sm" className="font-bold bg-gradient hover:opacity-90 text-white neon-glow transition-all duration-300">
                  <Link href="/products/tax-clearance-pin">
                    Order
                    <ArrowRight className="h-4 w-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="text-center">
            <Button asChild size="lg" variant="secondary" className="h-14 px-12 text-lg font-extrabold shadow-lg rounded-xl hover:scale-105 active:scale-95 transition-all glass neon-border-hover text-foreground">
              <Link href="/products" className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 mr-1" />
                Visit our online store
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SME PRICING & BUNDLE CALCULATOR */}
      <section className="py-24 bg-secondary/35 border-y border-white/[0.06] relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-grid opacity-35" />
        <div className="aurora-blob aurora-cyan w-[400px] h-[400px] -top-20 -left-20 animate-aurora-drift" />
        <div className="aurora-blob aurora-violet w-[300px] h-[300px] bottom-0 right-1/4 animate-aurora-drift" style={{ animationDelay: '-6s' }} />

        <div className="container relative z-10 mx-auto px-4 max-w-5xl">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline" className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary border-primary/20 bg-primary/5 rounded-full neon-border">
              Pricing Estimator
            </Badge>
            <h2 className="text-3xl font-black text-foreground md:text-5xl tracking-tight font-headline">
              Interactive SME Fee Calculator
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Slide to adjust your business metrics and instantly see your recommended monthly compliance plan with transparent, fixed pricing.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: Sliders & Controls */}
            <div className="lg:col-span-7 glass-card rounded-3xl border border-white/[0.06] p-6 md:p-8 flex flex-col justify-between space-y-8">
              {/* Turnover Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <label className="text-sm font-black text-foreground tracking-wide uppercase">Annual Turnover</label>
                  <span className="text-lg font-black text-gradient font-headline">
                    {turnover >= 25000000 ? "R25M+" : new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR', maximumFractionDigits: 0 }).format(turnover)}
                  </span>
                </div>
                <input
                  type="range"
                  min="500000"
                  max="30000000"
                  step="500000"
                  value={turnover}
                  onChange={(e) => setTurnover(Number(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-bold">
                  <span>R500k</span>
                  <span>R7M</span>
                  <span>R15M</span>
                  <span>R25M+</span>
                </div>
              </div>

              {/* Payroll Employees Slider */}
              <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                  <label className="text-sm font-black text-foreground tracking-wide uppercase">Payroll Employees</label>
                  <span className="text-lg font-black text-gradient font-headline">
                    {payrollEmployees === 0 ? "No Staff" : `${payrollEmployees} Employees`}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={payrollEmployees}
                  onChange={(e) => {
                    setPayrollEmployees(Number(e.target.value));
                    if (Number(e.target.value) > 0) setNeedsPayroll(true);
                  }}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground font-bold">
                  <span>No Staff</span>
                  <span>15 Staff</span>
                  <span>30 Staff</span>
                  <span>50 Staff</span>
                </div>
              </div>

              {/* Additional Requirements Checkboxes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${needsVat ? 'bg-primary/5 border-primary/30' : 'bg-white/[0.01] border-white/[0.06] hover:border-white/15'}`} onClick={() => setNeedsVat(!needsVat)}>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground">VAT Registration & Returns</p>
                    <p className="text-[10px] text-muted-foreground leading-none">Bi-monthly SARS submissions</p>
                  </div>
                  <div className={`h-5 w-5 rounded border flex items-center justify-center transition-all ${needsVat ? 'bg-primary border-primary text-white' : 'border-white/20'}`}>
                    {needsVat && <Check className="h-3 w-3" />}
                  </div>
                </div>

                <div className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${needsPayroll ? 'bg-primary/5 border-primary/30' : 'bg-white/[0.01] border-white/[0.06] hover:border-white/15'}`} onClick={() => {
                  setNeedsPayroll(!needsPayroll);
                  if (needsPayroll) setPayrollEmployees(0);
                  else if (payrollEmployees === 0) setPayrollEmployees(5);
                }}>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-foreground">Monthly Payroll & PAYE</p>
                    <p className="text-[10px] text-muted-foreground leading-none">EMP201, payslips, and UIF</p>
                  </div>
                  <div className={`h-5 w-5 rounded border flex items-center justify-center transition-all ${needsPayroll ? 'bg-primary border-primary text-white' : 'border-white/20'}`}>
                    {needsPayroll && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Calculated Results Card */}
            <div className="lg:col-span-5 flex flex-col justify-between glass-card rounded-3xl border border-white/[0.08] p-6 md:p-8 bg-gradient-to-b from-white/[0.04] to-white/[0.01] shadow-2xl relative overflow-hidden group hover:border-primary/20 transition-all duration-300">
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <Badge className="bg-primary/10 text-primary border border-primary/20 font-black text-[9px] uppercase tracking-wider rounded-md">
                    Recommended Plan
                  </Badge>
                  <h3 className="text-2xl font-black text-foreground font-headline tracking-tight">{calculatedPackage.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{calculatedPackage.desc}</p>
                </div>

                <div className="border-t border-white/[0.06] pt-6 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary">Inclusions & Deliverables</p>
                  <ul className="space-y-3">
                    {calculatedPackage.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-foreground/90 font-medium">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="border-t border-white/[0.06] pt-6 mt-8 space-y-4">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Estimated Monthly Fee</span>
                    <p className="text-3xl font-black text-foreground font-headline tracking-tight">
                      {calculatedPackage.isCustom ? "Custom Quote" : calculatedPackage.priceText}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-semibold pb-1">VAT Exclusive</span>
                </div>

                <Button asChild className="w-full h-12 font-black text-sm uppercase tracking-wider bg-gradient hover:opacity-90 text-white neon-glow transition-all duration-300 shadow-xl">
                  <Link href="/contact" className="flex items-center justify-center gap-2">
                    {calculatedPackage.isCustom ? "Request Custom Quote" : "Get Started on this Plan"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CORE SERVICES SEO SECTION */}
      <section className="py-24 bg-background border-y border-white/[0.06] relative overflow-hidden">
          <div className="absolute inset-0 bg-dot-grid opacity-30" />
          <div className="container relative z-10 mx-auto px-4">
              <div className="text-center mb-16 space-y-4">
                  <h2 className="text-3xl font-black text-foreground md:text-5xl tracking-tighter font-headline">Core Business Services</h2>
                  <p className="text-muted-foreground text-lg">Specialised Accounting and Tax Compliance for the South African Market.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {/* Accounting Pillar */}
                  <Card className="glass-card border border-white/[0.06] hover:border-primary/20 hover:shadow-[0_0_30px_rgba(0,229,255,0.06)] transition-all duration-300 group">
                      <CardHeader className="pb-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:neon-glow transition-all duration-300">
                              <Calculator className="h-5 w-5" />
                          </div>
                          <CardTitle className="text-xl font-bold text-foreground">Accounting Services</CardTitle>
                          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary">Core Compliance</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <ul className="space-y-4">
                              <li className="group/item">
                                  <Link href="/monthly-accounting" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                      Monthly Accounting Services
                                  </Link>
                              </li>
                              <li className="group/item">
                                  <Link href="/annual-financial-statements" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                      Financial Statement Preparation
                                  </Link>
                              </li>
                              <li className="group/item">
                                  <Link href="/management-accounts" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                      Management Accounts
                                  </Link>
                              </li>
                              <li className="group/item">
                                  <Link href="/contact" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                      Outsourced Accounting
                                  </Link>
                              </li>
                          </ul>
                      </CardContent>
                  </Card>

                  {/* Tax Pillar */}
                  <Card className="glass-card border border-white/[0.06] hover:border-primary/20 hover:shadow-[0_0_30px_rgba(0,229,255,0.06)] transition-all duration-300 group">
                      <CardHeader className="pb-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:neon-glow transition-all duration-300">
                              <Landmark className="h-5 w-5" />
                          </div>
                          <CardTitle className="text-xl font-bold text-foreground">Tax Services</CardTitle>
                          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary">SARS Specialists</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <ul className="space-y-4">
                              <li className="group/item">
                                  <Link href="/products/vat-registration" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                      VAT Registration
                                  </Link>
                              </li>
                              <li className="group/item">
                                  <Link href="/products/vat-returns" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                      VAT Returns
                                  </Link>
                              </li>
                              <li className="group/item">
                                  <Link href="/products/tax-clearance-pin" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                      Tax Clearance
                                  </Link>
                              </li>
                              <li className="group/item">
                                  <Link href="/sars-disputes" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                      SARS Disputes
                                  </Link>
                              </li>
                              <li className="group/item">
                                  <Link href="/sars-compromise" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                      Tax Debt Relief
                                  </Link>
                              </li>
                          </ul>
                      </CardContent>
                  </Card>

                  {/* Payroll Pillar */}
                  <Card className="glass-card border border-white/[0.06] hover:border-primary/20 hover:shadow-[0_0_30px_rgba(0,229,255,0.06)] transition-all duration-300 group">
                      <CardHeader className="pb-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:neon-glow transition-all duration-300">
                              <Users className="h-5 w-5" />
                          </div>
                          <CardTitle className="text-xl font-bold text-foreground">Payroll Services</CardTitle>
                          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary">Workforce Management</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                          <p className="text-[10px] text-muted-foreground font-medium uppercase leading-tight italic">
                              Targeting Payroll Services South Africa, PAYE Submissions, and IRP5 Submissions.
                          </p>
                          <ul className="space-y-4">
                              <li className="group/item">
                                  <Link href="/monthly-payroll" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                      Payroll Outsourcing
                                  </Link>
                              </li>
                              <li className="group/item">
                                  <Link href="/paye-compliance" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                      PAYE Compliance (EMP201)
                                  </Link>
                              </li>
                              <li className="group/item">
                                  <Link href="/uif-compliance" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                      UIF & SDL Compliance
                                  </Link>
                              </li>
                              <li className="group/item">
                                  <Link href="/payroll-administration" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                      Payroll Compliance (EMP501)
                                  </Link>
                              </li>
                          </ul>
                      </CardContent>
                  </Card>

                  {/* CIPC Pillar */}
                  <Card className="glass-card border border-white/[0.06] hover:border-primary/20 hover:shadow-[0_0_30px_rgba(0,229,255,0.06)] transition-all duration-300 group">
                      <CardHeader className="pb-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:neon-glow transition-all duration-300">
                              <Building className="h-5 w-5" />
                          </div>
                          <CardTitle className="text-xl font-bold text-foreground">CIPC & Compliance</CardTitle>
                          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-primary">Entity Maintenance</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <ul className="space-y-4">
                              <li className="group/item">
                                  <Link href="/products/company-registration" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                      Company Registration
                                  </Link>
                              </li>
                              <li className="group/item">
                                  <Link href="/products/cipc-annual-returns" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                      CIPC Annual Returns
                                  </Link>
                              </li>
                              <li className="group/item">
                                  <Link href="/products/beneficial-ownership-declaration" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                      Beneficial Ownership
                                  </Link>
                              </li>
                              <li className="group/item">
                                  <Link href="/liquidations" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                      Company Liquidations
                                  </Link>
                              </li>
                          </ul>
                      </CardContent>
                  </Card>
              </div>
          </div>
      </section>

      {/* SOUTH AFRICA SEO SECTION */}
      <section className="py-24 bg-background border-t border-white/[0.06] relative overflow-hidden">
          <div className="aurora-blob aurora-cyan w-[400px] h-[400px] bottom-0 right-0 animate-aurora-drift" style={{ animationDelay: '-3s' }} />
          <div className="container relative z-10 mx-auto px-4">
              <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div className="space-y-8 text-center lg:text-left">
                      <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto lg:mx-0 neon-glow"><MapPin className="h-6 w-6" /></div>
                      
                      <div className="space-y-4">
                        <h2 className="text-3xl font-black text-foreground md:text-4xl text-center lg:text-left font-headline">Accounting & Tax Services for Businesses Across South Africa</h2>
                        <div className="space-y-4 text-lg text-muted-foreground leading-relaxed text-center lg:text-left">
                            <p>
                                My Accountant provides professional online accounting, tax, payroll, bookkeeping, and compliance services to businesses throughout South Africa. Our team assists startups, SMEs, established companies, non-profit organisations, and growing enterprises with reliable financial management, SARS compliance, payroll administration, VAT submissions, annual financial statements, and CIPC services.
                            </p>
                            <p>
                                As a modern online accounting firm, we work with clients remotely across the country, allowing businesses to access qualified accounting and tax support without needing to visit a physical office. Whether you require monthly bookkeeping, payroll processing, VAT returns, tax compliance, or outsourced accounting services, our team is equipped to assist businesses of all sizes across South Africa.
                            </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-foreground">We proudly assist businesses in:</h3>
                        <div className="grid grid-cols-2 gap-2 text-sm font-bold text-foreground/80 max-w-sm mx-auto lg:mx-0">
                            {[
                                "Johannesburg", "Randburg", "Sandton", "Midrand", 
                                "Pretoria", "Durban", "Cape Town", "Gauteng"
                            ].map((loc) => (
                                <div key={loc} className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" /> {loc}
                                </div>
                            ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-foreground">Our services include:</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm font-bold text-foreground/80 text-left">
                            {[
                                "Monthly Accounting & Bookkeeping",
                                "Payroll Processing & PAYE Submissions",
                                "VAT Registration & VAT Returns",
                                "Annual Financial Statements",
                                "Tax Returns & SARS Compliance",
                                "Tax Clearance Certificates",
                                "Company Registrations & CIPC Annual Returns",
                                "Beneficial Ownership Declarations",
                                "Outsourced Accounting Services",
                                "Management Accounts & Financial Reporting"
                            ].map((service) => (
                                <div key={service} className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> {service}
                                </div>
                            ))}
                        </div>
                      </div>

                      <p className="text-lg font-medium text-foreground/90 leading-relaxed italic text-center lg:text-left">
                        My Accountant combines technology-driven convenience with experienced financial professionals to help South African businesses remain compliant, financially organised, and focused on growth.
                      </p>
                  </div>
                  <div className="relative h-[400px] lg:h-[600px] rounded-3xl overflow-hidden border border-white/10 neon-glow">
                      <iframe
                          src="https://www.google.com/maps?q=Stonemill+Office+Park+Johannesburg&output=embed"
                          className="absolute inset-0 w-full h-full"
                          style={{ border: 0 }}
                          allowFullScreen={false}
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                      ></iframe>
                  </div>
              </div>
          </div>
      </section>

      {/* GENERAL FAQ SECTION */}
      <section className="py-24 bg-background border-t border-white/[0.06] scroll-m-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-grid opacity-20" />
        <div className="container relative z-10 mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-black text-foreground md:text-5xl uppercase tracking-tighter font-headline">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-lg">Clear answers to common client queries.</p>
          </div>
          
          {mounted ? (
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqData.map((faq, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`} className="glass-card border border-white/[0.06] rounded-xl overflow-hidden px-6 hover:border-primary/15 transition-all duration-300">
                  <AccordionTrigger className="py-4 hover:no-underline hover:text-primary transition-colors text-left font-bold text-foreground">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-6 pt-2 text-muted-foreground leading-relaxed text-sm font-medium">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="w-full space-y-4">
              {faqData.map((faq, idx) => (
                <div key={idx} className="glass-card border border-white/[0.06] rounded-xl overflow-hidden px-6 py-4">
                  <div className="font-bold text-foreground">{faq.q}</div>
                  <div className="mt-2 text-muted-foreground leading-relaxed text-sm font-medium">{faq.a}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="py-24 bg-background border-t border-white/[0.06] relative overflow-hidden">
        <div className="aurora-blob aurora-cyan w-[600px] h-[600px] -top-40 left-1/4 animate-aurora-drift" />
        <div className="aurora-blob aurora-violet w-[400px] h-[400px] bottom-0 right-1/4 animate-aurora-drift" style={{ animationDelay: '-8s' }} />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="max-w-5xl mx-auto p-12 rounded-[3rem] glass-card neon-border text-foreground relative overflow-hidden">
            <div className="absolute inset-0 bg-dot-grid opacity-30" />
            <div className="relative z-10 space-y-10">
              <h2 className="text-4xl font-black md:text-5xl lg:text-6xl text-center text-gradient font-headline">Get Professional Accounting & Compliance Support</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed text-center">
                Whether you need accounting services, tax compliance, company registration, payroll support, or CIPC assistance, My Accountant is ready to assist your business.
              </p>
              
              <div className="space-y-6">
                  <p className="text-xs font-black uppercase text-primary tracking-[0.2em]">Popular Services</p>
                  <div className="flex flex-wrap justify-center gap-3">
                      {[
                          { label: "Company Registration Services", href: "/products/company-registration" },
                          { label: "VAT Registration Services", href: "/products/vat-registration" },
                          { label: "Bookkeeping Services", href: "/products#accounting-services" },
                          { label: "Tax Clearance Certificate PIN", href: "/products/tax-clearance-pin" },
                          { label: "CIPC Annual Returns", href: "/products/cipc-annual-returns" },
                          { label: "Beneficial Ownership Services", href: "/products/beneficial-ownership-declaration" }
                      ].map(s => (
                          <Button key={s.label} variant="outline" size="sm" asChild className="h-9 border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-primary/30 text-foreground font-bold rounded-full transition-all shadow-sm">
                              <Link href={s.href}><PlusCircle className="mr-2 h-3.5 w-3.5" /> {s.label}</Link>
                          </Button>
                      ))}
                  </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
                <Button asChild size="lg" className="h-14 px-10 text-lg font-bold shadow-xl bg-gradient hover:opacity-90 text-white neon-glow transition-all duration-300">
                  <Link href="/products">View Services</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 px-10 text-lg font-bold border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-primary/30 text-foreground transition-all duration-300">
                  <Link href="/compliance">Request a Compliance Assessment</Link>
                </Button>
                <Button asChild variant="secondary" size="lg" className="h-14 px-10 text-lg font-bold bg-secondary hover:bg-secondary/80 text-foreground transition-all duration-300">
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STICKY CONVERSION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 glass-nav border-t border-white/[0.06] p-3 md:hidden animate-in slide-in-from-bottom duration-500">
          <div className="grid grid-cols-1 gap-2">
              <Button asChild className="h-10 text-xs font-black uppercase tracking-widest bg-gradient hover:opacity-90 text-white neon-glow">
                  <Link href="/signup">Get Started Now</Link>
              </Button>
          </div>
      </div>
    </div>
  );
}
