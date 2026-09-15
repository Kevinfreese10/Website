import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { ClipboardCheck, ArrowRight, ShieldCheck, FileText, Award, CalendarCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Business Compliance Services South Africa | My Accountant',
        description: 'Stay compliant with CIPC, SARS & BEE requirements. My Accountant offers annual returns, BEE certificates, CIPC fees & full regulatory compliance services in South Africa.',
    };
    return getStaticPageMetadata('compliance-services', defaults);
}

export default function ComplianceServicesPage() {
  const services = [
    {
      title: "Regulatory Compliance Management",
      description: "Staying compliant with SARS, CIPC, and other regulatory bodies is essential for every South African business. Our compliance management service monitors your deadlines, files returns on time, and ensures your business never falls behind on its statutory obligations.",
      icon: ShieldCheck,
      link: "/compliance",
    },
    {
      title: "Annual Returns Filing",
      description: "Every registered company must file annual returns with CIPC to maintain its active status. We handle your annual return submissions accurately and on time, preventing deregistration and keeping your business in good standing year after year.",
      icon: CalendarCheck,
      link: "/products/annual-returns",
    },
    {
      title: "BEE Certificate",
      description: "A valid BEE certificate is critical for tendering, supplier applications, and enterprise development in South Africa. We assess your B-BBEE level and issue compliant certificates that open doors to government and private-sector procurement opportunities.",
      icon: Award,
      link: "/products/bee-certificate",
    },
    {
      title: "CIPC Annual Fees",
      description: "Failing to pay your CIPC annual fees can result in your company being flagged for deregistration. We ensure your annual fees are paid promptly and your company records remain up to date with the Companies and Intellectual Property Commission.",
      icon: FileText,
      link: "/products/cipc-annual-fees",
    },
  ];

  const faqs = [
    {
      q: "What happens if your company is non-compliant in South Africa?",
      a: "Non-compliance with CIPC or SARS can have serious consequences. CIPC may deregister your company, meaning it legally ceases to exist, and you lose the ability to trade, access bank accounts, or enter contracts. SARS non-compliance can result in penalties, interest on outstanding taxes, and even criminal prosecution for persistent defaults. My Accountant helps you stay ahead of every deadline to avoid these risks.",
    },
    {
      q: "How do I check my CIPC compliance status?",
      a: "You can check your company's compliance status on the CIPC website by searching for your enterprise number. The status will show whether your annual returns are up to date and whether your company is in good standing or flagged for deregistration. If your status shows non-compliance, our team can quickly resolve outstanding filings and restore your company to good standing.",
    },
    {
      q: "What are the annual compliance requirements for South African businesses?",
      a: "South African companies must file CIPC annual returns, pay CIPC annual fees, submit SARS income tax returns (ITR14), file VAT returns if registered, submit EMP201 and EMP501 payroll returns if employing staff, and maintain a valid BEE certificate if required for tendering. Depending on your industry, additional registrations such as COIDA, UIF, and sector-specific licences may also apply. We manage the full compliance calendar for our clients.",
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
          <div className="h-16 w-16 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
            <ClipboardCheck className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Business Compliance Services South Africa
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Keep your business compliant with CIPC, SARS, and BEE requirements. We manage annual returns, regulatory filings, and compliance monitoring so you never miss a deadline.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Check Your Compliance Status</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold h-12">
              <Link href="/products">View All Services</Link>
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
          <h2 className="text-3xl font-bold text-foreground">Compliance Services We Offer</h2>
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
        <div className="bg-primary text-white p-8 lg:p-12 rounded-xl text-center space-y-6 shadow-xl">
          <h3 className="text-3xl font-bold">Don&apos;t Risk Non-Compliance</h3>
          <p className="text-white/80 max-w-xl mx-auto text-base">
            Penalties, deregistration, and trading bans are real consequences of falling behind on compliance. Let our team manage your CIPC, SARS, and BEE obligations so you can focus on growing your business.
          </p>
          <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
            <Link href="/contact">Get Compliant Now <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Business Compliance FAQs</h2>
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
