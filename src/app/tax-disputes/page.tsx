import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { Gavel, ArrowRight, Shield, Handshake, ReceiptText, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'SARS Tax Disputes, Objections & Appeals | My Accountant',
        description: 'Expert help with SARS tax disputes, audit defence, objections, appeals, and penalty remissions. Protect your rights and resolve SARS issues with professional support.',
    };
    return getStaticPageMetadata('tax-disputes', defaults);
}

export default function TaxDisputesPage() {
  const services = [
    {
      title: "SARS Dispute Resolution",
      description: "When you disagree with a SARS assessment, you have the right to object. We manage the full dispute resolution process — from drafting formal objections under Rule 7 to representing you at the Tax Board or Tax Court if necessary.",
      icon: Shield,
      link: "/sars-disputes",
    },
    {
      title: "SARS Compromise Applications",
      description: "If you're unable to pay your full tax debt, SARS may accept a compromise under Section 200 of the Tax Administration Act. We assess your eligibility, prepare a compelling application, and negotiate with SARS on your behalf to reach a workable settlement.",
      icon: Handshake,
      link: "/sars-compromise",
    },
    {
      title: "Remission of Fines & Penalties",
      description: "SARS-imposed penalties and interest can quickly escalate your tax debt. We apply for remission under Section 217 where exceptional circumstances exist, presenting your case professionally to achieve the best possible outcome.",
      icon: ReceiptText,
      link: "/remission-of-fines",
    },
    {
      title: "Interest & Penalty Relief",
      description: "Beyond administrative penalties, SARS charges interest on late payments and underestimated provisional tax. We lodge formal applications to have interest and penalties reduced or waived, backed by supporting documentation and legal grounds.",
      icon: AlertTriangle,
      link: "/products/remission-of-sars-interest-and-penalties",
    },
  ];

  const faqs = [
    {
      q: "How long does a SARS tax dispute take to resolve?",
      a: "The timeline depends on the complexity of the dispute and the stage it reaches. A formal objection must be filed within 30 business days of the assessment, and SARS typically has 60 business days to respond (though extensions are common). If the objection is disallowed, you have 30 business days to file an appeal. Cases referred to the Tax Board are usually heard within a few months, while Tax Court proceedings can take a year or more. Alternative Dispute Resolution (ADR), available at the appeal stage, often resolves matters faster — typically within 45 to 90 days. We work to achieve the quickest possible resolution at every stage.",
    },
    {
      q: "What happens if I ignore a SARS audit or verification request?",
      a: "Ignoring SARS is never advisable. If you fail to respond to a verification request or audit notification, SARS can issue an estimated or additional assessment based on the information available to them — which is almost always unfavourable. They can also impose administrative penalties for non-compliance, register a judgment against you for outstanding tax debt, issue a third-party appointment (garnishee order) against your bank account or employer, and in extreme cases, pursue criminal prosecution. If you've received an audit letter and don't know how to respond, contact us immediately — early intervention produces significantly better outcomes.",
    },
    {
      q: "Can SARS penalties and interest be reduced or waived?",
      a: "Yes, in many cases. SARS has the discretion to remit administrative non-compliance penalties if you can demonstrate a reasonable, first-time offence or exceptional circumstances that prevented compliance. Understatement penalties (ranging from 10% to 200% of the shortfall) can be challenged through the objection and appeal process if you can show reasonable care was taken. Interest charges can be partially remitted if SARS caused unreasonable delays. We evaluate your specific situation, identify the strongest grounds for relief, and prepare a professional application to maximise your chances of a successful outcome.",
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
            <Gavel className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            SARS Tax Disputes, Objections & Appeals
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Facing a SARS audit, unfair assessment, or mounting penalties? Our dispute resolution specialists protect your rights and fight for the best possible outcome — from objection to appeal.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Get SARS Dispute Help</Link>
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
          <h2 className="text-3xl font-bold text-foreground">SARS Dispute & Resolution Services</h2>
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
          <h3 className="text-3xl font-bold">Don&apos;t Face SARS Alone</h3>
          <p className="text-white/80 max-w-xl mx-auto text-base">
            Tax disputes are stressful and the stakes are high. Our experienced team has successfully resolved hundreds of SARS disputes — from audit defence to Tax Court appeals. Let us fight your corner.
          </p>
          <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
            <Link href="/contact">Get SARS Dispute Help <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">SARS Dispute FAQs</h2>
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
