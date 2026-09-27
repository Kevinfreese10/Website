'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle,
  ShieldCheck,
  Users,
  Receipt,
  Landmark,
  CalendarDays,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Calculator,
  Check,
  X,
  Clock,
  BadgeCheck
} from 'lucide-react';
import Link from 'next/link';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { Separator } from '@/components/ui/separator';

export default function MonthlyPayrollPageClient() {
  const features = [
    {
      title: 'Automated Digital Payslips',
      description: 'Professional, BCEA-compliant digital PDF payslips emailed securely to your employees on your scheduled pay date.',
      icon: Receipt,
    },
    {
      title: 'Monthly EMP201 Submissions',
      description: 'Accurate calculation of PAYE, UIF (1% + 1%), and SDL (1%), submitted to SARS eFiling on or before the 7th.',
      icon: Landmark,
    },
    {
      title: 'UIF Declarations (uFiling)',
      description: 'Monthly electronic filing with the Department of Employment and Labour, employee registrations (UI-19), and compliance.',
      icon: ShieldCheck,
    },
    {
      title: 'Leave & Benefits Tracking',
      description: 'Systematic statutory tracking of annual leave, sick leave, maternity leave, and family responsibility leave balances.',
      icon: CalendarDays,
    },
  ];

  const pricingTiers = [
    {
      title: 'Micro Business Payroll',
      range: '1 – 5 Employees',
      price: 'R550',
      period: 'per month',
      popular: false,
      features: [
        'Monthly gross-to-net payslips',
        'EMP201 declaration submitted to SARS',
        'UIF uFiling declarations',
        'EFT bank payment batch report',
        'Email & WhatsApp support',
      ],
      cta: 'Get Started',
      href: '/contact?service=payroll-1-5',
    },
    {
      title: 'Growing SME Payroll',
      range: '6 – 15 Employees',
      price: 'R950',
      period: 'per month',
      popular: true,
      features: [
        'Everything in Micro Package',
        'Overtime, allowances & bonus calculations',
        'Bi-annual EMP501 recons & IRP5 certificates',
        'Medical aid & pension fund structuring',
        'Priority SARS tax practitioner review',
      ],
      cta: 'Most Popular Choice',
      href: '/contact?service=payroll-6-15',
    },
    {
      title: 'Enterprise Business Payroll',
      range: '16 – 30+ Employees',
      price: 'R1,650',
      period: 'per month',
      popular: false,
      features: [
        'Everything in SME Package',
        'Custom cost center & departmental reporting',
        'Full EMP501 reconciliation & e@syFile filing',
        'COIDA Return of Earnings (W.As.8) support',
        'Dedicated senior payroll manager',
      ],
      cta: 'Contact for Enterprise',
      href: '/contact?service=payroll-enterprise',
    },
  ];

  const comparisonRows = [
    {
      feature: 'Guaranteed EMP201 Submission by 7th',
      myacc: true,
      software: 'You must file it yourself',
      inhouse: true,
    },
    {
      feature: 'Bi-Annual EMP501 Reconciliations & IRP5s',
      myacc: true,
      software: 'Manual export required',
      inhouse: true,
    },
    {
      feature: 'Licensed SARS Tax Practitioner Sign-off',
      myacc: true,
      software: false,
      inhouse: 'Rare (requires external review)',
    },
    {
      feature: 'Zero Software License Subscriptions Needed',
      myacc: true,
      software: 'R400 – R1,500/mo extra',
      inhouse: 'Additional license cost',
    },
    {
      feature: 'Direct Employee Query Resolution',
      myacc: true,
      software: false,
      inhouse: true,
    },
    {
      feature: 'Average Cost for 10 Employees',
      myacc: 'R950 / month all-inclusive',
      software: 'R600 (software) + your time',
      inhouse: 'R15,000+ / mo salary',
    },
  ];

  const faqs = [
    {
      q: 'When must the EMP201 return and payment be submitted to SARS?',
      a: 'The EMP201 return (covering PAYE, UIF, and SDL) and full payment must reach SARS on or before the 7th day of the month following the payroll period (or the preceding business day if the 7th falls on a weekend or public holiday). Missing this deadline triggers an automatic 10% late-payment penalty from SARS.',
    },
    {
      q: 'How does your outsourced payroll service differ from software like Sage Payroll or SimplePay?',
      a: 'With standalone payroll software, you still have to enter data, configure tax tables, log into SARS eFiling, submit EMP201 returns, reconcile EMP501 on e@syFile, and resolve SARS notices yourself. With My Accountant, we provide a complete managed bureau: we run the calculations, generate the payslips, file directly to SARS, and handle all statutory compliance for you.',
    },
    {
      q: 'Do you manage bi-annual EMP501 reconciliations and generate IRP5 tax certificates?',
      a: 'Yes. We manage both the interim reconciliation (September/October) and final annual reconciliation (May/June) on SARS e@syFile, balance your payroll ledger against SARS statements of account, and generate IRP5/IT3(a) certificates for all employees.',
    },
    {
      q: 'How do you handle new employee appointments and terminations with the UIF?',
      a: 'We submit electronic UI-19 declarations via the Department of Employment and Labour’s uFiling system for every new hire and exit, ensuring employee records match official state databases for future maternity or unemployment claims.',
    },
    {
      q: 'Can you assist with the annual COIDA Return of Earnings (W.As.8)?',
      a: 'Yes. We compile total actual and estimated payroll figures, submit your annual Return of Earnings (ROE / W.As.8) to the Compensation Fund, and secure your COIDA Letter of Good Standing for tenders and construction sites.',
    },
  ];

  return (
    <div className="space-y-16 pb-24 bg-background relative overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative w-full overflow-hidden pt-16 lg:pt-24 pb-20 text-center bg-background border-b border-border/40">
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div
          className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift"
          style={{ animationDelay: '-5s' }}
        />
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container relative z-10 mx-auto px-4 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-2">
            <BadgeCheck className="h-4 w-4" />
            <span>Guaranteed SARS EMP201 & Department of Labour Compliance</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl lg:text-7xl text-hero-gradient pb-2">
            Managed Monthly <span className="text-gradient">Payroll</span> Outsourcing
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Eliminate payroll headaches. From compliant payslips and uFiling to monthly EMP201 submissions and bi-annual EMP501 recons — managed end-to-end by registered SARS tax practitioners.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button asChild size="lg" className="font-bold px-8 h-12">
              <Link href="#pricing">
                View Fixed Payroll Pricing <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold px-8 h-12">
              <Link href="/calculators/payroll-cost">Payroll Cost Calculator</Link>
            </Button>
          </div>

          <div className="pt-6 flex flex-wrap justify-center items-center gap-6 text-xs md:text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="h-4 w-4 text-primary" /> Submitted before the 7th
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="h-4 w-4 text-primary" /> SARS PR-0098553
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Zero Penalty Guarantee
            </span>
          </div>
        </div>
      </section>

      {/* Trust Widget */}
      <div className="container mx-auto px-4">
        <TrustIndexWidget />
      </div>

      {/* FEATURES GRID */}
      <section className="container mx-auto px-4 max-w-6xl space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Everything Your SME Payroll Requires
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our end-to-end managed payroll bureau handles every statutory calculation, submission, and employee distribution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border border-border/60 bg-card hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold text-foreground">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* PRICING PACKAGES */}
      <section id="pricing" className="container mx-auto px-4 max-w-6xl space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Transparent Monthly Payroll Retainers
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Fixed monthly fee with zero hidden setup costs, no software subscriptions, and no lock-in contracts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.title}
              className={`relative flex flex-col justify-between border-2 ${
                tier.popular ? 'border-primary shadow-lg' : 'border-border/60'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 right-6 px-3 py-1 bg-primary text-primary-foreground font-bold text-xs rounded-full uppercase tracking-wider">
                  Recommended
                </div>
              )}
              <CardContent className="p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground">{tier.title}</h3>
                  <span className="inline-block px-2.5 py-0.5 mt-2 bg-primary/10 text-primary text-xs font-semibold rounded-md">
                    {tier.range}
                  </span>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-black text-foreground">{tier.price}</span>
                    <span className="text-xs text-muted-foreground font-medium">/ month</span>
                  </div>
                </div>

                <Separator />

                <ul className="space-y-3 text-sm">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-foreground/90 font-medium">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild size="lg" className="w-full font-bold h-12 mt-4">
                  <Link href={tier.href}>
                    {tier.cta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* COMPARISON TABLE: Managed Bureau vs. Software */}
      <section className="container mx-auto px-4 max-w-5xl space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Managed Payroll Outsourcing vs. DIY Software
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Why South African business owners choose a managed bureau over expensive software licenses.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 border-b border-border text-xs uppercase font-bold text-foreground/80">
              <tr>
                <th className="p-4 md:p-5">Feature</th>
                <th className="p-4 md:p-5 text-primary font-extrabold bg-primary/5">
                  My Accountant (Managed)
                </th>
                <th className="p-4 md:p-5">DIY Software (Sage / SimplePay)</th>
                <th className="p-4 md:p-5">In-House Payroll Officer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {comparisonRows.map((row, i) => (
                <tr key={i} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4 md:p-5 font-semibold text-foreground">
                    {row.feature}
                  </td>
                  <td className="p-4 md:p-5 bg-primary/5 font-bold text-primary">
                    {typeof row.myacc === 'boolean' && row.myacc ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                        <Check className="h-5 w-5" /> Included
                      </span>
                    ) : (
                      row.myacc
                    )}
                  </td>
                  <td className="p-4 md:p-5 text-muted-foreground">
                    {typeof row.software === 'boolean' && !row.software ? (
                      <span className="flex items-center gap-1 text-rose-500 font-medium">
                        <X className="h-4 w-4" /> No
                      </span>
                    ) : (
                      row.software
                    )}
                  </td>
                  <td className="p-4 md:p-5 text-muted-foreground">
                    {typeof row.inhouse === 'boolean' && row.inhouse ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <Check className="h-4 w-4" /> Yes
                      </span>
                    ) : (
                      row.inhouse
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* CALCULATOR INTERLINKING CALLOUT */}
      <section className="container mx-auto px-4 max-w-4xl">
        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-10 space-y-6">
          <div className="flex items-center gap-3">
            <Calculator className="h-7 w-7 text-primary" />
            <h3 className="text-2xl font-bold">Free South African Payroll Calculators</h3>
          </div>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Estimate your employee costs, monthly PAYE withholding, and UIF contributions before hiring:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <Button asChild variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 h-11">
              <Link href="/calculators/salary-tax">Salary Tax Calculator</Link>
            </Button>
            <Button asChild variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 h-11">
              <Link href="/calculators/total-cost-to-employer">Cost to Employer</Link>
            </Button>
            <Button asChild variant="outline" className="bg-white/5 border-white/20 text-white hover:bg-white/10 h-11">
              <Link href="/calculators/payroll-cost">Payroll Bureau Cost</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FAQS */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold text-foreground">
            Frequently Asked Questions About Payroll Outsourcing
          </h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-border pb-6 last:border-0">
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-start gap-2">
                <HelpCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span>{faq.q}</span>
              </h3>
              <p className="text-muted-foreground leading-relaxed pl-7 text-sm md:text-base">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 max-w-4xl text-center space-y-6 pt-8">
        <h2 className="text-3xl font-bold text-foreground">
          Ready to Automate Your Monthly Payroll?
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Never stress about EMP201 deadlines, late filing penalties, or complex tax tables again.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild size="lg" className="font-bold px-10 h-12">
            <Link href="/contact?service=payroll">
              Get Started with Managed Payroll <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="font-bold px-8 h-12">
            <Link href="/coida-letter-of-good-standing">COIDA Letters of Good Standing</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
