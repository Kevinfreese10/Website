'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Rocket,
  ShieldCheck,
  Bot,
  Cpu,
  Briefcase,
  Users,
  GraduationCap,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  ShoppingBag,
  CheckCircle,
  Scale,
  Loader2,
  ExternalLink,
  BadgeDollarSign,
  Search,
  Calculator,
  Lock,
  Layers,
  Sparkles,
  FileCheck2,
  UserCheck,
  Check,
  X,
  HelpCircle,
} from 'lucide-react';
import dynamicImport from 'next/dynamic';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getFirestore, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase';
import { Service } from '@/lib/types';
import PageHero from '@/components/shared/PageHero';
import { KEVIN_FREESE_PROFILE_IMAGE } from '@/lib/constants';
import {
  PARTNER_TIER_PLANS,
  getPartnerServicePrice,
  NormalizedPartnerTier,
} from '@/lib/partner-pricing';

const TrustIndexWidget = dynamicImport(() => import('@/components/shared/TrustIndexWidget'), {
  ssr: false,
});

const CommunityCarouselWidget = dynamicImport(
  () => import('@/components/become-a-partner/CommunityCarouselWidget'),
  {
    ssr: false,
  }
);

const JobsBoardCarouselWidget = dynamicImport(
  () => import('@/components/become-a-partner/JobsBoardCarouselWidget'),
  {
    ssr: false,
  }
);

const db = getFirestore(firebaseApp);

