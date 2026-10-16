import { IndustryData } from '@/lib/industries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, ShieldCheck, Scale, FileText, ArrowRight, HelpCircle, AlertTriangle, Briefcase } from 'lucide-react';
import Link from 'next/link';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { generateServicePillarSchema } from '@/lib/schema/productSchema';

interface IndustryPageLayoutProps {
  industry: IndustryData;
}

export default function IndustryPageLayout({ industry }: IndustryPageLayoutProps) {
  const Icon = industry.icon;

  const industrySchema = generateServicePillarSchema({
    title: industry.title,
    description: industry.description,
    slug: `/industries/${industry.slug}`,
    serviceType: 'AccountingService',
    priceRange: 'From R1,850/month',
    breadcrumbs: [
      { name: 'Home', url: '/' },
      { name: 'Industries', url: '/industries' },
      { name: industry.title, url: `/industries/${industry.slug}` },
    ],
    faqs: industry.faqs
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(industrySchema) }}
      />
      <div className="space-y-16 pb-16 bg-background relative overflow-hidden">
        {/* HERO SECTION */}
        <section className="relative w-full overflow-hidden pt-16 lg:pt-24 pb-20 text-center bg-background">
          <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
          <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
          <div className="aurora-blob aurora-blue w-[300px] h-[300px] bottom-0 left-1/3 animate-aurora-drift" style={{ animationDelay: '-10s' }} />
          <div className="absolute inset-0 bg-dot-grid" />

          <div className="container relative z-10 mx-auto px-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest mb-4">
              <Briefcase className="h-4 w-4" /> Sector Specialisation
            </div>
            <h1 className="mb-6 text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-center text-hero-gradient pb-2 max-w-4xl mx-auto">
              <span className="text-gradient">{industry.heroTitle}</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-medium text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              {industry.heroSubtitle}
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center pt-8">
              <Button asChild size="lg" className="font-bold px-10 shadow-xl">
                <Link href="/contact">Book an Industry Consultation</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-bold px-8">
                <Link href="#deliverables">Explore Deliverables</Link>
              </Button>
            </div>
          </div>
        </section>

        <TrustIndexWidget />

        {/* SECTION 1: OVERVIEW & SECTOR NARRATIVE */}
        <section className="container mx-auto px-4 max-w-5xl">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground">
              Tailored Financial Management for {industry.title.replace('Accounting for ', '')}
            </h2>
            <div className="text-base text-muted-foreground leading-relaxed whitespace-pre-line space-y-4">
              {industry.overviewContent}
            </div>
          </div>
        </section>

        {/* SECTION 2: STATUTORY & REGULATORY FRAMEWORK */}
        {industry.statutoryFramework && industry.statutoryFramework.length > 0 && (
          <section className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground">
                Statutory & Regulatory Compliance Framework
              </h2>
              <p className="text-muted-foreground mt-3 max-w-3xl mx-auto text-base leading-relaxed">
                Navigating South Africa's industry-specific legislation requires specialised accounting standards and continuous regulatory vigilance.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {industry.statutoryFramework.map((item, index) => (
                <Card key={index} className="glass-card border-primary/20 shadow-sm h-full">
                  <CardHeader>
                    <div className="inline-block px-3 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold mb-2">
                      {item.act}
                    </div>
                    <CardTitle className="text-lg font-bold text-foreground">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 3: COMMERCIAL CHALLENGES & RISK MITIGATION */}
        {industry.challengesContent && (
          <section className="container mx-auto px-4 max-w-5xl">
            <div className="p-8 md:p-10 rounded-2xl border border-destructive/20 bg-destructive/5 dark:bg-destructive/10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Industry Challenges & Financial Pitfalls
                </h2>
              </div>
              <div className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                {industry.challengesContent}
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: SPECIALIZED DELIVERABLES */}
        {industry.deliverables && industry.deliverables.length > 0 && (
          <section id="deliverables" className="container mx-auto px-4 max-w-5xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground">
                Our Specialized Sector Deliverables
              </h2>
              <p className="text-muted-foreground mt-3 max-w-2xl mx-auto text-base">
                Purpose-built accounting, tax, and reporting instruments tailored to the exact requirements of your industry.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {industry.deliverables.map((item, index) => (
                <Card key={index} className="glass-card shadow-sm h-full hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg font-bold">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 5: BENEFITS & NICHE SERVICES */}
        <section className="container mx-auto px-4 max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-2 border-primary/10 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground">Core Industry Benefits</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {industry.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/10 shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-foreground">Niche Advisory Capabilities</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  {industry.specialServices.map((service, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{service}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* SECTION 6: STRUCTURED FAQS ACCORDION */}
        {industry.faqs && industry.faqs.length > 0 && (
          <section className="container mx-auto px-4 max-w-4xl py-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
                <HelpCircle className="h-8 w-8 text-primary" /> Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground mt-2">
                Expert answers to common tax, accounting, and compliance queries in the {industry.title.replace('Accounting for ', '')} sector.
              </p>
            </div>
            <Accordion type="single" collapsible className="w-full space-y-4">
              {industry.faqs.map((faq, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`} className="border rounded-xl px-5 py-2 bg-card shadow-sm">
                  <AccordionTrigger className="text-left font-bold text-base md:text-lg hover:no-underline text-foreground">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed text-sm md:text-base pt-2">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}

        {/* SECTION 7: CLOSING CONVERSION BANNER */}
        <section className="container mx-auto px-4 text-center py-12">
          <div className="max-w-3xl mx-auto p-12 rounded-2xl glass-card border shadow-lg space-y-6">
            <h2 className="text-3xl font-black text-foreground">
              Ready to Accelerate Your {industry.title.replace('Accounting for ', '')} Business?
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Our accredited accounting team understands the operational realities and statutory demands of your sector. Schedule a consultation today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Button asChild size="lg" className="font-bold px-10 shadow-xl">
                <Link href="/contact">Book a Consultation</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-bold px-8">
                <Link href="/products">Browse All Services</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
