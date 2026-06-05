'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  CheckCircle2, 
  CheckCircle,
  Calculator, 
  BarChart3, 
  TrendingUp, 
  ShieldCheck, 
  Building, 
  Users, 
  Landmark, 
  MapPin, 
  Briefcase,
  HelpCircle,
  ArrowRight,
  Target,
  Search
} from 'lucide-react';
import Link from 'next/link';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { Separator } from '@/components/ui/separator';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';

export default function MonthlyAccountingPageClient() {
  const accountingServices = [
    'Monthly bookkeeping and transaction processing',
    'Bank reconciliations',
    'Debtors and creditors processing',
    'Trial balance preparation',
    'Monthly management accounts',
    'VAT calculations and VAT201 submissions',
    'Payroll processing and PAYE submissions',
    'SARS compliance support',
    'Expense analysis and reporting',
    'Financial record maintenance',
    'Cloud accounting support',
    'Financial statement preparation support',
  ];

  const financialMgmtServices = [
    'Monthly financial performance reviews',
    'Budget preparation and monitoring',
    'Cash flow management',
    'Profitability analysis',
    'Financial forecasting',
    'Cost reduction analysis',
    'KPI and business performance reporting',
    'Departmental reporting',
    'Business growth planning',
    'Financial risk management',
    'Working capital analysis',
    'Financial systems improvement',
  ];

  const cfoServices = [
    'Strategic financial planning',
    'Business growth strategy',
    'Financial oversight and governance',
    'Board and investor reporting',
    'Cash flow forecasting',
    'Financial modelling',
    'Profit optimisation strategies',
    'Funding and financing support',
    'Financial controls and systems implementation',
    'Business restructuring advice',
    'Tax efficiency planning',
    'Mergers, acquisitions, and expansion support',
  ];

  const industries = [
    'Construction companies',
    'Retail businesses',
    'E-commerce businesses',
    'Logistics and transport companies',
    'Production and media companies',
    'Consultants and freelancers',
    'Property companies',
    'NGOs and non-profit organisations',
    'Professional service firms',
    'Startups and growing SMEs',
  ];

  const whyChooseUs = [
    'Professional online accounting support',
    'Fixed monthly accounting solutions',
    'Experienced accountants and tax practitioners',
    'Payroll and SARS compliance expertise',
    'Scalable financial management solutions',
    'Outsourced CFO services',
    'Cloud accounting support',
    'Nationwide service delivery',
    'Fast turnaround times',
    'Dedicated support team',
    'Over 200+ 5-star Google reviews',
    'Trusted by businesses across South Africa',
  ];

  const faqs = [
    {
      q: "What are monthly accounting services?",
      a: "Monthly accounting services involve ongoing bookkeeping, transaction processing, reconciliations, VAT submissions, management accounts, and financial reporting performed each month to keep your business financially compliant and organised."
    },
    {
      q: "What is the difference between accounting services and CFO services?",
      a: "Accounting services focus on recording and maintaining financial information, while CFO services provide strategic financial leadership, forecasting, growth planning, financial oversight, and executive-level financial advice."
    },
    {
      q: "Do small businesses need monthly accounting services?",
      a: "Yes. Monthly accounting services help businesses maintain accurate records, manage cash flow, remain SARS compliant, and make informed business decisions."
    },
    {
      q: "Can My Accountant manage payroll and tax submissions?",
      a: "Yes. We provide integrated payroll, PAYE, VAT, income tax, and SARS compliance services as part of our monthly accounting solutions."
    },
    {
      q: "Do you offer online accounting services?",
      a: "Yes. My Accountant operates as an online accounting firm assisting businesses throughout South Africa remotely using cloud accounting and digital document systems."
    }
  ];

  const comparisonFeatures = [
    { name: "Monthly Fee", essential: "From R3,500", growth: "From R7,000", executive: "From R11,500" },
    { name: "Annual Turnover", essential: "Under R1 million", growth: "Up to R7 million", executive: "Up to R25 million" },
    { name: "Monthly Bookkeeping", essential: true, growth: true, executive: true },
    { name: "Bank Reconciliations", essential: true, growth: true, executive: true },
    { name: "Management Reports", essential: "Quarterly", growth: "Bi-Monthly", executive: "Monthly" },
    { name: "Annual Financial Statements", essential: true, growth: true, executive: true },
    { name: "Income Tax Returns", essential: true, growth: true, executive: true },
    { name: "VAT Returns", essential: false, growth: true, executive: true },
    { name: "Payroll Processing", essential: true, growth: true, executive: true },
    { name: "PAYE, UIF & SDL Submissions", essential: true, growth: true, executive: true },
    { name: "CIPC Annual Returns", essential: true, growth: true, executive: true },
    { name: "Beneficial Ownership Compliance", essential: false, growth: true, executive: true },
    { name: "Tax Clearance Pin Assistance", essential: true, growth: true, executive: true },
    { name: "Dedicated Accountant", essential: true, growth: true, executive: true },
    { name: "Financial Manager Support", essential: false, growth: true, executive: true },
    { name: "CFO Advisory Services", essential: false, growth: "Limited", executive: "Unlimited" },
    { name: "Strategic Business Reviews", essential: "Quarterly", growth: "Monthly", executive: "Unlimited" },
    { name: "Cash Flow Forecasting", essential: false, growth: true, executive: true },
    { name: "Budgeting Assistance", essential: false, growth: true, executive: true },
    { name: "Email Support", essential: "Yes", growth: "Priority", executive: "Priority" },
    { name: "Phone Support", essential: true, growth: true, executive: true }
  ];

  const renderVal = (val: string | boolean) => {
    if (typeof val === 'boolean') {
      return val ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto" />
      ) : (
        <span className="text-slate-300 font-bold text-center block">—</span>
      );
    }
    return <span className="text-slate-700 font-semibold">{val}</span>;
  };

  return (
    <div className="space-y-16 pb-16 bg-white">
      {/* FAQ Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
              "@type": "Question",
              "name": faq.q,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.a
              }
            }))
          })
        }}
      />
      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-white pt-16 lg:pt-24 pb-20 border-b text-center">
        <div className="container relative z-10 mx-auto px-4">
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10 border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">
            Monthly Accounting Services South Africa
          </Badge>
          <h1 className="mb-6 text-4xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
            Professional Monthly Accounting, Financial Management & <span className="text-gradient">CFO Services</span>
          </h1>
          <div className="mx-auto mb-10 max-w-4xl text-lg font-medium text-muted-foreground md:text-xl leading-relaxed">
            <p>
              Running a successful business requires more than just staying compliant. Businesses need accurate financial records, reliable reporting, strategic financial guidance, and proactive tax management to grow sustainably.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="h-14 px-10 text-lg font-bold shadow-xl">
              <Link href="/contact">Enquire Today</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-14 px-10 text-lg font-bold border-2 shadow-sm">
              <Link href="/products">View All Packages</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <TrustIndexWidget />
      </div>

      {/* INTRO SECTION */}
      <section className="container mx-auto px-4 max-w-5xl">
          <div className="text-lg text-muted-foreground leading-relaxed space-y-6 text-center">
              <p>
                  At My Accountant, we provide professional monthly accounting services, monthly financial management services, and outsourced Chief Financial Officer (CFO) services to businesses across South Africa. Our experienced accountants, tax practitioners, bookkeepers, and financial professionals assist startups, SMEs, growing companies, non-profit organisations, and established businesses with ongoing accounting and financial management support tailored to their operational needs and budget.
              </p>
              <p className="font-bold text-slate-900">
                  Whether you need basic bookkeeping, full monthly accounting support, payroll management, VAT submissions, management accounts, or high-level financial strategy from an outsourced CFO, My Accountant offers scalable solutions designed to help your business remain compliant, financially organised, and growth-focused.
              </p>
          </div>
      </section>

      {/* MAIN PILLARS SECTION */}
      <section className="bg-slate-50 py-24 border-y">
        <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Pillar 1: Accounting */}
                <Card className="border-2 border-slate-100 shadow-sm flex flex-col hover:border-primary/20 transition-all">
                    <CardHeader className="pb-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                            <Calculator className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Monthly Accounting Services</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-primary">Core Bookkeeping</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground mb-6">Designed to ensure your business financial records remain accurate, compliant, and up to date throughout the year.</p>
                        <ul className="space-y-3">
                            {accountingServices.map((service, i) => (
                                <li key={i} className="flex items-start gap-3 text-xs font-medium text-slate-700">
                                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                    {service}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* Pillar 2: Financial Management */}
                <Card className="border-2 border-slate-100 shadow-sm flex flex-col hover:border-primary/20 transition-all">
                    <CardHeader className="pb-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Financial Management</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-primary">Strategic Insights</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground mb-6">Helping business owners understand their financial position, improve profitability, and make informed business decisions.</p>
                        <ul className="space-y-3">
                            {financialMgmtServices.map((service, i) => (
                                <li key={i} className="flex items-start gap-3 text-xs font-medium text-slate-700">
                                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                                    {service}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* Pillar 3: CFO Services */}
                <Card className="border-2 border-slate-100 shadow-sm flex flex-col hover:border-primary/20 transition-all">
                    <CardHeader className="pb-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Outsourced CFO Services</CardTitle>
                        <CardDescription className="text-xs font-bold uppercase tracking-wider text-primary">Senior Leadership</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm text-muted-foreground mb-6">Providing businesses with executive-level financial expertise without the cost of a full-time in-house CFO.</p>
                        <ul className="space-y-3">
                            {cfoServices.map((service, i) => (
                                <li key={i} className="flex items-start gap-3 text-xs font-medium text-slate-700">
                                    <CheckCircle2 className="h-4 w-4 text-slate-900 shrink-0" />
                                    {service}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
      </section>

      {/* COMPLIANCE SUPPORT */}
      <section className="container mx-auto px-4 max-w-5xl py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest">Unified Compliance</Badge>
                <h2 className="text-3xl font-bold text-slate-900">Payroll, Tax & Compliance Support</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    Our integrated approach allows businesses to manage accounting, tax, payroll, and compliance through one trusted financial partner. We handle:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                    {[
                        'Payroll processing',
                        'PAYE, UIF and SDL submissions',
                        'EMP201 and EMP501 submissions',
                        'IRP5 certificate generation',
                        'VAT returns and compliance',
                        'Provisional tax submissions',
                        'Income tax submissions',
                        'SARS audit support',
                        'Tax clearance certificates',
                        'CIPC annual returns',
                        'Beneficial ownership compliance'
                    ].map(item => (
                        <div key={item} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> {item}
                        </div>
                    ))}
                </div>
              </div>
              <div className="bg-slate-50 p-8 rounded-3xl border-2 border-dashed border-slate-200">
                  <h3 className="text-xl font-bold mb-4">Industries We Assist</h3>
                  <div className="grid grid-cols-1 gap-2">
                      {industries.map(industry => (
                          <div key={industry} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                              <Target className="h-4 w-4 text-primary" /> {industry}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </section>

      {/* PRICING COMPARISON SECTION */}
      <section id="pricing" className="bg-slate-50 py-24 border-y scroll-m-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 space-y-4">
            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">
              Simple, Transparent Pricing
            </Badge>
            <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-5xl">
              Compare Accounting Packages
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Transparent monthly accounting, tax, payroll and compliance services for South African businesses.
            </p>
          </div>

          {/* Pricing Cards (Mobile-first responsive SaaS layout) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto mb-20">
            {/* Essential Card */}
            <Card className="flex flex-col bg-white border-2 border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-500/30 hover:scale-[1.02] transition-all duration-300">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold text-slate-900">Essential</h3>
                <p className="text-xs text-muted-foreground mt-1">Best for small startups & sole proprietors</p>
                <div className="flex items-baseline mt-4">
                  <span className="text-4xl font-extrabold text-slate-900">R3,500</span>
                  <span className="text-sm font-semibold text-muted-foreground ml-1">/ month</span>
                </div>
                <p className="text-[11px] font-bold text-slate-500 mt-2 uppercase tracking-wide">For turnover under R1M</p>
              </div>
              <CardContent className="flex-grow p-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Monthly Bookkeeping & Reconciliations</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Quarterly Management Reports</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Annual Financial Statements</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Income Tax & CIPC Annual Returns</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Payroll Processing & PAYE / UIF</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Dedicated Accountant</span>
                  </li>
                </ul>
              </CardContent>
              <div className="p-6 pt-0">
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-lg shadow-md active:scale-95 transition-all">
                  <Link href="/contact?package=essential">Get Started</Link>
                </Button>
              </div>
            </Card>

            {/* Growth Card (Most Popular) */}
            <Card className="flex flex-col bg-white border-2 border-emerald-500 shadow-lg relative hover:shadow-2xl hover:scale-[1.03] transition-all duration-300">
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md select-none">
                Most Popular
              </div>
              <div className="p-6 border-b bg-slate-50/50 rounded-t-xl">
                <h3 className="text-xl font-bold text-slate-900">Growth</h3>
                <p className="text-xs text-muted-foreground mt-1">Perfect for growing SME businesses</p>
                <div className="flex items-baseline mt-4">
                  <span className="text-4xl font-extrabold text-slate-900">R7,000</span>
                  <span className="text-sm font-semibold text-muted-foreground ml-1">/ month</span>
                </div>
                <p className="text-[11px] font-bold text-emerald-600 mt-2 uppercase tracking-wide">For turnover up to R7M</p>
              </div>
              <CardContent className="flex-grow p-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Everything in Essential</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>VAT Returns & Submissions</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Bi-Monthly Management Reports</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Financial Manager Support</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Cash Flow & Budgeting Assistance</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>CFO Advisory & Monthly Reviews</span>
                  </li>
                </ul>
              </CardContent>
              <div className="p-6 pt-0">
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-lg shadow-md active:scale-95 transition-all">
                  <Link href="/contact?package=growth">Get Started</Link>
                </Button>
              </div>
            </Card>

            {/* Executive Card */}
            <Card className="flex flex-col bg-white border-2 border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-500/30 hover:scale-[1.02] transition-all duration-300">
              <div className="p-6 border-b">
                <h3 className="text-xl font-bold text-slate-900">Executive</h3>
                <p className="text-xs text-muted-foreground mt-1">Comprehensive CFO & tax governance</p>
                <div className="flex items-baseline mt-4">
                  <span className="text-4xl font-extrabold text-slate-900">R11,500</span>
                  <span className="text-sm font-semibold text-muted-foreground ml-1">/ month</span>
                </div>
                <p className="text-[11px] font-bold text-slate-500 mt-2 uppercase tracking-wide">For turnover up to R25M</p>
              </div>
              <CardContent className="flex-grow p-6">
                <ul className="space-y-3">
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Everything in Growth</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Monthly Management Reports</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Unlimited CFO Advisory Services</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Unlimited Strategic Business Reviews</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>Priority Support Response</span>
                  </li>
                </ul>
              </CardContent>
              <div className="p-6 pt-0">
                <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-lg shadow-md active:scale-95 transition-all">
                  <Link href="/contact?package=executive">Get Started</Link>
                </Button>
              </div>
            </Card>
          </div>

          {/* Full Comparison Table Section (Responsive wrapper) */}
          <div className="bg-white rounded-3xl border shadow-sm p-4 md:p-8 max-w-6xl mx-auto">
            <h3 className="text-xl font-bold mb-6 text-slate-900">Detailed Feature Comparison</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50/50">
                    <th className="p-4 font-bold text-slate-950 w-1/3">Features</th>
                    <th className="p-4 font-bold text-slate-950 text-center">Essential</th>
                    <th className="p-4 font-bold text-emerald-600 text-center bg-emerald-50/20">Growth</th>
                    <th className="p-4 font-bold text-slate-950 text-center">Executive</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisonFeatures.map((feat) => (
                    <tr key={feat.name} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-semibold text-slate-700">{feat.name}</td>
                      <td className="p-4 text-center font-medium text-slate-600">
                        {renderVal(feat.essential)}
                      </td>
                      <td className="p-4 text-center font-semibold text-emerald-950 bg-emerald-50/10">
                        {renderVal(feat.growth)}
                      </td>
                      <td className="p-4 text-center font-medium text-slate-600">
                        {renderVal(feat.executive)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Why Businesses Choose My Accountant checklist section */}
          <div className="mt-24 max-w-4xl mx-auto bg-white border rounded-3xl p-8 md:p-12 shadow-sm">
            <h3 className="text-2xl font-black text-slate-900 mb-8 text-center md:text-left">
              Why Businesses Choose My Accountant
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "200+ 5-Star Google Reviews",
                "Registered Tax Practitioners",
                "SAICA, CIBA & SAIT Associated Professionals",
                "Nationwide Online Service",
                "Accounting, Tax, Payroll & CIPC Specialists",
                "Dedicated Support Team",
                "SARS Dispute & Compromise Specialists"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm font-semibold text-slate-700 select-none">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center max-w-4xl mx-auto p-10 md:p-16 rounded-[3rem] bg-slate-950 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.08),transparent_50%)]" />
            <h3 className="text-2xl md:text-4xl font-extrabold tracking-tight relative z-10">
              Ready to simplify your accounting?
            </h3>
            <p className="text-slate-400 mt-4 max-w-xl mx-auto text-sm md:text-base relative z-10 leading-relaxed">
              Get in touch with us today for a custom quote or schedule a free consultation with our team.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 relative z-10">
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-13 px-8 shadow-lg active:scale-95 transition-all">
                <Link href="/contact?action=quote">Get a Quote</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="bg-transparent border-slate-700 text-white hover:bg-white/10 font-bold h-13 px-8 active:scale-95 transition-all">
                <Link href="/contact?action=consultation">Book a Consultation</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="bg-slate-900 text-white py-24 overflow-hidden relative">
          <div className="container mx-auto px-4 relative z-10">
              <div className="text-center mb-16 space-y-4">
                  <h2 className="text-3xl font-bold md:text-5xl tracking-tight">Why Businesses Choose <span className="text-primary">My Accountant</span></h2>
                  <p className="text-slate-400 max-w-2xl mx-auto">Combining technology-driven convenience with experienced financial professionals.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {whyChooseUs.map(item => (
                      <div key={item} className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                          <span className="text-sm font-medium">{item}</span>
                      </div>
                  ))}
              </div>
              <div className="mt-16 text-center">
                  <p className="text-sm text-slate-400 italic">
                      Our team is associated with respected professional bodies including the South African Institute of Chartered Accountants (SAICA), Chartered Institute for Business Accountants (CIBA), and South African Institute of Taxation (SAIT).
                  </p>
              </div>
          </div>
          <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none"><ShieldCheck size={400} /></div>
      </section>

      {/* REGIONAL SECTION */}
      <section className="container mx-auto px-4 max-w-6xl py-12 border-b">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><MapPin className="h-6 w-6" /></div>
                <h2 className="text-3xl font-bold text-slate-900">Accounting & Financial Services Across South Africa</h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                    My Accountant provides online monthly accounting services, financial management services, and outsourced CFO services to businesses throughout South Africa.
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm font-bold text-slate-700">
                    {["Johannesburg", "Randburg", "Sandton", "Midrand", "Pretoria", "Durban", "Cape Town", "Gauteng"].map(loc => (
                        <div key={loc} className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" /> {loc}
                        </div>
                    ))}
                </div>
                <p className="text-sm text-muted-foreground italic">
                    Our online systems allow businesses nationwide to access reliable accounting, payroll, tax, and financial management support without needing to visit a physical office.
                </p>
              </div>
              <div className="h-[400px] rounded-3xl overflow-hidden shadow-xl border-8 border-slate-50">
                  <iframe
                      src="https://www.google.com/maps?q=Stonemill+Office+Park+Johannesburg&output=embed"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen={false}
                      loading="lazy"
                  ></iframe>
              </div>
          </div>
      </section>

      {/* FAQ SECTION */}
      <section className="container mx-auto px-4 max-w-4xl py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-2">
                <HelpCircle className="h-8 w-8 text-primary" /> Frequently Asked Questions
            </h2>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, idx) => (
              <AccordionItem key={idx} value={`item-${idx}`} className="bg-slate-50 border rounded-xl px-6">
                <AccordionTrigger className="text-left font-bold text-slate-900 hover:no-underline">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed text-sm font-medium pb-6">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
      </section>

      {/* FINAL CTA */}
      <section className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto p-12 rounded-[3rem] bg-slate-50 border-2 border-dashed border-slate-200">
            <h2 className="text-3xl font-bold">Partner With a Professional Financial Team</h2>
            <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto leading-relaxed">
                Whether your business requires monthly bookkeeping, financial management support, payroll administration, or executive-level CFO services, My Accountant provides scalable financial solutions designed to support your business growth.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
                <Button asChild size="lg" className="h-14 px-12 text-lg font-bold shadow-lg">
                    <Link href="/contact">Contact My Accountant Today</Link>
                </Button>
            </div>
        </div>
      </section>
    </div>
  );
}
