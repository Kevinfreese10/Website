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
  Lock,
  Star,
  CalendarDays,
  ExternalLink
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

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { KEVIN_FREESE_PROFILE_IMAGE } from '@/lib/constants';
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



  const trustIndicators = [
    { label: "Trusted by South African Businesses", icon: CheckCircle, color: "text-blue-500" },
    { label: "Professional Accounting & Compliance Support", icon: ShieldCheck, color: "text-emerald-500" },
    { label: "Online Service Delivery Nationwide", icon: Globe, color: "text-purple-500" },
    { label: "Transparent Pricing", icon: Wallet, color: "text-amber-500" },
    { label: "Secure Document Submission", icon: ShieldCheck, color: "text-rose-500" }
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


  return (
    <div className="flex flex-col min-h-screen bg-background">
      
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
            {/* Center Column: Text Content */}
            <div className="lg:col-span-12 flex flex-col items-center text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-md glass neon-border text-xs font-semibold text-primary uppercase tracking-widest">
                <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
                AI-Powered Accounting Platform
              </div>
              <h1 className="mb-6 text-4xl font-black tracking-tight md:text-5xl lg:text-6xl xl:text-7xl font-headline leading-tight text-hero-gradient pb-2">
                Online <span className="text-gradient">Accounting, Tax & Payroll</span> Services in South Africa
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Streamline your business with our cloud-based accounting, payroll, and compliance solutions.
                Built for South African entrepreneurs who demand efficiency and transparency.
              </p>

              <div className="flex flex-col items-center gap-3">
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
                  <Button asChild size="lg" className="h-auto min-h-14 py-3.5 px-6 sm:px-8 text-base font-bold shadow-xl bg-gradient hover:opacity-90 text-white neon-glow transition-all duration-300 text-center">
                    <Link href="/products">Visit Our Online Store</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-auto min-h-14 py-3.5 px-6 sm:px-8 text-base font-bold shadow-xl border-white/10 hover:bg-white/5 transition-all duration-300 text-center">
                    <Link href="/contact">Book Free Consultation</Link>
                  </Button>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-primary/90 flex items-center justify-center gap-1.5 pt-1.5 max-w-xl mx-auto">
                  <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse shrink-0" />
                  <span>Explore 75+ accounting & tax services with transparent fixed prices and clear completion times in our online store.</span>
                </p>
              </div>
            </div>
          </div>

          {/* LOGO CREDIBILITY RIBBON */}
          <div className="mt-16 border-t border-white/[0.06] pt-8 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center mb-6">
              Accredited Professional Memberships & Regulatory Compliance
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60 hover:opacity-90 transition-opacity duration-300">
              {/* CIBA Badge */}
              <div className="flex items-center gap-2 text-foreground font-black tracking-tight text-sm">
                <div className="h-7 w-7 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"><Building className="h-4 w-4 text-blue-500" /></div>
                <div className="flex flex-col text-left">
                  <span className="leading-none text-xs">CIBA Member</span>
                  <span className="text-[8px] text-muted-foreground font-medium">Biz Accountant</span>
                </div>
              </div>
              {/* SAIT Badge */}
              <div className="flex items-center gap-2 text-foreground font-black tracking-tight text-sm">
                <div className="h-7 w-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><Landmark className="h-4 w-4 text-emerald-500" /></div>
                <div className="flex flex-col text-left">
                  <span className="leading-none text-xs">SAIT Member</span>
                  <span className="text-[8px] text-muted-foreground font-medium">Tax Practitioner</span>
                </div>
              </div>
              {/* SAICA Badge */}
              <div className="flex items-center gap-2 text-foreground font-black tracking-tight text-sm">
                <div className="h-7 w-7 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center"><ShieldCheck className="h-4 w-4 text-indigo-500" /></div>
                <div className="flex flex-col text-left">
                  <span className="leading-none text-xs">SAICA Affiliate</span>
                  <span className="text-[8px] text-muted-foreground font-medium">Chartered Accounting</span>
                </div>
              </div>
              {/* SARS Badge */}
              <div className="flex items-center gap-2 text-foreground font-black tracking-tight text-sm">
                <div className="h-7 w-7 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-500">S</div>
                <div className="flex flex-col text-left">
                  <span className="leading-none text-xs">SARS Registered</span>
                  <span className="text-[8px] text-muted-foreground font-medium">Tax Practitioners</span>
                </div>
              </div>
              {/* CIPC Badge */}
              <div className="flex items-center gap-2 text-foreground font-black tracking-tight text-sm">
                <div className="h-7 w-7 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center"><Building className="h-4 w-4 text-purple-500" /></div>
                <div className="flex flex-col text-left">
                  <span className="leading-none text-xs">CIPC Agent</span>
                  <span className="text-[8px] text-muted-foreground font-medium">Company Registry</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      <div id="reviews" className="scroll-m-20">
        <TrustIndexWidget />
        <div className="text-center -mt-4 mb-4">
          <a
            href="https://www.google.com/maps?q=My+Accountant,+Stonemill+Office+Park,+300+Acacia+Road,+Darrenwood,+Johannesburg"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            Verified Google Reviews • View our Google Business Profile & Ratings on Google Maps <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 my-8 glass-card rounded-xl p-8 text-center">
                <div className="space-y-2">
                  <p className="text-4xl md:text-5xl font-black text-blue-600 animate-glow-pulse">10,000+</p>
                  <p className="text-sm font-bold text-foreground/80">Company Registrations</p>
                  <p className="text-xs text-muted-foreground leading-normal">Successfully registered and compliant businesses nationwide.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-4xl md:text-5xl font-black text-emerald-600 animate-glow-pulse" style={{ animationDelay: '0.5s' }}>R120M+</p>
                  <p className="text-sm font-bold text-foreground/80">Tax Savings & Debt Relief</p>
                  <p className="text-xs text-muted-foreground leading-normal">Legally negotiated debt compromise & tax structures for SA SMEs.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-4xl md:text-5xl font-black text-indigo-600 animate-glow-pulse" style={{ animationDelay: '1s' }}>99.7%</p>
                  <p className="text-sm font-bold text-foreground/80">SARS Acceptance Rate</p>
                  <p className="text-xs text-muted-foreground leading-normal">Accurate submissions resulting in immediate system approvals.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-4xl md:text-5xl font-black text-amber-600 animate-glow-pulse" style={{ animationDelay: '1.5s' }}>200+</p>
                  <p className="text-sm font-bold text-foreground/80">5-Star Google Reviews</p>
                  <p className="text-xs text-muted-foreground leading-normal">Highest rated online business accountant in South Africa.</p>
                </div>
              </div>

              <p>
                My Accountant is backed by strong client satisfaction and has earned over 200+ 5-star Google reviews from businesses across South Africa. <Link href="#reviews" className="text-primary hover:underline font-bold">View our client feedback</Link> or verify our reviews directly on <a href="https://www.google.com/maps?q=My+Accountant,+Stonemill+Office+Park,+300+Acacia+Road,+Darrenwood,+Johannesburg" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold inline-flex items-center gap-1">Google Maps <ExternalLink className="h-3 w-3 inline" /></a>.
              </p>

              {/* Expert Quotation Section */}
              <div className="max-w-5xl mx-auto my-12 glass-card rounded-xl border border-white/[0.06] overflow-hidden p-6 md:p-10 text-left relative group">
                <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 rounded-full filter blur-3xl pointer-events-none" />
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  {/* Left Column: Avatar & Credentials */}
                  <div className="md:col-span-4 flex flex-col items-center text-center p-6 bg-white/[0.01] border border-white/[0.04] rounded-xl">
                    <img
                      src={KEVIN_FREESE_PROFILE_IMAGE}
                      alt="Kevin Freese - Managing Director & Founder"
                      className="h-24 w-24 rounded-full object-cover border-4 border-white/20 shadow-xl shrink-0 mb-4"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/kevin-freese.jpg';
                      }}
                    />
                    <h3 className="text-lg font-black text-foreground">Kevin Freese</h3>
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
                From startups and small businesses to established companies operating across Johannesburg, Randburg, Gauteng, and throughout South Africa, My Accountant remains committed to helping businesses stay compliant, organised, and financially supported through every stage of growth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BEST SELLERS SECTION */}
      <section className="py-20 bg-secondary/50 border-t border-b border-white/[0.06] relative overflow-hidden">
        <div className="aurora-blob aurora-violet w-[300px] h-[300px] -bottom-20 -right-20 animate-aurora-drift" style={{ animationDelay: '-7s' }} />
        <div className="container relative z-10 mx-auto px-4 max-w-6xl">
          {/* Trust indicator badges */}
          <div className="mb-16 grid grid-cols-2 md:grid-cols-5 gap-4 max-w-5xl mx-auto border-b border-primary/20 pb-8">
              {trustIndicators.map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 text-muted-foreground">
                      <item.icon className={`h-5 w-5 ${item.color} animate-glow-pulse`} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-tight">{item.label}</span>
                  </div>
              ))}
          </div>

          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline" className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary border-primary/20 bg-primary/5 rounded-md neon-border">
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
            <Card
              className="flex flex-col overflow-hidden transition-all duration-500 border border-blue-200/90 bg-[#f4f8ff] group shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 hover:border-primary/40 rounded-xl"
            >
              <CardHeader className="pb-3 relative">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="w-fit text-[9px] uppercase tracking-wider font-extrabold rounded-md px-2 py-0.5 flex items-center bg-white text-purple-700 border border-purple-200/80 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full mr-1.5 animate-pulse bg-purple-500" />
                    CIPC & Compliance
                  </Badge>
                </div>

                <CardTitle className="leading-snug text-slate-800 text-[16px] font-black group-hover:text-primary transition-colors duration-300 pr-14 mt-2">
                  <Link href="/products/ncr-registration" className="hover:underline line-clamp-2">
                    NCR Registration
                  </Link>
                </CardTitle>

                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="flex items-center text-amber-400">
                    <Star className="h-3 w-3 fill-amber-400" />
                    <Star className="h-3 w-3 fill-amber-400" />
                    <Star className="h-3 w-3 fill-amber-400" />
                    <Star className="h-3 w-3 fill-amber-400" />
                    <Star className="h-3 w-3 fill-amber-400" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">
                    5.0 (120+)
                  </span>
                </div>

                <div className="mt-3 flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xl font-black text-slate-900 block">
                      {getServicePrice('ncr-registration', 'R1,400')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50/80 border border-emerald-200/80 rounded-lg px-2.5 py-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-emerald-600 flex-none" />
                    <span className="text-[11px] font-bold text-emerald-700">15-20 days</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-grow pt-0 pb-3">
                <div className="mt-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">What's Included</p>
                  <ul className="text-xs text-slate-600 leading-relaxed space-y-1.5">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 mt-0.5 text-emerald-600 flex-none" />
                      <span className="line-clamp-1">Full CIPC & SARS vetting</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 mt-0.5 text-emerald-600 flex-none" />
                      <span className="line-clamp-1">Drafting of NCR application forms</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 mt-0.5 text-emerald-600 flex-none" />
                      <span className="line-clamp-1">Submission & liaison with officers</span>
                    </li>
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="pt-0 pb-4 px-6">
                <Button
                  asChild
                  size="sm"
                  variant="default"
                  className="w-full font-bold h-10 text-xs rounded-xl shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all duration-300 active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Link href="/products/ncr-registration" className="group/btn flex items-center justify-center gap-1.5">
                    View Service & Prerequisites
                    <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Accountant's Letter Card */}
            <Card
              className="flex flex-col overflow-hidden transition-all duration-500 border border-blue-200/90 bg-[#f4f8ff] group shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 hover:border-primary/40 rounded-xl"
            >
              <CardHeader className="pb-3 relative">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="w-fit text-[9px] uppercase tracking-wider font-extrabold rounded-md px-2 py-0.5 flex items-center bg-white text-blue-700 border border-blue-200/80 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full mr-1.5 animate-pulse bg-blue-600" />
                    Accounting Services
                  </Badge>
                </div>

                <CardTitle className="leading-snug text-slate-800 text-[16px] font-black group-hover:text-primary transition-colors duration-300 pr-14 mt-2">
                  <Link href="/products/accountants-letter" className="hover:underline line-clamp-2">
                    Accountant's Letter
                  </Link>
                </CardTitle>

                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="flex items-center text-amber-400">
                    <Star className="h-3 w-3 fill-amber-400" />
                    <Star className="h-3 w-3 fill-amber-400" />
                    <Star className="h-3 w-3 fill-amber-400" />
                    <Star className="h-3 w-3 fill-amber-400" />
                    <Star className="h-3 w-3 fill-amber-400" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">
                    5.0 (120+)
                  </span>
                </div>

                <div className="mt-3 flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xl font-black text-slate-900 block">
                      {getServicePrice('accountants-letter', 'R1,200')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50/80 border border-emerald-200/80 rounded-lg px-2.5 py-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-emerald-600 flex-none" />
                    <span className="text-[11px] font-bold text-emerald-700">1-2 days</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-grow pt-0 pb-3">
                <div className="mt-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">What's Included</p>
                  <ul className="text-xs text-slate-600 leading-relaxed space-y-1.5">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 mt-0.5 text-emerald-600 flex-none" />
                      <span className="line-clamp-1">Verified assets & liabilities</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 mt-0.5 text-emerald-600 flex-none" />
                      <span className="line-clamp-1">CIBA/SAIT official letterhead</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 mt-0.5 text-emerald-600 flex-none" />
                      <span className="line-clamp-1">Accepted by all SA banks & SARS</span>
                    </li>
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="pt-0 pb-4 px-6">
                <Button
                  asChild
                  size="sm"
                  variant="default"
                  className="w-full font-bold h-10 text-xs rounded-xl shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all duration-300 active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Link href="/products/accountants-letter" className="group/btn flex items-center justify-center gap-1.5">
                    View Service & Prerequisites
                    <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Tax Clearance Pin Card */}
            <Card
              className="flex flex-col overflow-hidden transition-all duration-500 border border-blue-200/90 bg-[#f4f8ff] group shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_-5px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 hover:border-primary/40 rounded-xl"
            >
              <CardHeader className="pb-3 relative">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="w-fit text-[9px] uppercase tracking-wider font-extrabold rounded-md px-2 py-0.5 flex items-center bg-white text-emerald-700 border border-emerald-200/80 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full mr-1.5 animate-pulse bg-emerald-500" />
                    SARS Services
                  </Badge>
                </div>

                <CardTitle className="leading-snug text-slate-800 text-[16px] font-black group-hover:text-primary transition-colors duration-300 pr-14 mt-2">
                  <Link href="/products/tax-clearance-pin" className="hover:underline line-clamp-2">
                    Tax Clearance Pin
                  </Link>
                </CardTitle>

                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="flex items-center text-amber-400">
                    <Star className="h-3 w-3 fill-amber-400" />
                    <Star className="h-3 w-3 fill-amber-400" />
                    <Star className="h-3 w-3 fill-amber-400" />
                    <Star className="h-3 w-3 fill-amber-400" />
                    <Star className="h-3 w-3 fill-amber-400" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">
                    5.0 (120+)
                  </span>
                </div>

                <div className="mt-3 flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xl font-black text-slate-900 block">
                      {getServicePrice('tax-clearance-pin', 'R350')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-50/80 border border-emerald-200/80 rounded-lg px-2.5 py-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-emerald-600 flex-none" />
                    <span className="text-[11px] font-bold text-emerald-700">1-2 days</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-grow pt-0 pb-3">
                <div className="mt-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">What's Included</p>
                  <ul className="text-xs text-slate-600 leading-relaxed space-y-1.5">
                    <li className="flex items-start">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 mt-0.5 text-emerald-600 flex-none" />
                      <span className="line-clamp-1">Verified SARS compliance status</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 mt-0.5 text-emerald-600 flex-none" />
                      <span className="line-clamp-1">Tender-ready compliant PIN</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2 mt-0.5 text-emerald-600 flex-none" />
                      <span className="line-clamp-1">Active verification link</span>
                    </li>
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="pt-0 pb-4 px-6">
                <Button
                  asChild
                  size="sm"
                  variant="default"
                  className="w-full font-bold h-10 text-xs rounded-xl shadow-md bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all duration-300 active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Link href="/products/tax-clearance-pin" className="group/btn flex items-center justify-center gap-1.5">
                    View Service & Prerequisites
                    <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
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
                  <Card className="border-t-4 border-t-blue-500 border border-blue-200/90 bg-[#f4f8ff] hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-300 group">
                      <CardHeader className="pb-3">
                          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 mb-3 group-hover:scale-110 transition-transform duration-300">
                              <Calculator className="h-5 w-5" />
                          </div>
                          <CardTitle className="text-xl font-bold text-foreground">Accounting Services</CardTitle>
                          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-blue-500">Core Compliance</CardDescription>
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
                  <Card className="border-t-4 border-t-emerald-500 border border-blue-200/90 bg-[#f4f8ff] hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] transition-all duration-300 group">
                      <CardHeader className="pb-3">
                          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3 group-hover:scale-110 transition-transform duration-300">
                              <Landmark className="h-5 w-5" />
                          </div>
                          <CardTitle className="text-xl font-bold text-foreground">Tax Services</CardTitle>
                          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">SARS Specialists</CardDescription>
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
                                  <Link href="/products/periodic-vat-calculation-and-submission" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
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
                  <Card className="border-t-4 border-t-amber-500 border border-blue-200/90 bg-[#f4f8ff] hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] transition-all duration-300 group">
                      <CardHeader className="pb-3">
                          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 mb-3 group-hover:scale-110 transition-transform duration-300">
                              <Users className="h-5 w-5" />
                          </div>
                          <CardTitle className="text-xl font-bold text-foreground">Payroll Services</CardTitle>
                          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Workforce Management</CardDescription>
                      </CardHeader>
                      <CardContent>
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
                  <Card className="border-t-4 border-t-purple-500 border border-blue-200/90 bg-[#f4f8ff] hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] transition-all duration-300 group">
                      <CardHeader className="pb-3">
                          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 mb-3 group-hover:scale-110 transition-transform duration-300">
                              <Building className="h-5 w-5" />
                          </div>
                          <CardTitle className="text-xl font-bold text-foreground">CIPC & Compliance</CardTitle>
                          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-purple-500">Entity Maintenance</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <ul className="space-y-4">
                              <li className="group/item">
                                  <Link href="/products/private-company-registration" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
                                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                      Company Registration
                                  </Link>
                              </li>
                              <li className="group/item">
                                  <Link href="/products/annual-returns" className="text-sm font-bold text-foreground/80 hover:text-primary transition-colors flex items-center gap-2">
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



      {/* GENERAL FAQ SECTION */}
      <section className="py-24 bg-background border-t border-white/[0.06] scroll-m-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-dot-grid opacity-20" />
        <div className="container relative z-10 mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl font-black text-foreground md:text-5xl uppercase tracking-tighter font-headline">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-lg">Clear answers to common client queries.</p>
          </div>
          
          {mounted ? (
            <div className="w-full space-y-6">
          {faqData.map((faq, idx) => (
            <div key={idx} className="border-b border-border pb-6 last:border-0">
              <h3 className="text-lg font-bold text-foreground mb-2">
                {faq.q}
              </h3>
              <div className="text-slate-600 leading-relaxed">
                {faq.a}
              </div>
            </div>
          ))}
        </div>
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
      <section className="py-24 pb-36 md:pb-24 bg-background border-t border-white/[0.06] relative overflow-hidden">
        <div className="aurora-blob aurora-cyan w-[600px] h-[600px] -top-40 left-1/4 animate-aurora-drift" />
        <div className="aurora-blob aurora-violet w-[400px] h-[400px] bottom-0 right-1/4 animate-aurora-drift" style={{ animationDelay: '-8s' }} />
        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="max-w-5xl mx-auto p-6 sm:p-12 rounded-xl sm:rounded-xl glass-card neon-border text-foreground relative overflow-hidden">
            <div className="absolute inset-0 bg-dot-grid opacity-30" />
            <div className="relative z-10 space-y-10">
              <h2 className="text-3xl sm:text-4xl font-black md:text-5xl lg:text-6xl text-center text-gradient font-headline">Get Professional Accounting & Compliance Support</h2>
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed text-center">
                Whether you need accounting services, tax compliance, company registration, payroll support, or CIPC assistance, My Accountant is ready to assist your business.
              </p>
              
              <div className="space-y-6">
                  <p className="text-xs font-black uppercase text-primary tracking-[0.2em]">Popular Services</p>
                  <div className="flex flex-wrap justify-center gap-3">
                      {[
                          { label: "Company Registration Services", href: "/products/private-company-registration" },
                          { label: "VAT Registration Services", href: "/products/vat-registration" },
                          { label: "Bookkeeping Services", href: "/products#accounting-services" },
                          { label: "Tax Clearance Certificate PIN", href: "/products/tax-clearance-pin" },
                          { label: "CIPC Annual Returns", href: "/products/annual-returns" },
                          { label: "Beneficial Ownership Services", href: "/products/beneficial-ownership-declaration" }
                      ].map(s => (
                          <Button key={s.label} variant="outline" size="sm" asChild className="h-9 border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-primary/30 text-foreground font-bold rounded-full transition-all shadow-sm">
                              <Link href={s.href}><PlusCircle className="mr-2 h-3.5 w-3.5" /> {s.label}</Link>
                          </Button>
                      ))}
                  </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-4 pt-8 max-w-2xl mx-auto">
                <Button asChild size="lg" className="h-auto min-h-14 py-3.5 px-6 sm:px-10 text-base sm:text-lg font-bold shadow-xl bg-gradient hover:opacity-90 text-white neon-glow transition-all duration-300 text-center">
                  <Link href="/products">View Services</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-auto min-h-14 py-3.5 px-4 sm:px-8 text-base sm:text-lg font-bold border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-primary/30 text-foreground transition-all duration-300 text-center whitespace-normal leading-tight">
                  <Link href="/compliance">Request a Compliance Assessment</Link>
                </Button>
                <Button asChild variant="secondary" size="lg" className="h-auto min-h-14 py-3.5 px-6 sm:px-10 text-base sm:text-lg font-bold bg-secondary hover:bg-secondary/80 text-foreground transition-all duration-300 text-center">
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
                  <Link href="/products">Visit our online store</Link>
              </Button>
          </div>
      </div>
    </div>
  );
}