function PartnerPricingDialog({
  variant = 'button',
}: {
  variant?: 'button' | 'inline';
}) {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTier, setSelectedTier] = useState<NormalizedPartnerTier>('practice');

  const fetchPricing = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'services'), orderBy('title'));
      const snap = await getDocs(q);
      setServices(snap.docs.map((doc) => ({ ...doc.data(), id: doc.id } as Service)));
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && services.length === 0) {
      fetchPricing();
    }
  }, [isOpen, services.length]);

  const filteredServices = services.filter(
    (s: Service) =>
      s.price > 0 &&
      !s.isPriceTbc &&
      (s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {variant === 'inline' ? (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-primary font-bold text-xs mt-2.5 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/15 transition-colors ml-8"
          >
            <Calculator className="h-3.5 w-3.5" />
            View Full Partner Wholesale Price List
            <ExternalLink className="h-3 w-3" />
          </button>
        ) : (
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-12 px-6 font-bold gap-2 border-2 border-primary/30 text-primary hover:bg-primary/5 shadow-sm"
          >
            <Calculator className="h-5 w-5 text-primary" />
            Explore Live Wholesale Price List (10% / 30% / 50% Off)
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[88vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 bg-slate-50 border-b shrink-0">
          <div className="flex items-center gap-2">
            <BadgeDollarSign className="h-6 w-6 text-primary" />
            <DialogTitle className="text-2xl font-bold">Wholesale Partner Pricing Catalog</DialogTitle>
          </div>
          <DialogDescription>
            Compare our standard retail prices against your Partner wholesale rate across all three tiers. Bill your clients retail (or your own custom fee) and keep the full margin.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 border-b bg-white">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search 80+ statutory, tax & accounting services..."
              className="pl-10 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg">
            {(['starter', 'practice', 'enterprise'] as NormalizedPartnerTier[]).map((tierKey) => {
              const plan = PARTNER_TIER_PLANS[tierKey];
              const active = selectedTier === tierKey;
              return (
                <button
                  key={tierKey}
                  type="button"
                  onClick={() => setSelectedTier(tierKey)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {plan.name} ({plan.discountPercent}% Off)
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-grow overflow-hidden px-6 py-2 bg-white">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Fetching latest wholesale catalog...</p>
            </div>
          ) : (
            <ScrollArea className="h-full pr-4">
              <div className="border rounded-lg overflow-hidden my-4">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="w-[35%]">Service Description</TableHead>
                      <TableHead className="text-right">Retail Price</TableHead>
                      <TableHead className="text-right">Starter (10% Off)</TableHead>
                      <TableHead className="text-right">Practice (30% Off)</TableHead>
                      <TableHead className="text-right">Enterprise (50% Off)</TableHead>
                      <TableHead className="text-right text-emerald-600 font-bold">
                        Your Margin ({PARTNER_TIER_PLANS[selectedTier].name})
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredServices.map((service) => {
                      const retailPrice = service.price;
                      const starterPrice = getPartnerServicePrice(service, 'starter');
                      const practicePrice = getPartnerServicePrice(service, 'practice');
                      const enterprisePrice = getPartnerServicePrice(service, 'enterprise');
                      const activeWholesale = getPartnerServicePrice(service, selectedTier);
                      const profit = Math.max(0, retailPrice - activeWholesale);

                      return (
                        <TableRow key={service.id}>
                          <TableCell>
                            <div className="font-semibold text-sm">{service.title}</div>
                            <Badge variant="outline" className="text-[10px] font-normal mt-0.5">
                              {service.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium text-muted-foreground">
                            R{retailPrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            R{starterPrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-primary">
                            R{practicePrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-emerald-700 font-bold">
                            R{enterprisePrice.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right font-bold text-emerald-600 font-mono">
                            +R{profit.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PracticeRoiCalculator() {
  const [accountingClients, setAccountingClients] = useState(6);
  const [payrollClients, setPayrollClients] = useState(6);
  const [monthlyOrders, setMonthlyOrders] = useState(4);
  const avgOrderRetail = 2200; // Average retail value ofAFS / Tax Clearance / COIDA / CIPC bundle

  const selectedTier: NormalizedPartnerTier = useMemo(() => {
    if (accountingClients > 10 || payrollClients > 10 || monthlyOrders >= 12) {
      return 'enterprise';
    }
    if (accountingClients > 1 || payrollClients > 1 || monthlyOrders >= 2) {
      return 'practice';
    }
    return 'starter';
  }, [accountingClients, payrollClients, monthlyOrders]);

  const plan = PARTNER_TIER_PLANS[selectedTier];
  const monthlyRetailVolume = monthlyOrders * avgOrderRetail;
  const wholesaleMarginEarned = Math.round(monthlyRetailVolume * (plan.discountPercent / 100));
  // Typical SA cloud accounting + payroll software cost per client (R350 accounting + R150 payroll)
  const softwareValueReplaced = accountingClients * 350 + payrollClients * 150;
  const totalMonthlyValue = wholesaleMarginEarned + softwareValueReplaced;
  const netMonthlyBenefit = totalMonthlyValue - plan.monthlyPrice;

  return (
    <Card className="max-w-5xl mx-auto border-2 border-primary/20 shadow-xl overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-primary/5">
      <CardHeader className="border-b bg-slate-900 text-white p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] uppercase tracking-widest font-bold w-fit">
              Interactive Practice Calculator
            </Badge>
            <CardTitle className="text-2xl md:text-3xl font-black text-white">
              Calculate Your Monthly Practice Savings & Profit
            </CardTitle>
            <CardDescription className="text-slate-300 text-sm">
              Slide the bars below to see how your wholesale service margin and included AI software pay for your subscription many times over.
            </CardDescription>
          </div>
          <div className="shrink-0 bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-right">
            <p className="text-[10px] uppercase tracking-widest text-slate-300 font-bold">
              Recommended Plan
            </p>
            <p className="text-lg font-black text-emerald-400">
              {plan.name} ({plan.monthlyPrice === 0 ? 'Free' : `R${plan.monthlyPrice.toLocaleString('en-ZA')}/pm`})
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Sliders */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2.5 p-4 rounded-xl bg-white border shadow-sm">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-primary" />
                  Active AI Accounting Clients
                </label>
                <span className="text-base font-black text-primary bg-primary/10 px-3 py-0.5 rounded-full">
                  {accountingClients} {accountingClients === 1 ? 'Client' : 'Clients'}
                </span>
              </div>
              <Slider
                value={[accountingClients]}
                min={1}
                max={35}
                step={1}
                onValueChange={(val) => setAccountingClients(val[0])}
              />
              <p className="text-[11px] text-muted-foreground">
                Replaces ~R350/pm per client in third-party accounting & bank extraction software.
              </p>
            </div>

            <div className="space-y-2.5 p-4 rounded-xl bg-white border shadow-sm">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Users className="h-4 w-4 text-violet-600" />
                  Active AI Payroll Clients
                </label>
                <span className="text-base font-black text-violet-700 bg-violet-500/10 px-3 py-0.5 rounded-full">
                  {payrollClients} {payrollClients === 1 ? 'Client' : 'Clients'}
                </span>
              </div>
              <Slider
                value={[payrollClients]}
                min={1}
                max={35}
                step={1}
                onValueChange={(val) => setPayrollClients(val[0])}
              />
              <p className="text-[11px] text-muted-foreground">
                Replaces ~R150/pm per client in cloud payroll licenses (EMP201, UIF, SDL & payslips).
              </p>
            </div>

            <div className="space-y-2.5 p-4 rounded-xl bg-white border shadow-sm">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-emerald-600" />
                  Monthly Back-Office Orders (AFS, Tax, COIDA, CIPC)
                </label>
                <span className="text-base font-black text-emerald-700 bg-emerald-500/10 px-3 py-0.5 rounded-full">
                  {monthlyOrders} {monthlyOrders === 1 ? 'Order / mo' : 'Orders / mo'}
                </span>
              </div>
              <Slider
                value={[monthlyOrders]}
                min={0}
                max={25}
                step={1}
                onValueChange={(val) => setMonthlyOrders(val[0])}
              />
              <p className="text-[11px] text-muted-foreground">
                Based on an average retail service fee of R{avgOrderRetail.toLocaleString('en-ZA')} per statutory/compliance order.
              </p>
            </div>
          </div>

          {/* Results Box */}
          <div className="lg:col-span-5 bg-slate-900 text-white rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="space-y-3 border-b border-slate-800 pb-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Your Wholesale Discount ({plan.discountPercent}% Off):</span>
                <span className="font-mono font-bold text-emerald-400">
                  +R{wholesaleMarginEarned.toLocaleString('en-ZA')} / mo
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Software Licenses Replaced:</span>
                <span className="font-mono font-bold text-blue-400">
                  +R{softwareValueReplaced.toLocaleString('en-ZA')} / mo
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">{plan.name} Subscription Cost:</span>
                <span className="font-mono font-bold text-slate-300">
                  -R{plan.monthlyPrice.toLocaleString('en-ZA')} / mo
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold">
                Estimated Monthly Value & Margin Gain
              </p>
              <p className="text-4xl font-black text-white font-mono">
                R{Math.max(0, netMonthlyBenefit).toLocaleString('en-ZA')}
                <span className="text-sm font-normal text-slate-400"> / month</span>
              </p>
              <p className="text-xs text-slate-400 pt-1">
                Plus you keep 100% of your monthly accounting & payroll retainer fees charged to your clients.
              </p>
            </div>

            <Button asChild size="lg" className="w-full font-bold h-12 bg-emerald-600 hover:bg-emerald-500 text-white">
              <Link href={`/partner-signup?tier=${selectedTier}`}>
                Start with {plan.name} ({plan.monthlyPrice === 0 ? 'Free' : `R${plan.monthlyPrice.toLocaleString('en-ZA')}/pm`})
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const challenges = [
  {
    title: 'Limited Service Range',
    description:
      'Offering only bookkeeping services limits your earning potential. Sell our full suite — from company registration to VAT, COIDA, CIDB, NCR, and more.',
    icon: Briefcase,
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-100/80',
    hoverBorderClass: 'hover:border-blue-500/30',
    iconClass: 'text-blue-600',
    barClass: 'bg-blue-500',
  },
  {
    title: 'Lack of Mentorship',
    description:
      'Many bookkeepers work alone. We provide mentorship from senior accountants and industry experts who help you grow your capabilities.',
    icon: GraduationCap,
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-100/80',
    hoverBorderClass: 'hover:border-amber-500/30',
    iconClass: 'text-amber-600',
    barClass: 'bg-amber-500',
  },
  {
    title: 'Technology Gaps',
    description:
      'Without proper systems, document management is messy. Get our cloud-based dashboard to manage and outsource client orders seamlessly.',
    icon: Cpu,
    bgClass: 'bg-violet-500/10',
    borderClass: 'border-violet-100/80',
    hoverBorderClass: 'hover:border-violet-500/30',
    iconClass: 'text-violet-600',
    barClass: 'bg-violet-500',
  },
  {
    title: 'Manual Operations & Quoting',
    description:
      'Quoting manually and chasing EFTs is a time-sink. Your back-office partner portal automates wholesale purchasing, PayFast billing, and client tracking.',
    icon: ShoppingBag,
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-100/80',
    hoverBorderClass: 'hover:border-emerald-500/30',
    iconClass: 'text-emerald-600',
    barClass: 'bg-emerald-500',
  },
  {
    title: 'Capacity Constraints',
    description:
      'Handling large clients alone isn’t easy. Our qualified team handles your overflow work securely, accurately, and on time.',
    icon: Users,
    bgClass: 'bg-cyan-500/10',
    borderClass: 'border-cyan-100/80',
    hoverBorderClass: 'hover:border-cyan-500/30',
    iconClass: 'text-cyan-600',
    barClass: 'bg-cyan-500',
  },
  {
    title: 'Compliance Overwhelm',
    description:
      'Advanced statutory rules can be deterring. We provide ready-to-use templates and guides to help you stay compliant and confident.',
    icon: ShieldAlert,
    bgClass: 'bg-rose-500/10',
    borderClass: 'border-rose-100/80',
    hoverBorderClass: 'hover:border-rose-500/30',
    iconClass: 'text-rose-600',
    barClass: 'bg-rose-500',
  },
];

const howItWorksSteps = [
  {
    step: '01',
    icon: Layers,
    title: 'Onboard Your Practice & Clients',
    description:
      'Create your Partner Portal account in 60 seconds. Load your accounting and payroll clients into the AI engine and organize your firm’s recurring deadlines in the Practice Task Manager.',
  },
  {
    step: '02',
    icon: Briefcase,
    title: 'Order Any of 80+ Services at Wholesale',
    description:
      'Need Annual Financial Statements, a SARS dispute, COIDA Letter of Good Standing, or NCR/CIDB registration? Place a back-office order using just a Client Reference Name at 10%, 30%, or 50% off.',
  },
  {
    step: '03',
    icon: ShieldCheck,
    title: 'We Execute & Sign Off Behind the Scenes',
    description:
      'Our qualified CIBA, SAIT, and CA(SA) specialists fulfill the order discreetly in the background. We never contact your client — every status update and document request comes strictly to you.',
  },
  {
    step: '04',
    icon: TrendingUp,
    title: 'Deliver to Your Client & Keep the Margin',
    description:
      'Download the completed certificates, tax clearances, or signed financial statements from your portal, present them to your client, and pocket the full retail markup.',
  },
];

const comparisonMatrixRows = [
  {
    feature: 'Monthly Cost',
    starter: 'R0 / month (Free Forever)',
    practice: 'R950 / month',
    enterprise: 'R4,950 / month',
    inHouse: 'R25,000 – R45,000+ / month',
    highlight: true,
  },
  {
    feature: 'Wholesale Discount on 80+ Services',
    starter: '10% Off Retail',
    practice: '30% Off Retail',
    enterprise: '50% Off Retail (Half Price)',
    inHouse: '0% (Pay Full Retail or DIY)',
    highlight: true,
  },
  {
    feature: 'AI Accounting & Bank Recon Clients',
    starter: '1 Client Included',
    practice: '1 to 10 Clients Included',
    enterprise: 'Unlimited Clients',
    inHouse: 'R350–R650/client on Xero/Sage',
  },
  {
    feature: 'Automated SA Payroll Clients',
    starter: '1 Client Included',
    practice: '1 to 10 Clients Included',
    enterprise: 'Unlimited Clients',
    inHouse: 'R150–R400/client on SimplePay',
  },
  {
    feature: 'Practice Task & Workflow Manager',
    starter: 'Included',
    practice: 'Included',
    enterprise: 'Included',
    inHouse: 'Extra SaaS Cost (R500+/pm)',
  },
  {
    feature: 'Staff & Colleague Seats',
    starter: '1 Seat (Owner)',
    practice: 'Up to 5 Staff Seats',
    enterprise: 'Unlimited Staff Seats',
    inHouse: 'Paid Per User License',
  },
  {
    feature: 'Client Communication Policy',
    starter: '100% Partner-Only (Invisible)',
    practice: '100% Partner-Only (Invisible)',
    enterprise: '100% Partner-Only (Invisible)',
    inHouse: 'Managed Internally',
  },
  {
    feature: 'CA(SA) / CIBA / SAIT Sign-Off Support',
    starter: 'Available at 10% Off',
    practice: 'Available at 30% Off',
    enterprise: 'Available at 50% Off',
    inHouse: 'Requires Registered Partner',
  },
  {
    feature: 'Network Overflow Work (Get Paid to Fulfill)',
    starter: 'Eligible to Apply',
    practice: 'Priority Overflow Pool',
    enterprise: 'Top-Tier Overflow Pool',
    inHouse: 'None',
  },
  {
    feature: 'Contract & Commitment',
    starter: 'No Contract',
    practice: 'Month-to-Month (Cancel Anytime)',
    enterprise: 'Month-to-Month (Cancel Anytime)',
    inHouse: 'Permanent Employment Liability',
  },
];

const featureBenefits = [
  {
    icon: BadgeDollarSign,
    feature: 'Wholesale Partner Discount (10% / 30% / 50%)',
    benefit:
      'Increase your profit margins instantly. Buy statutory & tax services at wholesale rates (up to 50% discount) and bill your clients at retail.',
    bgClass: 'bg-emerald-500/10',
    borderClass: 'border-emerald-500/20',
    iconClass: 'text-emerald-600',
    checkClass: 'text-emerald-600',
    showPricing: true,
  },
  {
    icon: Bot,
    feature: 'AI Accounting & Bank Recon Engine',
    benefit:
      'Automate South African bank statement extraction (ABSA, FNB, Standard Bank, Nedbank, Capitec, TymeBank), SARS VAT Act checks, and trial balances.',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/20',
    iconClass: 'text-blue-600',
    checkClass: 'text-blue-600',
  },
  {
    icon: Users,
    feature: 'Automated South African Payroll',
    benefit:
      'Run compliant monthly payroll with PAYE, UIF, SDL, medical tax credits, EMP201 summaries, and PDF payslips for your client companies.',
    bgClass: 'bg-violet-500/10',
    borderClass: 'border-violet-500/20',
    iconClass: 'text-violet-600',
    checkClass: 'text-violet-600',
  },
  {
    icon: Briefcase,
    feature: 'Elastic Outsourcing Capacity',
    benefit:
      'Never say "no" to a complex client project again. Confidently scale your business capacity by leveraging our qualified backend operations team.',
    bgClass: 'bg-amber-500/10',
    borderClass: 'border-amber-500/20',
    iconClass: 'text-amber-600',
    checkClass: 'text-amber-600',
  },
  {
    icon: GraduationCap,
    feature: 'Onboarding & Professional Support',
    benefit:
      'Full setup, training, and direct access to senior Chartered Accountants and tax experts to help you navigate complex technical hurdles.',
    bgClass: 'bg-cyan-500/10',
    borderClass: 'border-cyan-500/20',
    iconClass: 'text-cyan-600',
    checkClass: 'text-cyan-600',
  },
  {
    icon: Scale,
    feature: 'Flexible Pricing Control',
    benefit:
      'Total control over your client billing. Set your own fee structure for your clients while our underlying wholesale back-office cost remains fixed.',
    bgClass: 'bg-indigo-500/10',
    borderClass: 'border-indigo-500/20',
    iconClass: 'text-indigo-600',
    checkClass: 'text-indigo-600',
  },
];

const faqs = [
  {
    question: 'How does the All-Inclusive Back Office work?',
    answer:
      'Your My Accountant partner account gives you one unified platform to run your accounting practice: AI Accounting, AI Payroll, a Practice Task Manager, and wholesale access to our back-office fulfillment team for 80+ SARS, CIPC, COIDA, CIDB, and statutory services. You manage your clients and bill them directly while we power your software and back-office execution.',
  },
  {
    question: 'Do you ever contact my clients directly?',
    answer:
      'Never. We removed all direct-to-client contact from the partner workflow. When you place a back-office order, you simply provide a Client Name / Reference for your own tracking. Every notification, document query, and final deliverable goes strictly to you through your Partner Portal.',
  },
  {
    question: 'Are the completed deliverables unbranded so I can present them to my client?',
    answer:
      'Yes. Statutory certificates (CIPC, SARS, COIDA, CIDB) are official regulator documents issued in your client’s entity name, and our working schedules and financial packs are delivered cleanly via your Partner Portal so you remain front and center with your client.',
  },
  {
    question: 'Who signs off on Annual Financial Statements, Independent Reviews, or Accounting Officer letters?',
    answer:
      'When you order Annual Financial Statements, Accounting Officer reports, or Independent Reviews through the Partner Portal, our in-house registered professionals (CIBA Chartered Business Accountants, SAIT Tax Practitioners, and CA(SA) partners) perform the statutory compilation/review and sign off where required—so you never have to turn away a client due to designation limits.',
  },
  {
    question: 'What are the exact differences between Starter (Free), Practice (R950/pm), and Enterprise (R4,950/pm)?',
    answer:
      '• Starter (Free — R0/month): 10% wholesale discount on all services, 1 AI Accounting client, 1 AI Payroll client, 1 Practice Seat, and Practice Task Manager.\n• Practice (R950/month): 30% wholesale discount on all services, 1 to 10 AI Accounting clients, 1 to 10 AI Payroll clients, up to 5 Staff Seats, and Practice Task Manager.\n• Enterprise (R4,950/month): 50% wholesale discount on all services (half price!), Unlimited AI Accounting clients, Unlimited AI Payroll clients, Unlimited Staff Seats, and Practice Task Manager.',
  },
  {
    question: 'What happens if my practice grows past 10 clients on the R950/month Practice plan?',
    answer:
      'You can upgrade seamlessly to the Enterprise plan (R4,950/month) at any time from your Subscription & Team settings tab. Upgrading immediately unlocks Unlimited AI Accounting clients, Unlimited AI Payroll clients, Unlimited Staff Seats, and increases your wholesale discount from 30% to 50% off across the entire catalog.',
  },
  {
    question: 'Is there a long-term lock-in contract?',
    answer:
      'No. All paid plans (Practice R950/pm and Enterprise R4,950/pm) are billed month-to-month via PayFast with zero long-term lock-in. You can upgrade, downgrade back to the Free Starter tier, or cancel anytime with one click in your portal.',
  },
  {
    question: 'How does the Network Overflow Program work if I want to receive work from My Accountant?',
    answer:
      'During signup (or in your Practice Profile), you can opt in to receive outsourced overflow work from the My Accountant network, select the services your firm is qualified to fulfill, and upload your CV and professional certificates. Once approved by our operations team, we assign paid overflow jobs directly to your Partner Portal and pay out to your nominated practice bank account.',
  },
  {
    question: 'Do I need to be a registered Chartered Accountant to join?',
    answer:
      'No. Bookkeepers, tax practitioners, company secretaries, and accounting firm owners of all sizes are welcome. Whether you are a solo bookkeeper starting with 1 client on the Free tier or a 20-person firm scaling on Enterprise, the platform adapts to your practice.',
  },
  {
    question: 'How is my clients’ financial data protected (POPIA compliance)?',
    answer:
      'All client records, bank statements, payroll files, and statutory documents are encrypted in transit and at rest in isolated tenant workspaces. Because we never market to or contact your clients, your client list remains 100% confidential and POPIA-compliant.',
  },
];

export default function BecomeAPartnerPageClient() {
  return (
    <div className="space-y-16 pb-16 bg-background relative overflow-hidden">
      {/* 1. HERO SECTION */}
      <PageHero
        badgeText="Bookkeeper Empowerment Initiative (BEI)"
        badgeIcon={<Rocket className="h-3.5 w-3.5 text-primary animate-pulse" />}
        title={
          <>
            10X Your Practice — <span className="text-gradient">Without Hiring More Staff.</span>
          </>
        }
        subtitle="Your all-inclusive accounting practice back office: AI Accounting, AI Payroll, Practice Task Manager, and up to 50% wholesale discount on 80+ statutory & tax services — with 100% partner-only communication."
        primaryCta={{ text: 'Start Free Partner Account', href: '/partner-signup' }}
        secondaryCta={{ text: 'Compare Partner Plans', href: '#partner-plans' }}
        showCredibilityRibbon={true}
      />

      <div className="container mx-auto px-4">
        <TrustIndexWidget />
      </div>

      {/* 2. OUR PHILOSOPHY SECTION (KEVIN FREESE CARD) */}
      <section className="container mx-auto px-4 pt-8 scroll-m-20">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">
              Our Philosophy
            </Badge>
            <h2 className="text-4xl font-black leading-tight text-foreground">
              Our philosophy has always been simple
            </h2>
          </div>

          <div className="bg-gradient-to-br from-white via-slate-50/40 to-blue-50/20 border border-slate-200/80 shadow-2xl rounded-xl overflow-hidden p-6 md:p-10 relative">
            <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 rounded-full filter blur-3xl pointer-events-none" />
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              {/* Left Column: Avatar & Credentials */}
              <div className="md:col-span-5 flex flex-col items-center text-center p-6 bg-slate-100/50 border border-slate-200/60 rounded-xl shadow-sm">
                <img
                  src={KEVIN_FREESE_PROFILE_IMAGE}
                  alt="Kevin Freese - Managing Director & Founder"
                  width={96}
                  height={96}
                  className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md shrink-0 mb-4"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/kevin-freese.jpg';
                  }}
                />
                <h4 className="text-lg font-black text-slate-900">Kevin Freese</h4>
                <p className="text-xs text-primary font-bold uppercase tracking-wider mt-0.5">
                  Managing Director & Founder
                </p>

                <div className="mt-2.5 px-3 py-1 bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 rounded-md font-bold text-[10px] uppercase tracking-wider border border-amber-500/20">
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
                  <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-md font-bold text-xs border border-emerald-100 shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> You stay in control
                  </div>
                  <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-md font-bold text-xs border border-emerald-100 shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> You keep the client
                  </div>
                  <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-md font-bold text-xs border border-emerald-100 shadow-sm">
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

      {/* 3. THE PROBLEM / CHALLENGES SECTION */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">
              The Problem
            </Badge>
            <h2 className="text-4xl font-bold tracking-tight text-foreground">
              Challenges We Solve for Practitioners
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Running a practice shouldn&apos;t feel like a solo battle against paperwork.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {challenges.map((item, idx) => (
              <Card
                key={idx}
                className={`relative overflow-hidden border ${item.borderClass} ${item.hoverBorderClass} shadow-md bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
              >
                <div className={`h-1.5 w-full absolute top-0 left-0 ${item.barClass}`} />
                <CardHeader className="text-center pb-2 pt-6">
                  <div
                    className={`mx-auto h-16 w-16 rounded-full ${item.bgClass} border ${item.borderClass} flex items-center justify-center mb-4 shadow-sm`}
                  >
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

      {/* 4. HOW IT WORKS (4-STEP BACK-OFFICE WORKFLOW) */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <Badge className="bg-primary/20 text-blue-300 border-blue-400/20 px-4 py-1 text-xs font-bold uppercase tracking-widest">
              How It Works
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Your Complete Practice Back Office in 4 Simple Steps
            </h2>
            <p className="text-slate-300 max-w-2xl mx-auto text-base md:text-lg">
              Combine automated AI Accounting & Payroll with on-demand CA(SA) & statutory fulfillment — while we stay 100% invisible to your clients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorksSteps.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 flex flex-col justify-between hover:border-primary/60 transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-12 w-12 rounded-xl bg-primary/20 text-blue-400 flex items-center justify-center">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="text-3xl font-black text-slate-600 font-mono">{item.step}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white leading-snug">{item.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. THREE-TIER PARTNER PLANS */}
      <section id="partner-plans" className="py-20 scroll-m-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">
              Partner Plans
            </Badge>
            <h2 className="text-4xl md:text-5xl font-black leading-tight text-foreground">
              All-Inclusive Back Office for Your Practice
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Start free with 1 Accounting & 1 Payroll client at 10% wholesale discount, scale to 10 clients at 30% off, or unlock Unlimited clients at 50% off.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {/* TIER 1: STARTER */}
            <Card className="flex flex-col justify-between border-2 hover:shadow-xl transition-all duration-300 relative bg-white">
              <CardHeader className="pb-6">
                <Badge variant="outline" className="w-fit mb-3 text-xs font-bold uppercase">
                  Starter Plan
                </Badge>
                <CardTitle className="text-2xl font-bold">Starter Practice</CardTitle>
                <CardDescription className="text-sm min-h-[40px]">
                  For solo bookkeepers getting started with AI and back-office outsourcing.
                </CardDescription>
                <div className="pt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight">R0</span>
                  <span className="text-muted-foreground text-sm font-semibold">/ month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow border-t pt-6">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 font-semibold text-foreground">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>
                      <strong className="text-emerald-700">10% Wholesale Discount</strong> on all services
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>
                      <strong>1 AI Accounting</strong> client
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>
                      <strong>1 AI Payroll</strong> client
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>
                      <strong>1 Practice Seat</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>Practice Task Manager included</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>100% Partner-only communication</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4">
                <Button asChild variant="outline" className="w-full font-bold h-12">
                  <Link href="/partner-signup?tier=starter">Join Starter Free</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* TIER 2: PRACTICE (FEATURED) */}
            <Card className="flex flex-col justify-between border-2 border-primary shadow-2xl relative bg-white scale-[1.02] z-10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-black uppercase tracking-wider py-1 px-4 rounded-full shadow-md">
                Most Popular
              </div>
              <CardHeader className="pb-6">
                <Badge
                  variant="outline"
                  className="w-fit mb-3 text-xs font-bold uppercase text-primary border-primary/30"
                >
                  Growth & Practice
                </Badge>
                <CardTitle className="text-2xl font-bold">Practice Plan</CardTitle>
                <CardDescription className="text-sm min-h-[40px]">
                  For growing practices managing 1 to 10 retainer accounting & payroll clients.
                </CardDescription>
                <div className="pt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight text-primary">R950</span>
                  <span className="text-muted-foreground text-sm font-semibold">/ month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow border-t pt-6">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 font-bold text-foreground">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>
                      <strong className="text-primary">30% Wholesale Discount</strong> on all services
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>
                      <strong>1 to 10 AI Accounting</strong> clients
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>
                      <strong>1 to 10 AI Payroll</strong> clients
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>
                      <strong>Up to 5 Staff Seats</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>Practice Task Manager included</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span>Dedicated Partner Priority Support</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4">
                <Button asChild className="w-full font-bold h-12 shadow-lg">
                  <Link href="/partner-signup?tier=practice">Subscribe to Practice (R950/pm)</Link>
                </Button>
              </CardFooter>
            </Card>

            {/* TIER 3: ENTERPRISE */}
            <Card className="flex flex-col justify-between border-2 border-emerald-500/30 hover:shadow-xl transition-all duration-300 relative bg-white">
              <CardHeader className="pb-6">
                <Badge
                  variant="outline"
                  className="w-fit mb-3 text-xs font-bold uppercase text-emerald-700 border-emerald-200 bg-emerald-50"
                >
                  Unlimited Scale
                </Badge>
                <CardTitle className="text-2xl font-bold">Enterprise Plan</CardTitle>
                <CardDescription className="text-sm min-h-[40px]">
                  For high-volume accounting firms wanting unlimited clients and maximum margins.
                </CardDescription>
                <div className="pt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight text-emerald-700">R4,950</span>
                  <span className="text-muted-foreground text-sm font-semibold">/ month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow border-t pt-6">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3 font-bold text-foreground">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>
                      <strong className="text-emerald-700">50% Wholesale Discount</strong> (Wholesale Half Price!)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>
                      <strong className="text-emerald-700">Unlimited AI Accounting</strong> clients
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>
                      <strong className="text-emerald-700">Unlimited AI Payroll</strong> clients
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>
                      <strong className="text-emerald-700">Unlimited Staff Seats</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>Practice Task Manager included</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span>Direct WhatsApp & Senior CA (SA) SLA</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-4">
                <Button asChild className="w-full font-bold h-12 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Link href="/partner-signup?tier=enterprise">Subscribe to Enterprise (R4,950/pm)</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="mt-10 flex justify-center">
            <PartnerPricingDialog variant="button" />
          </div>
        </div>
      </section>

      {/* 6. SIDE-BY-SIDE PLAN & COST COMPARISON MATRIX + FEATURES VS BENEFITS */}
      <section id="benefits" className="bg-white py-20 border-t border-b scroll-m-20 space-y-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-12 space-y-3">
            <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">
              Plan & Cost Comparison
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
              Compare Partner Plans vs. Hiring In-House
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-base md:text-lg">
              See why hundreds of South African practitioners use My Accountant as their all-inclusive back office instead of taking on heavy software and payroll overheads.
            </p>
          </div>

          <div className="border rounded-2xl overflow-hidden shadow-xl bg-white">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-900 hover:bg-slate-900">
                    <TableHead className="text-white font-bold w-[26%] py-4">
                      Capability / Feature
                    </TableHead>
                    <TableHead className="text-slate-200 font-bold text-center w-[18%] py-4">
                      Starter
                      <span className="block text-[11px] font-normal text-slate-400">Free (R0/pm)</span>
                    </TableHead>
                    <TableHead className="text-white font-black text-center bg-primary w-[20%] py-4">
                      Practice (Popular)
                      <span className="block text-[11px] font-normal text-blue-100">R950 / month</span>
                    </TableHead>
                    <TableHead className="text-emerald-300 font-black text-center w-[18%] py-4">
                      Enterprise
                      <span className="block text-[11px] font-normal text-emerald-200/80">R4,950 / month</span>
                    </TableHead>
                    <TableHead className="text-slate-400 font-semibold text-center w-[18%] py-4">
                      Hiring In-House + SaaS
                      <span className="block text-[11px] font-normal text-slate-400">Traditional Setup</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonMatrixRows.map((row, idx) => (
                    <TableRow
                      key={idx}
                      className={cn(
                        'transition-colors',
                        row.highlight ? 'bg-slate-50/80 font-semibold' : 'bg-white'
                      )}
                    >
                      <TableCell className="font-bold text-slate-800 text-xs sm:text-sm py-4">
                        {row.feature}
                      </TableCell>
                      <TableCell className="text-center text-xs sm:text-sm text-slate-700 py-4">
                        {row.starter}
                      </TableCell>
                      <TableCell className="text-center text-xs sm:text-sm font-bold text-primary bg-primary/5 border-x border-primary/15 py-4">
                        {row.practice}
                      </TableCell>
                      <TableCell className="text-center text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-50/30 py-4">
                        {row.enterprise}
                      </TableCell>
                      <TableCell className="text-center text-xs text-slate-500 py-4">
                        {row.inHouse}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Interactive ROI Calculator */}
        <div className="container mx-auto px-4">
          <PracticeRoiCalculator />
        </div>

        {/* Features vs Benefits */}
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Features vs Benefits
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-lg">
              A powerful back-office engine for your accounting firm, designed for maximum results.
            </p>
          </div>

          <div className="max-w-5xl mx-auto border rounded-xl overflow-hidden shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 bg-slate-100 border-b border-slate-200 text-foreground/90 font-black uppercase tracking-widest text-[10px]">
              <div className="p-4 border-r border-slate-200 hidden md:block">The Platform Feature</div>
              <div className="p-4 hidden md:block">The Business Benefit</div>
            </div>
            <div className="divide-y divide-slate-100">
              {featureBenefits.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-2 group hover:bg-slate-50 transition-colors"
                >
                  <div className="p-6 md:border-r border-slate-100 space-y-2">
                    <span className="md:hidden text-[10px] font-black uppercase text-primary tracking-widest block mb-2">
                      Feature
                    </span>
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-10 w-10 rounded-xl ${item.bgClass} border ${item.borderClass} flex items-center justify-center shrink-0 shadow-sm`}
                      >
                        <item.icon className={`h-5 w-5 ${item.iconClass}`} />
                      </div>
                      <h3 className="font-bold text-lg text-foreground leading-tight">{item.feature}</h3>
                    </div>
                  </div>
                  <div className="p-6 bg-white group-hover:bg-transparent transition-colors flex flex-col justify-center items-start">
                    <span className="md:hidden text-[10px] font-black uppercase text-green-600 tracking-widest block mb-2">
                      The Benefit to You
                    </span>
                    <div className="flex items-start gap-3">
                      <CheckCircle className={`h-5 w-5 ${item.checkClass} shrink-0 mt-0.5`} />
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                        {item.benefit}
                      </p>
                    </div>
                    {item.showPricing && <PartnerPricingDialog variant="inline" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. JOBS BOARD & ACTIVE DISCUSSIONS COMMUNITY */}
      <section className="py-12 bg-white">
        <JobsBoardCarouselWidget />
        <div className="container mx-auto px-4 max-w-7xl mt-12">
          <CommunityCarouselWidget />
        </div>
      </section>

      {/* 8. INTERACTIVE ACCORDION FAQS */}
      <section className="container mx-auto px-4 max-w-4xl py-12">
        <div className="text-center mb-12 space-y-3">
          <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">
            Got Questions?
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Everything you need to know about sign-offs, white-label deliverables, wholesale pricing, and how we protect your client relationships.
          </p>
        </div>

        <Card className="border shadow-md p-2 sm:p-6 bg-white">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className="last:border-0">
                <AccordionTrigger className="text-left text-base font-bold text-foreground hover:text-primary py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="whitespace-pre-line text-muted-foreground leading-relaxed text-sm sm:text-base pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      </section>

      {/* 9. BOTTOM CTA */}
      <section className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto rounded-2xl bg-slate-900 text-white p-8 md:p-14 text-center space-y-6 shadow-2xl">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-4 py-1 text-xs font-bold uppercase tracking-widest">
            Zero Risk · Cancel Anytime
          </Badge>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Ready to Power Your Practice Back Office?
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Start free today with 1 AI Accounting client, 1 AI Payroll client, and 10% off all services — or unlock 30% to 50% wholesale discounts as you scale.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Button
              asChild
              size="lg"
              className="h-14 px-8 text-base sm:text-lg font-bold shadow-lg bg-primary hover:bg-primary/90 text-white"
            >
              <Link href="/partner-signup">
                Create Free Partner Account <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <PartnerPricingDialog variant="button" />
          </div>
        </div>
      </section>
    </div>
  );
}
