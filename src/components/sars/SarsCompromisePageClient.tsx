'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  CheckCircle, 
  ShieldCheck, 
  Scale, 
  FileText, 
  LifeBuoy, 
  AlertTriangle, 
  TrendingDown, 
  Landmark, 
  Users, 
  MapPin, 
  ArrowRight,
  Calculator,
  Gavel,
  CheckCircle2,
  HelpCircle,
  Info,
  XCircle,
  Coins,
  Percent,
  Briefcase,
  Check,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { sendEmail } from '@/lib/email';
import { useToast } from '@/hooks/use-toast';

export default function SarsCompromisePageClient() {
  const serviceList = [
    'SARS compromise applications',
    'Tax debt negotiations',
    'SARS payment arrangements',
    'Suspension of payment requests',
    'Penalty remissions',
    'Interest remissions',
    'SARS debt restructuring',
    'Objections and appeals',
    'SARS compliance restoration',
    'Tax debt management strategies',
  ];

  const compromiseBenefits = [
    'Reduce the total amount payable to SARS',
    'Settle debt over time',
    'Avoid aggressive collection action',
    'Improve cash flow',
    'Restore compliance status',
    'Prevent further legal enforcement action',
  ];

  const reductionAssistance = [
    'Reviewing SARS statements and balances',
    'Identifying incorrect assessments',
    'Reviewing penalties and interest charges',
    'Identifying potential dispute opportunities',
    'Negotiating settlement proposals',
    'Preparing compromise submissions',
    'Supporting repayment negotiations',
    'Managing SARS correspondence',
    'Advising on tax compliance risks',
  ];

  const risksOfIgnoring = [
    'Third-party appointments',
    'Bank account attachments',
    'Garnishee orders',
    'Legal collection action',
    'Tax clearance issues',
    'Business cash flow disruption',
    'Compliance penalties',
  ];

  const managementServices = [
    'Tax debt restructuring',
    'SARS payment arrangements',
    'Deferred payment requests',
    'Compliance recovery plans',
    'Tax return corrections',
    'SARS statement reconciliations',
    'VAT and PAYE debt management',
    'Provisional tax management',
    'Ongoing SARS liaison',
  ];

  const applicationSupport = [
    'Financial disclosure preparation',
    'Drafting legal compromise submissions',
    'Tax debt analysis',
    'Supporting affidavit preparation',
    'SARS negotiations',
    'Settlement proposal preparation',
    'Compliance review',
    'Tax administration support',
  ];

  const servicesGrid = [
    {
        title: 'SARS Compromise Applications',
        desc: 'Professional preparation and submission of compromise applications under the Tax Administration Act.',
        icon: FileText
    },
    {
        title: 'SARS Payment Arrangements',
        desc: 'Negotiating structured repayment terms with SARS.',
        icon: Calculator
    },
    {
        title: 'Suspension of Payment Requests',
        desc: 'Assisting taxpayers in requesting temporary suspension of collection action during disputes or objections.',
        icon: Scale
    },
    {
        title: 'Penalty & Interest Remissions',
        desc: 'Applying for the reduction or remission of penalties and interest where justified.',
        icon: AlertTriangle
    },
    {
        title: 'SARS Disputes & Objections',
        desc: 'Reviewing assessments and lodging objections and appeals where appropriate.',
        icon: Gavel
    },
    {
        title: 'SARS Compliance Restoration',
        desc: 'Helping taxpayers become compliant with outstanding returns and submissions.',
        icon: CheckCircle2
    }
  ];

  const whyChooseUs = [
    'Experienced SARS tax practitioners',
    'Professional tax debt negotiation support',
    'Knowledge of the Tax Administration Act',
    'SARS compliance expertise',
    'Assistance with large and complex SARS debt matters',
    'Online service delivery across South Africa',
    'Dedicated case management',
    'Confidential handling of sensitive tax matters',
    'Fixed-fee and structured pricing options',
    'Trusted by businesses nationwide',
  ];

  const assistedEntities = [
    'Small businesses',
    'Companies with PAYE or VAT debt',
    'Directors with personal tax debt',
    'Sole proprietors',
    'Freelancers and consultants',
    'NGOs and non-profit organisations',
    'Individuals with outstanding SARS liabilities',
    'Businesses facing cash flow challenges',
    'Taxpayers under SARS collection pressure',
  ];

  const faqs = [
    {
      q: "What is a SARS compromise?",
      a: "A SARS compromise is a legal agreement where SARS may accept a reduced amount in settlement of outstanding tax debt under qualifying circumstances in terms of the Tax Administration Act."
    },
    {
      q: "Can SARS reduce tax debt?",
      a: "In certain circumstances, SARS may agree to compromise or reduce tax debt through formal legal processes, repayment arrangements, or penalty remissions."
    },
    {
      q: "What happens if I ignore SARS debt?",
      a: "Ignoring SARS debt can lead to collection action, including bank account attachments, garnishee orders, legal proceedings, and additional penalties and interest."
    },
    {
      q: "Can SARS penalties and interest be removed?",
      a: "In some cases, penalties and interest may be reduced or remitted where there are valid legal grounds or exceptional circumstances."
    },
    {
      q: "Do I need to be compliant before applying for a SARS compromise?",
      a: "Generally, taxpayers should ensure outstanding returns and compliance obligations are addressed before or during the compromise process."
    }
  ];
  const { toast } = useToast();
  
  // Calculator States
  const [debtInput, setDebtInput] = useState('');
  const [assetsInput, setAssetsInput] = useState('');
  const [liabilitiesInput, setLiabilitiesInput] = useState('');
  
  // Lead Capture States
  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Parsing values
  const debtVal = parseFloat(debtInput.replace(/[^\d.-]/g, '')) || 0;
  const assetsVal = parseFloat(assetsInput.replace(/[^\d.-]/g, '')) || 0;
  const liabilitiesVal = parseFloat(liabilitiesInput.replace(/[^\d.-]/g, '')) || 0;

  // Logic
  const nav = assetsVal - liabilitiesVal;
  const hasInputs = debtInput !== '' && assetsInput !== '' && liabilitiesInput !== '';
  const isEligible = hasInputs && nav < debtVal;
  const potentialSavings = isEligible ? (debtVal - Math.max(0, nav)) : 0;
  
  const upfrontFee = 20000;
  const successFee = potentialSavings * 0.10;

  const formatZar = (val: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 2,
    }).format(val);
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadEmail || !leadPhone) {
      toast({
        title: "Missing Fields",
        description: "Please complete your name, email, and phone number.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await sendEmail({
        to: 'info@myacc.co.za',
        subject: `SARS Compromise Lead: ${leadName} - ${isEligible ? 'Eligible' : 'Not Eligible'}`,
        replyTo: leadEmail,
        html: `
          <h3>SARS Compromise Eligibility Calculator Lead</h3>
          <p><strong>Contact Name:</strong> ${leadName}</p>
          <p><strong>Email Address:</strong> ${leadEmail}</p>
          <p><strong>Phone Number:</strong> ${leadPhone}</p>
          <hr />
          <h4>Calculation Details:</h4>
          <ul>
            <li><strong>Total SARS Debt:</strong> ${formatZar(debtVal)}</li>
            <li><strong>Total Assets:</strong> ${formatZar(assetsVal)}</li>
            <li><strong>Total Liabilities (Excl. Tax Debt):</strong> ${formatZar(liabilitiesVal)}</li>
            <li><strong>Net Asset Value (NAV):</strong> ${formatZar(nav)}</li>
            <li><strong>Eligibility Result:</strong> ${isEligible ? '<span style="color: green; font-weight: bold;">ELIGIBLE</span>' : '<span style="color: red; font-weight: bold;">NOT ELIGIBLE</span>'}</li>
            <li><strong>Estimated Savings Potential:</strong> ${formatZar(potentialSavings)}</li>
          </ul>
          <hr />
          <h4>Fee Estimate:</h4>
          <ul>
            <li><strong>Upfront Fee:</strong> R20,000.00</li>
            <li><strong>Estimated Success Fee (10%):</strong> ${formatZar(successFee)}</li>
          </ul>
        `
      });
      
      toast({
        title: "Assessment Submitted!",
        description: "A SARS Debt Specialist will contact you shortly to review your case."
      });
      setIsSubmitted(true);
      setLeadName('');
      setLeadEmail('');
      setLeadPhone('');
    } catch (error) {
      console.error("Lead submit error:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error sending your details. Please try again or contact us directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-16 pb-16 bg-white">
      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden bg-white pt-16 lg:pt-24 pb-20 border-b text-center">
        <div className="container relative z-10 mx-auto px-4">
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10 border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">
            SARS Compromise & SARS Debt Relief Services South Africa
          </Badge>
          <h1 className="mb-6 text-4xl font-black tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
            Reduce, Settle or Manage Your <span className="text-gradient">SARS Tax Debt</span> With Professional Assistance
          </h1>
          <div className="mx-auto mb-10 max-w-4xl text-lg font-medium text-muted-foreground md:text-xl leading-relaxed">
            <p>
              If you owe money to the South African Revenue Service and are struggling to settle your outstanding tax debt, penalties, or interest, My Accountant provides professional SARS compromise, SARS debt management, and SARS debt reduction services to businesses and individuals throughout South Africa.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="h-14 px-10 text-lg font-bold shadow-xl">
              <Link href="/contact">Speak to a SARS Debt Specialist</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <TrustIndexWidget />
      </div>

      {/* CORE SERVICES LIST */}
      <section className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">Expert Assistance with SARS Debt</h2>
                <p className="text-muted-foreground leading-relaxed">Our experienced tax practitioners assist taxpayers with a full range of debt resolution options:</p>
                <div className="grid grid-cols-1 gap-2">
                    {serviceList.map(item => (
                        <div key={item} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> {item}
                        </div>
                    ))}
                </div>
                <p className="font-bold text-slate-900 mt-4">
                    We help clients legally reduce tax exposure, negotiate sustainable repayment terms, and restore compliance with SARS.
                </p>
              </div>
              <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl space-y-6">
                  <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
                    <LifeBuoy className="h-6 w-6" /> Why Seek Help?
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    SARS debt can place severe financial pressure on businesses and individuals. Ignoring the problem only leads to higher interest and aggressive collection actions.
                  </p>
                  <Button asChild variant="secondary" className="w-full font-bold h-12">
                      <Link href="/contact">Get Professional Support</Link>
                  </Button>
              </div>
          </div>
      </section>

      {/* WHAT IS A COMPROMISE */}
      <section className="bg-slate-50 py-24 border-y">
          <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto text-center space-y-8 mb-16">
                  <h2 className="text-3xl font-bold text-slate-900">What Is a SARS Compromise?</h2>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    A SARS compromise is a legal process available under Sections 200 to 204 of the Tax Administration Act (TAA), allowing qualifying taxpayers to negotiate a reduced settlement amount with SARS for outstanding tax debt under specific circumstances.
                  </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                  <Card className="border-2 border-slate-100 shadow-sm">
                      <CardHeader>
                          <CardTitle className="text-lg font-bold">The Benefits</CardTitle>
                          <CardDescription>A compromise application may allow taxpayers to:</CardDescription>
                      </CardHeader>
                      <CardContent>
                          <ul className="space-y-3">
                              {compromiseBenefits.map((item, i) => (
                                  <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-700">
                                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                                      {item}
                                  </li>
                              ))}
                          </ul>
                      </CardContent>
                  </Card>
                  <div className="flex flex-col justify-center space-y-6 p-4">
                      <p className="text-muted-foreground leading-relaxed">
                        The compromise process is typically considered where taxpayers cannot reasonably settle their full tax debt due to financial hardship or exceptional circumstances.
                      </p>
                      <div className="p-6 bg-white rounded-2xl border border-dashed border-primary/30 text-center">
                          <p className="text-xs font-black uppercase tracking-widest text-primary mb-2">Legal Framework</p>
                          <p className="text-sm font-bold text-slate-900">Sections 200 - 204 of the Tax Administration Act</p>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* COMPROMISE ELIGIBILITY CALCULATOR */}
      <section className="bg-slate-50 py-24 border-y">
          <div className="container mx-auto px-4 max-w-6xl">
              <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">
                      Interactive Tool
                  </Badge>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
                      SARS Compromise Eligibility Calculator
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                      Determine if you meet the preliminary financial criteria to apply for a SARS tax debt compromise.
                  </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* Left Column: Input Form */}
                  <Card className="lg:col-span-7 bg-white shadow-xl border-slate-100 border-2">
                      <CardHeader className="bg-slate-50 border-b">
                          <CardTitle className="flex items-center gap-2 text-slate-800">
                              <Calculator className="h-5 w-5 text-primary" />
                              Financial Details
                          </CardTitle>
                          <CardDescription>
                              Provide estimates for your outstanding tax debt and current financial position.
                          </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                          <div className="space-y-2">
                              <Label htmlFor="tax-debt" className="text-sm font-bold text-slate-700">Total SARS Debt (All tax types)</Label>
                              <div className="relative">
                                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-muted-foreground">R</span>
                                  <Input
                                      id="tax-debt"
                                      type="number"
                                      placeholder="0.00"
                                      value={debtInput}
                                      onChange={(e) => setDebtInput(e.target.value)}
                                      className="pl-8 h-10 border-slate-200"
                                  />
                              </div>
                              <p className="text-[10px] text-muted-foreground">Includes outstanding VAT, PAYE, Income Tax, penalties, and interest.</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <Label htmlFor="total-assets" className="text-sm font-bold text-slate-700">Total Assets</Label>
                                  <div className="relative">
                                      <span className="absolute left-3.5 top-2.5 text-sm font-bold text-muted-foreground">R</span>
                                      <Input
                                          id="total-assets"
                                          type="number"
                                          placeholder="0.00"
                                          value={assetsInput}
                                          onChange={(e) => setAssetsInput(e.target.value)}
                                          className="pl-8 h-10 border-slate-200"
                                      />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">Current value of property, vehicles, cash, and other assets.</p>
                              </div>

                              <div className="space-y-2">
                                  <Label htmlFor="total-liabilities" className="text-sm font-bold text-slate-700">Total Liabilities (Excl. Tax Debt)</Label>
                                  <div className="relative">
                                      <span className="absolute left-3.5 top-2.5 text-sm font-bold text-muted-foreground">R</span>
                                      <Input
                                          id="total-liabilities"
                                          type="number"
                                          placeholder="0.00"
                                          value={liabilitiesInput}
                                          onChange={(e) => setLiabilitiesInput(e.target.value)}
                                          className="pl-8 h-10 border-slate-200"
                                      />
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">Outstanding balances on bonds, car finance, loans, creditors, etc.</p>
                              </div>
                          </div>

                          {hasInputs && (
                              <div className="pt-4 border-t space-y-4">
                                  <div className="flex justify-between items-center text-sm font-medium">
                                      <span className="text-muted-foreground">Net Asset Value (NAV):</span>
                                      <span className="font-mono font-bold text-slate-900">{formatZar(nav)}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-sm font-medium">
                                      <span className="text-muted-foreground">Outstanding SARS Debt:</span>
                                      <span className="font-mono font-bold text-slate-900">{formatZar(debtVal)}</span>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground italic bg-slate-50 p-2.5 rounded-lg border">
                                      *Net Asset Value is calculated as Assets minus Liabilities (excluding the tax debt). Under Section 200 of the TAA, SARS considers if your Net Assets are insufficient to cover your tax liabilities.
                                  </div>
                              </div>
                          )}
                      </CardContent>
                  </Card>

                  {/* Right Column: Results & Action */}
                  <div className="lg:col-span-5 space-y-6">
                      {!hasInputs ? (
                          <Card className="border-2 border-dashed border-slate-200 bg-white p-8 text-center h-full flex flex-col justify-center items-center space-y-4 min-h-[350px]">
                              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-muted-foreground">
                                  <Calculator className="h-6 w-6" />
                              </div>
                              <div className="space-y-1">
                                  <h3 className="font-bold text-slate-800">Awaiting Calculations</h3>
                                  <p className="text-xs text-muted-foreground max-w-xs">
                                      Enter your outstanding debt, asset value, and liabilities to see your eligibility assessment instantly.
                                  </p>
                              </div>
                          </Card>
                      ) : (
                          <>
                              {/* Eligibility Status Alert */}
                              <Card className={`border-2 shadow-lg ${isEligible ? "border-green-100 bg-green-50/30" : "border-amber-100 bg-amber-50/30"}`}>
                                  <CardHeader className={`border-b ${isEligible ? "bg-green-50/50" : "bg-amber-50/50"}`}>
                                      <CardTitle className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                                          {isEligible ? (
                                              <>
                                                  <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                                                  <span className="text-green-800">PRELIMINARILY ELIGIBLE</span>
                                              </>
                                          ) : (
                                              <>
                                                  <Info className="h-5 w-5 text-amber-600 shrink-0" />
                                                  <span className="text-amber-800">NOT ELIGIBLE FOR COMPROMISE</span>
                                              </>
                                          )}
                                      </CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-6 space-y-4">
                                      {isEligible ? (
                                          <div className="space-y-3">
                                              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                                  Your Net Asset Value (NAV) of <strong>{formatZar(nav)}</strong> is less than your outstanding SARS debt of <strong>{formatZar(debtVal)}</strong>.
                                              </p>
                                              <div className="bg-white p-3 rounded-lg border border-green-100 flex justify-between items-center text-sm font-medium">
                                                  <span className="text-slate-600">Savings Potential:</span>
                                                  <span className="font-mono font-bold text-green-600 text-lg">{formatZar(potentialSavings)}</span>
                                              </div>
                                              <p className="text-xs text-slate-600 leading-relaxed">
                                                  Because your asset base is not large enough to liquidate and pay SARS in full, we can legally apply for a Compromise of Debt. SARS may accept a lesser amount to write off the remainder.
                                              </p>
                                          </div>
                                      ) : (
                                          <div className="space-y-3">
                                              <p className="text-sm text-slate-700 leading-relaxed font-medium">
                                                  Your Net Asset Value (NAV) of <strong>{formatZar(nav)}</strong> is equal to or greater than your outstanding SARS debt of <strong>{formatZar(debtVal)}</strong>.
                                              </p>
                                              <p className="text-xs text-slate-600 leading-relaxed">
                                                  Since your net asset value exceeds your outstanding debt, SARS expects you to pay the debt in full (by liquidating assets if necessary). You do not qualify for a compromise under Section 200.
                                              </p>
                                              <p className="text-xs font-bold text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                                                  Alternative: We can negotiate a Deferred Payment Arrangement (Section 167 of the TAA) to pay off the outstanding balance over time.
                                              </p>
                                          </div>
                                      )}
                                  </CardContent>
                              </Card>

                              {/* Fee Structure */}
                              <Card className="border-2 border-slate-100 bg-white shadow-lg">
                                  <CardHeader className="bg-slate-50 border-b py-3">
                                      <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800">
                                          <Coins className="h-4 w-4 text-primary" />
                                          My Accountant Fee Structure
                                      </CardTitle>
                                  </CardHeader>
                                  <CardContent className="p-4 space-y-3 text-sm">
                                      <div className="flex justify-between items-center">
                                          <span className="text-slate-600 font-medium flex items-center gap-1">
                                              <Briefcase className="h-3.5 w-3.5 text-muted-foreground" /> Upfront Retainer:
                                          </span>
                                          <span className="font-mono font-bold text-slate-900">{formatZar(upfrontFee)}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                          <span className="text-slate-600 font-medium flex items-center gap-1">
                                              <Percent className="h-3.5 w-3.5 text-muted-foreground" /> Success Fee (10%):
                                          </span>
                                          <span className="font-mono font-bold text-slate-900">
                                              {isEligible ? `${formatZar(successFee)} (estimated)` : "N/A"}
                                          </span>
                                      </div>
                                      <div className="text-[10px] text-muted-foreground italic border-t pt-2 mt-2">
                                          *The 10% success fee is billed only upon successful written agreement with SARS, calculated on the total amount saved (compromised).
                                      </div>
                                  </CardContent>
                              </Card>

                              {/* Lead Capture */}
                              <Card className="border-2 border-primary/20 bg-slate-900 text-white shadow-xl relative overflow-hidden">
                                  <CardContent className="p-6 space-y-4">
                                      {isSubmitted ? (
                                          <div className="text-center py-6 space-y-3">
                                              <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                                                  <Check className="h-5 w-5 text-white" />
                                              </div>
                                              <div className="space-y-1">
                                                  <h4 className="font-bold text-white text-base">Request Submitted</h4>
                                                  <p className="text-xs text-slate-300">
                                                      Thank you! A SARS Debt Specialist has received your eligibility metrics and will contact you shortly.
                                                  </p>
                                              </div>
                                          </div>
                                      ) : (
                                          <form onSubmit={handleLeadSubmit} className="space-y-4">
                                              <div className="space-y-1">
                                                  <h4 className="font-bold text-white text-sm">Request Debt Compromise Consultation</h4>
                                                  <p className="text-[11px] text-slate-300">
                                                      Submit your assessment variables to speak with a tax practitioner about your SARS debt.
                                                  </p>
                                              </div>
                                              
                                              <div className="space-y-3 pt-2">
                                                  <div>
                                                      <Input
                                                          type="text"
                                                          placeholder="Full Name"
                                                          value={leadName}
                                                          onChange={(e) => setLeadName(e.target.value)}
                                                          required
                                                          className="bg-slate-800/80 border-slate-700 text-white h-9 text-xs placeholder:text-slate-400"
                                                      />
                                                  </div>
                                                  <div>
                                                      <Input
                                                          type="email"
                                                          placeholder="Email Address"
                                                          value={leadEmail}
                                                          onChange={(e) => setLeadEmail(e.target.value)}
                                                          required
                                                          className="bg-slate-800/80 border-slate-700 text-white h-9 text-xs placeholder:text-slate-400"
                                                      />
                                                  </div>
                                                  <div>
                                                      <Input
                                                          type="tel"
                                                          placeholder="Phone Number"
                                                          value={leadPhone}
                                                          onChange={(e) => setLeadPhone(e.target.value)}
                                                          required
                                                          className="bg-slate-800/80 border-slate-700 text-white h-9 text-xs placeholder:text-slate-400"
                                                      />
                                                  </div>
                                              </div>

                                              <Button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary/95 text-slate-900 font-bold h-10 text-xs">
                                                  {isSubmitting ? (
                                                      <>
                                                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Submitting...
                                                      </>
                                                  ) : (
                                                      <>
                                                          Submit Assessment to Specialist <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                                      </>
                                                  )}
                                              </Button>
                                          </form>
                                      )}
                                  </CardContent>
                              </Card>
                          </>
                      )}
                  </div>
              </div>
          </div>
      </section>

      {/* DEBT REDUCTION & MANAGEMENT */}
      <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Reduction */}
              <div className="space-y-8">
                  <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-slate-900">SARS Debt Reduction Services</h2>
                    <p className="text-muted-foreground leading-relaxed">Identifying lawful strategies to minimise outstanding liabilities and negotiate improved outcomes.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {reductionAssistance.map(item => (
                          <div key={item} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs font-bold text-slate-700">
                              <CheckCircle className="h-4 w-4 text-primary shrink-0" /> {item}
                          </div>
                      ))}
                  </div>
                  <Alert className="bg-primary/5 border-primary/20">
                      <Info className="h-4 w-4 text-primary" />
                      <AlertTitle className="font-bold">Did you know?</AlertTitle>
                      <AlertDescription className="text-xs">Many taxpayers unknowingly pay excessive penalties and interest or fail to utilise available legal remedies under the Tax Administration Act.</AlertDescription>
                  </Alert>
              </div>

              {/* Management */}
              <div className="space-y-8">
                  <div className="space-y-4">
                    <h2 className="text-3xl font-bold text-slate-900">SARS Debt Management Services</h2>
                    <p className="text-muted-foreground leading-relaxed">A structured and proactive approach to resolving liabilities and preventing enforcement.</p>
                  </div>
                  <div className="bg-destructive/5 p-6 rounded-2xl border border-destructive/20">
                      <h3 className="text-sm font-black uppercase tracking-widest text-destructive mb-4">Risks of Ignoring Debt</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {risksOfIgnoring.map(risk => (
                              <div key={risk} className="flex items-center gap-2 text-xs font-bold text-destructive">
                                  <AlertTriangle className="h-3.5 w-3.5" /> {risk}
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       {managementServices.map(item => (
                          <div key={item} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> {item}
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      </section>

      {/* COMPROMISE APPLICATIONS DETAIL */}
      <section className="bg-slate-900 text-white py-24">
          <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div className="space-y-6">
                      <h2 className="text-3xl font-bold md:text-4xl">Preparing Your SARS Compromise Application</h2>
                      <p className="text-slate-400 leading-relaxed">Requires detailed financial analysis, legal motivation, and precise supporting documentation.</p>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {applicationSupport.map((item, i) => (
                              <li key={i} className="flex items-center gap-3 text-sm font-medium">
                                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" /> {item}
                              </li>
                          ))}
                      </ul>
                      <p className="text-sm text-slate-400 italic pt-4">We tailor every compromise application based on the taxpayer’s specific financial circumstances and SARS risk factors.</p>
                  </div>
                  <Card className="bg-white text-slate-900 border-none shadow-2xl">
                      <CardHeader className="bg-slate-50 border-b">
                          <CardTitle className="text-lg">Compromise Eligibility</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6 space-y-6">
                          <div className="space-y-3">
                              <h4 className="text-xs font-black uppercase text-green-600 tracking-widest">SARS May Consider If:</h4>
                              {[
                                  'Taxpayer cannot realistically settle the full debt',
                                  'Collection of the full debt is unlikely',
                                  'Taxpayer is experiencing financial distress',
                                  'Settlement provides better recovery outcome for SARS',
                                  'Taxpayer wishes to regularise tax affairs'
                              ].map(item => (
                                  <div key={item} className="flex items-start gap-2 text-xs font-medium">
                                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> {item}
                                  </div>
                              ))}
                          </div>
                          <Separator />
                          <div className="space-y-3">
                              <h4 className="text-xs font-black uppercase text-destructive tracking-widest">SARS May Reject If:</h4>
                              {[
                                  'Taxpayer remains non-compliant',
                                  'Financial disclosures are incomplete',
                                  'SARS believes recovery remains possible',
                                  'Fraud or intentional tax evasion is involved',
                                  'Previous compromise recently granted'
                              ].map(item => (
                                  <div key={item} className="flex items-start gap-2 text-xs font-medium">
                                      <XCircle className="h-4 w-4 text-destructive shrink-0" /> {item}
                                  </div>
                              ))}
                          </div>
                      </CardContent>
                  </Card>
              </div>
          </div>
      </section>

      {/* SERVICES GRID */}
      <section className="container mx-auto px-4 py-12">
          <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl font-bold">Our SARS Tax Debt Services Include</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {servicesGrid.map((service, i) => (
                  <Card key={i} className="border-2 bg-slate-50 hover:border-primary/20 transition-all shadow-sm">
                      <CardHeader className="pb-2">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
                              <service.icon className="h-5 w-5" />
                          </div>
                          <CardTitle className="text-lg font-bold">{service.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                          <p className="text-sm text-muted-foreground leading-relaxed">{service.desc}</p>
                      </CardContent>
                  </Card>
              ))}
          </div>
      </section>

      {/* WHY CHOOSE US & ASSISTED ENTITIES */}
      <section className="bg-slate-50 py-24 border-y">
          <div className="container mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                  <div className="space-y-8">
                      <h2 className="text-3xl font-bold text-slate-900">Why Choose My Accountant for SARS Debt Assistance?</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                        {whyChooseUs.map(item => (
                            <div key={item} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-primary/20 transition-all">
                                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                                <span className="text-xs font-bold text-slate-700">{item}</span>
                            </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        Our professionals are associated with recognized organisations including the South African Institute of Chartered Accountants (SAICA), Chartered Institute for Business Accountants (CIBA), and South African Institute of Taxation (SAIT).
                      </p>
                  </div>
                  <div className="space-y-6">
                      <h2 className="text-3xl font-bold text-slate-900">Businesses & Individuals We Assist</h2>
                      <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="grid grid-cols-1 gap-3">
                            {assistedEntities.map(item => (
                                <div key={item} className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                                    <Users className="h-4 w-4 text-primary" /> {item}
                                </div>
                            ))}
                        </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* REGIONAL SEO SECTION */}
      <section className="container mx-auto px-4 max-w-6xl py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><MapPin className="h-6 w-6" /></div>
                  <div className="space-y-4 text-center lg:text-left">
                    <h2 className="text-3xl font-bold text-slate-900">SARS Debt Assistance Across South Africa</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        My Accountant provides online SARS compromise and tax debt management services to clients throughout South Africa.
                    </p>
                    <div className="flex flex-wrap justify-center lg:justify-start gap-2 pt-2">
                        {["Johannesburg", "Randburg", "Sandton", "Midrand", "Pretoria", "Durban", "Cape Town", "Gauteng"].map(loc => (
                            <Badge key={loc} variant="outline" className="bg-white border-primary/20 text-primary font-bold">{loc}</Badge>
                        ))}
                    </div>
                    <p className="text-sm text-muted-foreground italic">
                        Our online systems allow taxpayers nationwide to securely share documentation and receive professional tax assistance remotely.
                    </p>
                  </div>
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
      <section className="container mx-auto px-4 max-w-4xl py-12 border-t">
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
        <div className="max-w-4xl mx-auto p-12 rounded-[3rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-8">
                <h2 className="text-4xl font-black">Speak to a SARS Debt Specialist</h2>
                <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                    If you are struggling with SARS debt, tax penalties, or SARS collection pressure, My Accountant can assist you with practical and professional tax debt solutions.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Button asChild size="lg" className="h-14 px-12 text-lg font-bold shadow-lg">
                        <Link href="/contact">Contact My Accountant Today</Link>
                    </Button>
                </div>
            </div>
            <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none"><ShieldCheck size={400} /></div>
        </div>
      </section>
    </div>
  );
}
