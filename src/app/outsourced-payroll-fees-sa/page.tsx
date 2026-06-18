import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { 
  CheckCircle2, 
  HelpCircle,
  Coins,
  Check,
  ArrowRight,
  TrendingUp,
  Users
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Outsourced Payroll Fees South Africa | Cost & Packages | My Accountant',
        description: 'Compare outsourced payroll fees in South Africa. Transparent per-employee pricing covering payslips, SARS EMP201 submissions, COIDA, and UIF filing.',
    };
    return getStaticPageMetadata('outsourced-payroll-fees-sa', defaults);
}

export default function OutsourcedPayrollFeesSaPage() {
  const tiers = [
    {
      range: "1 - 5 Employees",
      price: "R150",
      description: "Ideal for small startups and professional micro-enterprises.",
      features: [
        "Monthly PDF Payslips",
        "SARS EMP201 Calculation & Filing",
        "UIF Declaration (UI19) Submission",
        "EMP501 Mid-Year & Annual Reconciliations",
        "IRP5 Certificates at tax year-end"
      ]
    },
    {
      range: "6 - 20 Employees",
      price: "R95",
      description: "Designed for growing retail, construction, and office teams.",
      features: [
        "All features from the Micro Tier",
        "Direct Bank EFT Payment File export",
        "Employee leave tracking dashboard",
        "UIF & PAYE compliance reporting",
        "Dedicated Payroll Administrator support"
      ]
    },
    {
      range: "21+ Employees",
      price: "R75",
      description: "Custom enterprise solutions for high-volume staffing and shifts.",
      features: [
        "All features from the Growth Tier",
        "Shift and overtime calculations",
        "Direct COIDA (Workmen's Compensation) filing",
        "Bulk bank upload file generation",
        "Custom HR and payroll reports"
      ]
    }
  ];

  const benefits = [
    "100% compliant with SARS PAYE tax brackets and rules",
    "No expensive payroll software licenses required",
    "Filing of monthly UIF declarations (Department of Labour)",
    "Hassle-free preparation of biannual EMP501 reconciliations",
    "Official IRP5 tax certificates generated automatically"
  ];

  const faqs = [
    {
      q: "What is included in outsourced payroll fees?",
      a: "Our outsourced payroll fees are comprehensive. They include payslip generation, monthly EMP201 submissions (PAYE, UIF, SDL), monthly UIF declarations to the Department of Labour, annual and bi-annual EMP501 reconciliations, and year-end IRP5 certificates. There are no hidden or additional fees."
    },
    {
      q: "Is there a setup fee to transition payroll to your team?",
      a: "No, we do not charge setup fees for standard active payrolls. We will set up your employees, load history from your previous system, and configure your company's SARS payroll details for free when you sign up."
    },
    {
      q: "Can you assist with COIDA Return of Earnings submissions?",
      a: "Yes. In addition to payroll processing, we offer assistance with yearly COIDA Return of Earnings filing and Letter of Good Standing renewals."
    }
  ];

  return (
    <div className="space-y-16 pb-24">
      {/* Hero Section */}
      <section className="bg-slate-50 text-slate-900 py-20 lg:py-32 border-b border-slate-200/50">
        <div className="container mx-auto px-4 text-center max-w-4xl space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-slate-900">
            Outsourced Payroll Fees & Pricing in South Africa
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Transparent per-employee payroll packages. Outsource your payslips, SARS EMP201 filing, and Department of Labour UIF compliance to registered professionals.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Get a Payroll Quote</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold h-12">
              <Link href="#pricing-tiers">View Pricing Tiers</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Widget */}
      <div className="container mx-auto px-4">
        <TrustIndexWidget />
      </div>

      {/* Pricing Tiers Grid */}
      <section id="pricing-tiers" className="container mx-auto px-4 max-w-6xl space-y-12 scroll-m-24">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-slate-900">Transparent Monthly Payroll Pricing</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier, i) => (
            <Card key={i} className={`border border-border bg-card shadow-sm flex flex-col justify-between overflow-hidden ${i === 1 ? 'border-2 border-primary/30 relative' : ''}`}>
              {i === 1 && (
                <div className="absolute top-0 right-0 bg-primary text-white text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-bl-lg">
                  Popular Choice
                </div>
              )}
              <div className="p-6 space-y-4">
                <CardHeader className="p-0 space-y-2">
                  <span className="text-sm font-bold text-primary">{tier.range}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-slate-900">{tier.price}</span>
                    <span className="text-xs text-slate-500">per employee / month</span>
                  </div>
                </CardHeader>
                <p className="text-slate-600 text-xs leading-relaxed">{tier.description}</p>
                <Separator />
                <ul className="space-y-3 pt-2">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-700">
                      <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-6 pt-0">
                <Button asChild className="w-full font-bold h-10" variant={i === 1 ? 'default' : 'outline'}>
                  <Link href="/contact">Select Plan <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Highlights */}
      <section className="bg-slate-50 py-16 border-y">
        <div className="container mx-auto px-4 max-w-4xl space-y-8">
          <h2 className="text-3xl font-bold text-slate-900 text-center">Compliant and Efficient Outsourced Payroll</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                <span className="text-sm font-medium text-slate-700">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call To Action */}
      <section className="container mx-auto px-4 max-w-4xl">
        <div className="bg-slate-900 text-white p-8 lg:p-12 rounded-3xl text-center space-y-6 shadow-xl">
          <h3 className="text-3xl font-bold">Simplify Your Company Payroll</h3>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Save time and money by outsourcing your monthly and weekly payroll calculations. We manage PAYE submissions, Department of Labour declarations, and UIF updates.
          </p>
          <Button asChild size="lg" className="font-bold h-12">
            <Link href="/contact">Request Payroll Quote <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border">
              <AccordionTrigger className="text-left font-bold text-slate-900 py-4 hover:underline">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary shrink-0" />
                  {faq.q}
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-slate-600 leading-relaxed pl-7">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
