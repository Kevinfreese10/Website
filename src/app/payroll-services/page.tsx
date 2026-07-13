import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { Users, ArrowRight, FileSpreadsheet, ClipboardCheck, BadgeCheck, ShieldCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Payroll Services & Outsourcing South Africa | My Accountant',
        description: 'Affordable payroll outsourcing in South Africa. EMP201, EMP501, PAYE & UIF compliance handled by experts. Accurate payslips, on-time submissions & full SARS compliance.',
    };
    return getStaticPageMetadata('payroll-services', defaults);
}

export default function PayrollServicesPage() {
  const services = [
    {
      title: "EMP201 Monthly Submissions",
      description: "We prepare and submit your EMP201 monthly employer declarations to SARS, ensuring PAYE, UIF, and SDL amounts are accurately calculated and reconciled with your payroll records before every deadline.",
      icon: FileSpreadsheet,
      link: "/products/emp201-submission-for-trading-companies",
    },
    {
      title: "EMP501 Annual Reconciliation",
      description: "Our team handles your annual employer reconciliation (EMP501) submission, matching all monthly EMP201 payments against employee IRP5 and IT3(a) certificates for seamless year-end compliance with SARS.",
      icon: ClipboardCheck,
      link: "/products/emp501-annual-reconciliation-for-trading-companies",
    },
    {
      title: "PAYE Registration",
      description: "Starting to employ staff? We register your business for Pay-As-You-Earn (PAYE) with SARS, set up your employer account, and ensure you're ready to process payroll and submit returns from day one.",
      icon: BadgeCheck,
      link: "/products/paye-registration",
    },
    {
      title: "UIF Registration",
      description: "All employers in South Africa must register with the Unemployment Insurance Fund. We handle your UIF registration, ensure correct contribution calculations, and manage ongoing compliance with the Department of Employment and Labour.",
      icon: ShieldCheck,
      link: "/products/uif-registration",
    },
  ];

  const faqs = [
    {
      q: "How much does payroll outsourcing cost in South Africa?",
      a: "Payroll outsourcing costs in South Africa vary depending on the number of employees, pay frequency, and complexity of your payroll. For small businesses with fewer than 10 employees, monthly fees typically start from around R1,000 to R3,000. Larger organisations with complex structures, multiple pay dates, or commission-based compensation can expect higher fees. Outsourcing is often more cost-effective than hiring a dedicated payroll administrator, especially when you factor in the cost of payroll software, training, and SARS compliance expertise.",
    },
    {
      q: "What is an EMP201 and when must it be submitted?",
      a: "The EMP201 is a Monthly Employer Declaration that every registered employer must submit to SARS. It declares the total PAYE (employees' tax), UIF (Unemployment Insurance Fund), and SDL (Skills Development Levy) contributions for the month. The EMP201 must be submitted and payment made by the 7th of the following month. For example, the June EMP201 is due by 7 July. Late submissions attract penalties of 10% of the outstanding amount plus interest.",
    },
    {
      q: "What are the benefits of outsourcing payroll?",
      a: "Outsourcing payroll eliminates the risk of costly compliance errors with SARS, the Department of Employment and Labour, and the UIF. Benefits include accurate payslip generation, on-time EMP201 and EMP501 submissions, correct leave and overtime calculations, and automatic updates when tax tables or legislation change. It also frees up your internal team to focus on core business activities. Professional payroll providers carry indemnity insurance, adding an extra layer of protection for your business.",
    },
  ];

  return (
    <div className="space-y-16 pb-24 bg-background relative overflow-hidden">
      {/* Hero Section */}
      <section className="text-foreground py-20 lg:py-32 bg-background relative overflow-hidden">
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-blue w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container mx-auto px-4 text-center max-w-4xl space-y-6 relative z-10">
          <div className="h-16 w-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Payroll Services &amp; Outsourcing South Africa
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Accurate payslips, on-time SARS submissions, and full PAYE compliance — all handled by dedicated payroll professionals so you can focus on growing your business.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Outsource Your Payroll</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold h-12">
              <Link href="/products">View Payroll Products</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <TrustIndexWidget />
      </div>

      {/* Services Grid */}
      <section className="container mx-auto px-4 max-w-5xl space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Payroll & Employer Compliance Services</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, i) => (
            <Card key={i} className="border shadow-sm border-border bg-card flex flex-col justify-between">
              <CardHeader className="space-y-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600 text-sm leading-relaxed space-y-4">
                <p>{service.description}</p>
                <Button asChild variant="link" className="px-0 text-primary">
                  <Link href={service.link}>Learn more <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Box */}
      <section className="container mx-auto px-4 max-w-4xl">
        <div className="bg-primary text-white p-8 lg:p-12 rounded-3xl text-center space-y-6 shadow-xl">
          <h3 className="text-3xl font-bold">Let Us Handle Your Payroll</h3>
          <p className="text-white/80 max-w-xl mx-auto text-base">
            From payslip generation to SARS submissions, our payroll team ensures every employee is paid correctly and every return is filed on time. Get a free payroll quote today.
          </p>
          <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
            <Link href="/contact">Outsource Your Payroll <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Payroll Services FAQs</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="w-full space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-border pb-6 last:border-0">
              <h3 className="text-lg font-bold text-foreground mb-2">
                {faq.q}
              </h3>
              <div className="text-slate-600 leading-relaxed">
                {faq.a}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
