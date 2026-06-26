'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  CheckCircle2, 
  ShieldCheck, 
  FileText, 
  ArrowRight,
  ArrowLeft,
  Landmark, 
  Users, 
  MapPin, 
  Lock,
  Eye,
  EyeOff,
  Loader2,
  BadgeCheck,
  Clock,
  Coins,
  Gift,
  AlertTriangle,
  Phone,
  Mail,
  ExternalLink,
  Sparkles,
  Banknote,
  ClipboardCheck,
  HeartPulse,
  Home,
  Briefcase,
  GraduationCap,
  PiggyBank,
  HelpCircle,
  MessageCircle,
  TrendingUp,
  CheckCircle,
  Info
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

export default function SarsRefundPageClient() {
  const { toast } = useToast();

  // Multi-step form
  const [formStep, setFormStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1 fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Step 2 fields
  const [efilingUsername, setEfilingUsername] = useState('');
  const [efilingPassword, setEfilingPassword] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Checklist state
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const qualifyingChecklist = [
    { id: 'salary', label: 'I earned a salary or income in the last 3 tax years', icon: Briefcase },
    { id: 'medical', label: 'I have or had medical aid', icon: HeartPulse },
    { id: 'retirement', label: 'I contribute to a retirement annuity or pension fund', icon: PiggyBank },
    { id: 'wfh', label: 'I work or worked from home', icon: Home },
    { id: 'unfiled', label: "I haven't filed all my tax returns", icon: FileText },
    { id: 'travel', label: 'I use my own vehicle for work travel', icon: TrendingUp },
    { id: 'donations', label: 'I make donations to registered charities (Section 18A)', icon: Gift },
    { id: 'study', label: 'I pay for my own studies related to my job', icon: GraduationCap },
  ];

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  const toggleCheckItem = (id: string) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone) {
      toast({
        title: "Please complete all fields",
        description: "We need your name, email and phone number to continue.",
        variant: "destructive"
      });
      return;
    }
    setFormStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!efilingUsername || !efilingPassword) {
      toast({
        title: "SARS eFiling details required",
        description: "Please provide your SARS eFiling username and password so we can run your compliance check.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await sendEmail({
        to: 'info@myacc.co.za',
        subject: `🟢 SARS Tax Refund Lead: ${fullName}`,
        replyTo: email,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #0284c7;">New SARS Tax Refund Assessment Request</h2>
            <hr style="border: 1px solid #e2e8f0;" />
            
            <h3 style="color: #334155;">Contact Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; font-weight: bold; color: #475569;">Full Name:</td><td style="padding: 8px;">${fullName}</td></tr>
              <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold; color: #475569;">Email:</td><td style="padding: 8px;">${email}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; color: #475569;">Phone:</td><td style="padding: 8px;">${phone}</td></tr>
            </table>

            <h3 style="color: #334155; margin-top: 20px;">SARS eFiling Credentials</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr style="background: #f8fafc;"><td style="padding: 8px; font-weight: bold; color: #475569;">Username:</td><td style="padding: 8px;">${efilingUsername}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; color: #475569;">Password:</td><td style="padding: 8px;">${efilingPassword}</td></tr>
            </table>

            <h3 style="color: #334155; margin-top: 20px;">Self-Assessment Checklist (${checkedCount}/${qualifyingChecklist.length} items checked)</h3>
            <ul style="list-style: none; padding: 0;">
              ${qualifyingChecklist.map(item => `
                <li style="padding: 4px 0; color: ${checkedItems[item.id] ? '#16a34a' : '#94a3b8'};">
                  ${checkedItems[item.id] ? '✅' : '⬜'} ${item.label}
                </li>
              `).join('')}
            </ul>
            
            <hr style="border: 1px solid #e2e8f0; margin-top: 20px;" />
            <p style="color: #94a3b8; font-size: 12px;">This lead was generated from the SARS Tax Refund landing page at myacc.co.za/sars-tax-refund</p>
          </div>
        `
      });

      toast({
        title: "Assessment Request Submitted! ✅",
        description: "Our tax team will review your eFiling profile and contact you within 24 hours."
      });
      setIsSubmitted(true);
    } catch (error) {
      console.error("Lead submit error:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error sending your details. Please try again or call us on 010 109 1625.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => {
    document.getElementById('assessment-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const refundScenarios = [
    { 
      icon: HeartPulse, 
      title: 'Medical Aid Credits', 
      description: 'Tax credits for medical aid contributions and out-of-pocket medical expenses can result in significant refunds.',
      range: 'R2,000 – R15,000+',
      color: 'text-rose-400'
    },
    { 
      icon: PiggyBank, 
      title: 'Retirement Contributions', 
      description: 'Contributions to retirement annuities and pension funds are tax-deductible up to 27.5% of your income.',
      range: 'R3,000 – R25,000+',
      color: 'text-emerald-400'
    },
    { 
      icon: Home, 
      title: 'Work From Home', 
      description: 'If you have a dedicated home office, you may claim a portion of rent, electricity, internet and other costs.',
      range: 'R3,000 – R12,000+',
      color: 'text-sky-400'
    },
    { 
      icon: Briefcase, 
      title: 'Travel Allowance', 
      description: 'If you use your own vehicle for work, you can claim business kilometres against your travel allowance.',
      range: 'R5,000 – R30,000+',
      color: 'text-amber-400'
    },
    { 
      icon: Gift, 
      title: 'Section 18A Donations', 
      description: 'Donations to approved public benefit organisations are deductible up to 10% of your taxable income.',
      range: 'R500 – R5,000+',
      color: 'text-violet-400'
    },
    { 
      icon: GraduationCap, 
      title: 'Study & Education', 
      description: 'If you pay for studies related to your current employment, these may qualify as deductible expenses.',
      range: 'R1,000 – R8,000+',
      color: 'text-cyan-400'
    },
  ];

  const processSteps = [
    {
      step: '01',
      title: 'Submit Your Details',
      description: 'Complete our secure form with your contact information and SARS eFiling login credentials.',
      icon: ClipboardCheck,
      color: 'from-cyan-500 to-blue-500'
    },
    {
      step: '02',
      title: 'We Run a Full Compliance Check',
      description: 'Our tax practitioners log in and review your eFiling profile for outstanding returns, assessments, and refund opportunities.',
      icon: FileText,
      color: 'from-violet-500 to-purple-500'
    },
    {
      step: '03',
      title: 'Get Your Results',
      description: "We'll contact you with a clear report of what's outstanding, what refunds you may be owed, and our recommended next steps.",
      icon: Coins,
      color: 'from-emerald-500 to-green-500'
    },
  ];

  const faqs = [
    {
      question: "Is it safe to share my SARS eFiling login?",
      answer: "Absolutely. We are registered tax practitioners. Your credentials are used solely to access your SARS profile and run the compliance check. We do not store your password after the assessment. All data is handled in strict compliance with POPIA (Protection of Personal Information Act). We use the same process as any registered tax practitioner who files returns on your behalf."
    },
    {
      question: "What if I don't know my eFiling login details?",
      answer: "No problem! You can reset your SARS eFiling username and password by visiting the SARS eFiling portal at https://secure.sarsefiling.co.za/app/forgotdetails/username. Once you've recovered your details, come back and complete the form. If you need help with the reset process, give us a call on 010 109 1625."
    },
    {
      question: "Is the compliance assessment really free?",
      answer: "Yes, 100% free with no obligation. We'll review your eFiling profile and provide a report on outstanding returns and potential refunds. If you choose to engage us to file returns or claim refunds, we'll quote you upfront before any work begins."
    },
    {
      question: "How long does the assessment take?",
      answer: "Typically 24-48 hours from when we receive your details. For straightforward cases, we can often provide results the same day. We'll contact you by phone or email with our findings."
    },
    {
      question: "What if I owe SARS instead of being owed a refund?",
      answer: "That's valuable information to have! Many people don't realise they have outstanding balances accruing interest and penalties. We'll advise you on the best way to resolve any debt, which may include payment arrangements, penalty remissions, or compromise applications. Early action always results in better outcomes."
    },
    {
      question: "Which tax years can you check?",
      answer: "We review all available tax years on your profile, typically going back 3-5 years. SARS keeps records of assessments and returns for previous years, so there may be unclaimed refunds from past periods."
    },
    {
      question: "Do I need to provide any documents?",
      answer: "Not for the initial compliance assessment. Your SARS eFiling credentials give us everything we need to review your profile. If we find refund opportunities and you decide to proceed, we may request supporting documents like IRP5 certificates, medical aid tax certificates, or retirement fund contribution certificates."
    },
    {
      question: "What types of tax returns do you handle?",
      answer: "We handle individual income tax returns (ITR12), provisional tax returns (IRP6), and all supporting schedules. Whether you're a salaried employee, freelancer, or have multiple income sources, we can assist."
    },
  ];

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center glass-card neon-glow border border-white/10">
          <CardContent className="p-10 space-y-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-black text-foreground">Assessment Request Received!</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Thank you, <strong className="text-foreground">{fullName}</strong>! Our tax team has received your 
              details and will review your SARS eFiling profile within <strong className="text-foreground">24 hours</strong>.
            </p>
            <Separator className="my-4" />
            <div className="space-y-3 text-sm text-muted-foreground text-left">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>A tax practitioner will log into your eFiling profile</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>We&apos;ll identify outstanding returns and refund opportunities</span>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>We&apos;ll call you with a clear report and recommended actions</span>
              </div>
            </div>
            <div className="pt-4">
              <Link href="/">
                <Button variant="outline" className="border-white/10 hover:bg-white/5 border-primary">
                  Return to Homepage
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-0 pb-0 bg-white">
      {/* ===== HERO SECTION ===== */}
      <section className="relative w-full overflow-hidden pt-20 lg:pt-28 pb-24 text-center bg-background">
        {/* Aurora background blobs */}
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="aurora-blob aurora-blue w-[300px] h-[300px] bottom-0 left-1/3 animate-aurora-drift" style={{ animationDelay: '-10s' }} />
        {/* Dot grid overlay */}
        <div className="absolute inset-0 bg-dot-grid" />

        {/* Aurora blobs */}
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-48 -left-24" style={{ animation: 'aurora-drift 20s ease-in-out infinite' }} />
        <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-0" style={{ animation: 'aurora-drift 25s ease-in-out infinite reverse' }} />
        
        <div className="container relative z-10 mx-auto px-4">
          <Badge className="mb-5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
            <Gift className="h-3.5 w-3.5 mr-1.5" />
            Free Compliance Assessment
          </Badge>

          <h1 className="mb-6 text-4xl font-black tracking-tight text-foreground md:text-5xl lg:text-6xl xl:text-7xl leading-[1.1]">
            Are You Due a <span className="text-gradient">Refund</span> from <span className="text-gradient">SARS</span>?
          </h1>

          <div className="mx-auto mb-10 max-w-3xl text-lg font-medium text-muted-foreground md:text-xl leading-relaxed">
            <p>
              Thousands of South Africans are owed money by SARS and don&apos;t even know it. 
              Unclaimed medical credits, retirement deductions, and unfiled returns could mean 
              <strong className="text-foreground"> real money back in your pocket</strong>.
            </p>
            <p className="mt-3">
              Let our registered tax practitioners run a <strong className="text-foreground">free compliance check</strong> on 
              your SARS eFiling profile — in 24 hours, you&apos;ll know exactly where you stand.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              className="bg-gradient text-primary-foreground text-lg px-8 py-6 rounded-xl neon-glow hover:scale-105 transition-all duration-300 font-bold"
              onClick={scrollToForm}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Check If You&apos;re Owed Money
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white/10 hover:bg-white/5 text-lg px-8 py-6 rounded-xl"
              asChild
            >
              <a href="tel:0101091625">
                <Phone className="mr-2 h-5 w-5" />
                Call 010 109 1625
              </a>
            </Button>
          </div>

          {/* Trust bar */}
          <div className="mt-12 flex flex-wrap justify-center items-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-emerald-500" />
              <span>256-bit Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>POPIA Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-emerald-500" />
              <span>Registered Tax Practitioners</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-emerald-500" />
              <span>Results in 24 Hours</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="relative w-full py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10 border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">
              Simple 3-Step Process
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-foreground">
              How It <span className="text-gradient">Works</span>
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground text-lg">
              Getting your free compliance assessment is quick and easy. No paperwork needed — just your eFiling details.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {processSteps.map((step, index) => (
              <div key={step.step} className="relative group">
                {index < processSteps.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-white/20 to-transparent z-0" />
                )}
                <Card className="glass-card border border-white/10 hover:border-white/20 transition-all duration-300 h-full group-hover:neon-glow">
                  <CardContent className="p-8 text-center space-y-4">
                    <div className={`mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-xs font-mono text-muted-foreground tracking-widest uppercase">Step {step.step}</div>
                    <h3 className="text-xl font-bold text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== QUALIFYING CHECKLIST ===== */}
      <section className="relative w-full py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start max-w-6xl mx-auto">
            <div>
              <Badge className="mb-4 bg-amber-500/10 text-amber-500 hover:bg-amber-500/10 border border-amber-500/20 px-4 py-1 text-xs font-bold uppercase tracking-widest">
                Quick Self-Assessment
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black text-foreground mb-4">
                Could You Be Owed a <span className="text-gradient">Tax Refund</span>?
              </h2>
              <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                Check the boxes below that apply to you. The more boxes you tick, the more likely you are to have 
                unclaimed tax deductions and credits — which means money SARS may owe you.
              </p>

              {checkedCount > 0 && (
                <div className={`p-4 rounded-xl border transition-all duration-500 ${
                  checkedCount >= 4 
                    ? 'bg-emerald-500/10 border-emerald-500/30' 
                    : checkedCount >= 2 
                    ? 'bg-amber-500/10 border-amber-500/30' 
                    : 'bg-sky-500/10 border-sky-500/30'
                }`}>
                  <div className="flex items-center gap-3">
                    {checkedCount >= 4 ? (
                      <Coins className="h-6 w-6 text-emerald-500" />
                    ) : (
                      <Info className="h-6 w-6 text-amber-500" />
                    )}
                    <div>
                      <p className="font-bold text-foreground">
                        {checkedCount >= 4 
                          ? `High likelihood of a refund! (${checkedCount}/${qualifyingChecklist.length} matched)` 
                          : checkedCount >= 2 
                          ? `Good chance of a refund (${checkedCount}/${qualifyingChecklist.length} matched)` 
                          : `${checkedCount}/${qualifyingChecklist.length} matched — keep checking!`
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {checkedCount >= 3 
                          ? "You should definitely get a free compliance check done." 
                          : "Every deduction counts. Let us check your profile."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {qualifyingChecklist.map((item) => (
                <button
                  key={item.id}
                  onClick={() => toggleCheckItem(item.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 text-left ${
                    checkedItems[item.id] 
                      ? 'bg-emerald-500/10 border-emerald-500/30 shadow-sm' 
                      : 'glass-card border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-300 ${
                    checkedItems[item.id] 
                      ? 'bg-emerald-500 border-emerald-500' 
                      : 'border-white/20'
                  }`}>
                    {checkedItems[item.id] && <CheckCircle2 className="h-4 w-4 text-white" />}
                  </div>
                  <item.icon className={`h-5 w-5 shrink-0 ${checkedItems[item.id] ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                  <span className={`text-sm font-medium ${checkedItems[item.id] ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {item.label}
                  </span>
                </button>
              ))}

              {checkedCount >= 2 && (
                <div className="pt-4">
                  <Button 
                    className="w-full bg-gradient text-primary-foreground py-6 rounded-xl neon-glow hover:scale-[1.02] transition-all duration-300 font-bold text-base"
                    onClick={scrollToForm}
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Get Your Free Assessment Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ===== REFUND SCENARIOS ===== */}
      <section className="relative w-full py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10 border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">
              Common Refund Scenarios
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-foreground">
              Where Your <span className="text-gradient">Refund</span> Could Come From
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground text-lg">
              These are the most common deductions and credits that South African taxpayers miss — 
              resulting in unclaimed refunds sitting with SARS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {refundScenarios.map((scenario) => (
              <Card key={scenario.title} className="glass-card border border-white/10 hover:border-white/20 transition-all duration-300 hover:neon-glow group">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <scenario.icon className={`h-8 w-8 ${scenario.color}`} />
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs font-bold border-primary">
                      <Banknote className="h-3 w-3 mr-1" />
                      {scenario.range}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-bold text-foreground">{scenario.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{scenario.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MAIN FORM SECTION ===== */}
      <section id="assessment-form" className="relative w-full py-20 bg-white">
        <div className="aurora-blob aurora-cyan w-[400px] h-[400px] -bottom-32 -right-20" style={{ animation: 'aurora-drift 22s ease-in-out infinite' }} />
        <div className="aurora-blob aurora-violet w-[300px] h-[300px] top-10 -left-16" style={{ animation: 'aurora-drift 18s ease-in-out infinite reverse' }} />

        <div className="container relative z-10 mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 px-4 py-1 text-xs font-bold uppercase tracking-widest">
                <Gift className="h-3.5 w-3.5 mr-1.5" />
                100% Free — No Obligation
              </Badge>
              <h2 className="text-3xl md:text-4xl font-black text-foreground">
                Start Your Free <span className="text-gradient">Compliance Assessment</span>
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground text-lg">
                Complete the form below and our tax practitioners will review your SARS eFiling profile within 24 hours.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Form Card */}
              <Card className="lg:col-span-3 glass-card neon-glow border border-white/10">
                <CardHeader className="pb-4">
                  {/* Progress indicator */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all duration-300 ${
                      formStep >= 1 ? 'bg-gradient text-white' : 'bg-white/10 text-muted-foreground'
                    }`}>1</div>
                    <div className={`h-0.5 flex-1 rounded transition-all duration-500 ${formStep >= 2 ? 'bg-gradient' : 'bg-white/10'}`} />
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all duration-300 ${
                      formStep >= 2 ? 'bg-gradient text-white' : 'bg-white/10 text-muted-foreground'
                    }`}>2</div>
                  </div>

                  <CardTitle className="text-xl">
                    {formStep === 1 ? 'Your Contact Details' : 'SARS eFiling Login'}
                  </CardTitle>
                  <CardDescription>
                    {formStep === 1 
                      ? 'Step 1 of 2 — Tell us how to reach you.' 
                      : 'Step 2 of 2 — We need your eFiling credentials to run the compliance check.'
                    }
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                  {formStep === 1 ? (
                    <form onSubmit={handleStep1Next} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="text-sm font-medium">Full Name *</Label>
                        <Input 
                          id="fullName" 
                          placeholder="e.g. John Doe" 
                          value={fullName} 
                          onChange={(e) => setFullName(e.target.value)} 
                          required 
                          className="bg-white/5 border-white/10 focus:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="e.g. john@example.com" 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                          required 
                          className="bg-white/5 border-white/10 focus:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">Phone Number *</Label>
                        <Input 
                          id="phone" 
                          type="tel" 
                          placeholder="e.g. 082 123 4567" 
                          value={phone} 
                          onChange={(e) => setPhone(e.target.value)} 
                          required 
                          className="bg-white/5 border-white/10 focus:border-primary"
                        />
                      </div>
                      <Button type="submit" className="w-full bg-gradient text-primary-foreground py-6 rounded-xl font-bold text-base hover:scale-[1.02] transition-all duration-300">
                        Continue to Step 2
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </form>
                  ) : (
                    <form onSubmit={handleFinalSubmit} className="space-y-4">
                      <Alert className="bg-sky-500/10 border-sky-500/30">
                        <Lock className="h-4 w-4 text-sky-400" />
                        <AlertTitle className="text-sky-300 font-bold">Your credentials are safe</AlertTitle>
                        <AlertDescription className="text-muted-foreground text-xs">
                          We use your login only to review your SARS profile. Your details are encrypted and handled under strict POPIA compliance. 
                          <Link href="/popia" className="text-primary hover:underline ml-1">View our privacy policy →</Link>
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <Label htmlFor="efilingUsername" className="text-sm font-medium">SARS eFiling Username *</Label>
                        <Input 
                          id="efilingUsername" 
                          placeholder="Your eFiling username" 
                          value={efilingUsername} 
                          onChange={(e) => setEfilingUsername(e.target.value)} 
                          required 
                          className="bg-white/5 border-white/10 focus:border-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="efilingPassword" className="text-sm font-medium">SARS eFiling Password *</Label>
                        <div className="relative">
                          <Input 
                            id="efilingPassword" 
                            type={showPassword ? 'text' : 'password'} 
                            placeholder="Your eFiling password" 
                            value={efilingPassword} 
                            onChange={(e) => setEfilingPassword(e.target.value)} 
                            required 
                            className="bg-white/5 border-white/10 focus:border-primary pr-12"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs text-muted-foreground flex items-start gap-2">
                          <HelpCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>
                            Don&apos;t know your eFiling details?{' '}
                            <a 
                              href="https://secure.sarsefiling.co.za/app/forgotdetails/username" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                            >
                              Reset them here on SARS eFiling
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </span>
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setFormStep(1)} 
                          className="border-white/10 hover:bg-white/5"
                        >
                          <ArrowLeft className="mr-1 h-4 w-4" />
                          Back
                        </Button>
                        <Button 
                          type="submit" 
                          className="flex-1 bg-gradient text-primary-foreground py-6 rounded-xl font-bold text-base neon-glow hover:scale-[1.02] transition-all duration-300"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="mr-2 h-5 w-5" />
                              Submit for Free Assessment
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  )}
                </CardContent>
              </Card>

              {/* Trust sidebar */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="glass-card border border-white/10">
                  <CardContent className="p-6 space-y-5">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-emerald-500" />
                      Why Trust Us?
                    </h3>
                    <div className="space-y-4">
                      {[
                        { icon: BadgeCheck, text: 'Registered Tax Practitioners with SARS', color: 'text-cyan-400' },
                        { icon: Lock, text: 'POPIA compliant — your data is protected', color: 'text-emerald-400' },
                        { icon: Users, text: 'Thousands of individuals assisted', color: 'text-violet-400' },
                        { icon: Clock, text: 'Results within 24 hours', color: 'text-amber-400' },
                        { icon: Gift, text: '100% free assessment, no hidden costs', color: 'text-rose-400' },
                        { icon: Landmark, text: 'Professional firm based in Johannesburg', color: 'text-sky-400' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <item.icon className={`h-5 w-5 ${item.color} shrink-0 mt-0.5`} />
                          <span className="text-sm text-muted-foreground">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border border-white/10">
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-bold text-foreground flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-emerald-500" />
                      Prefer to Talk?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Not comfortable with the form? No problem — call or email us directly.
                    </p>
                    <div className="space-y-3">
                      <a href="tel:0101091625" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                        <Phone className="h-4 w-4" />
                        010 109 1625
                      </a>
                      <a href="mailto:info@myacc.co.za" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                        <Mail className="h-4 w-4" />
                        info@myacc.co.za
                      </a>
                      <a href="https://maps.google.com/?q=Stonemill+Office+Park+Johannesburg" target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 text-sm text-muted-foreground hover:text-primary transition-colors">
                        <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                        Stonemill Office Park, 300 Acacia Road, Darrenwood, Johannesburg
                      </a>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SOCIAL PROOF / REVIEWS ===== */}
      <section className="w-full py-16">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10 border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">
            Trusted By Thousands
          </Badge>
          <h2 className="text-3xl md:text-4xl font-black text-foreground mb-10">
            What Our <span className="text-gradient">Clients</span> Say
          </h2>
          <TrustIndexWidget />
        </div>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section className="relative w-full py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10 border-none px-4 py-1 text-xs font-bold uppercase tracking-widest">
              Got Questions?
            </Badge>
            <h2 className="text-3xl md:text-4xl font-black text-foreground">
              Frequently Asked <span className="text-gradient">Questions</span>
            </h2>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`faq-${index}`} className="glass-card border border-white/10 rounded-xl px-6 overflow-hidden">
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative w-full py-20 overflow-hidden">
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -bottom-48 left-1/2 -translate-x-1/2" style={{ animation: 'aurora-drift 20s ease-in-out infinite' }} />
        
        <div className="container relative z-10 mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-black text-foreground">
              Don&apos;t Leave <span className="text-gradient">Your Money</span> With SARS
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              It takes 2 minutes to submit your details. Within 24 hours, you&apos;ll know if SARS owes you money. 
              The assessment is <strong className="text-foreground">completely free</strong> — you have nothing to lose.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient text-primary-foreground text-lg px-8 py-6 rounded-xl neon-glow hover:scale-105 transition-all duration-300 font-bold"
                onClick={scrollToForm}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Get My Free Assessment
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white/10 hover:bg-white/5 text-lg px-8 py-6 rounded-xl"
                asChild
              >
                <a href="tel:0101091625">
                  <Phone className="mr-2 h-5 w-5" />
                  Call Us Now
                </a>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground pt-4">
              <Lock className="h-3 w-3 inline mr-1" />
              Your information is protected under POPIA and used solely for your compliance assessment. 
              <Link href="/popia" className="text-primary hover:underline ml-1">Privacy Policy</Link> · 
              <Link href="/terms" className="text-primary hover:underline ml-1">Terms of Service</Link>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
