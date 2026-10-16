import { Metadata } from 'next';
import Link from 'next/link';
import { industries } from '@/lib/industries';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { SITE_URL } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';

export async function generateMetadata(): Promise<Metadata> {
  return getStaticPageMetadata('industries', {
    title: 'Industries We Serve | Specialist Sector Accountants South Africa',
    description:
      'Specialized South African accounting, tax & statutory compliance for construction (CIDB), medical practices, e-commerce, hospitality, SMEs, and freelancers.',
  });
}

export default function IndustriesHubPage() {
  const industryList = Object.values(industries);

  const hubSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${SITE_URL}/industries#webpage`,
        url: `${SITE_URL}/industries`,
        name: 'Industries We Serve | Specialist Sector Accountants South Africa',
        description:
          'Specialized South African accounting, tax & statutory compliance for construction (CIDB), medical practices, e-commerce, hospitality, SMEs, and freelancers.',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: industryList.map((ind, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: ind.title,
            url: `${SITE_URL}/industries/${ind.slug}`,
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: SITE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Industries',
            item: `${SITE_URL}/industries`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hubSchema) }}
      />

      <div className="space-y-16 pb-20 bg-background relative overflow-hidden">
        {/* HERO SECTION */}
        <section className="relative w-full overflow-hidden pt-16 lg:pt-24 pb-16 text-center bg-background">
          <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
          <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
          <div className="absolute inset-0 bg-dot-grid" />

          <div className="container relative z-10 mx-auto px-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest mb-4">
              <Briefcase className="h-4 w-4" /> Industry-Specialized Accounting
            </div>
            <h1 className="mb-6 text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
              Sector-Specific <span className="text-gradient">Accounting &amp; Tax Compliance</span> in South Africa
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Every industry in South Africa faces distinct statutory frameworks—from CIDB grading and JBCC retention accounting in construction to HPCSA &amp; medical aid reconciliations in healthcare. Explore our dedicated sector practices below.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
              <Button asChild size="lg" className="font-bold px-8 shadow-xl">
                <Link href="/contact">Book a Sector Consultation</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-bold px-8 border-primary">
                <Link href="/monthly-accounting">View Monthly Accounting Packages</Link>
              </Button>
            </div>
          </div>
        </section>

        <TrustIndexWidget />

        {/* INDUSTRIES GRID */}
        <section className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <h2 className="text-3xl font-black tracking-tight md:text-4xl text-foreground">
              Choose Your Industry Specialisation
            </h2>
            <p className="text-muted-foreground">
              Click any sector below to view the statutory regulations, tax allowances, bookkeeping workflows, and deliverables we manage for your industry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industryList.map((ind) => {
              const Icon = ind.icon;
              return (
                <Card
                  key={ind.slug}
                  className="glass-card border hover:border-primary/40 transition-all flex flex-col justify-between"
                >
                  <CardHeader className="space-y-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-bold text-foreground">
                      <Link href={`/industries/${ind.slug}`} className="hover:text-primary transition-colors">
                        {ind.title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {ind.description}
                      </p>
                      {ind.benefits && ind.benefits.length > 0 && (
                        <ul className="space-y-1.5 pt-2">
                          {ind.benefits.slice(0, 2).map((benefit) => (
                            <li key={benefit} className="flex items-start gap-2 text-xs text-foreground/90">
                              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="pt-4 border-t border-border/50">
                      <Link
                        href={`/industries/${ind.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                      >
                        Explore {ind.title.replace(/^Accounting for\s+/i, '')} <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* WHY INDUSTRY SPECIALISATION MATTERS */}
        <section className="container mx-auto px-4 max-w-5xl">
          <Card className="border-primary/20 bg-primary/5 p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                  <ShieldCheck className="h-4 w-4" /> CIBA &amp; SAIT Accredited Supervision
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-foreground">
                  Don&apos;t See Your Exact Sector Listed?
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We act as Accounting Officers and Registered Tax Practitioners for over 1,000 South African entities across logistics, manufacturing, property holding companies, NPOs, trusts, and agricultural enterprises. Contact us for a custom fixed-fee proposal tailored to your chart of accounts.
                </p>
              </div>
              <div className="md:col-span-4 flex flex-col gap-3">
                <Button asChild size="lg" className="font-bold shadow-lg w-full">
                  <Link href="/contact">Request a Custom Proposal</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="font-bold w-full">
                  <Link href="/calculators">Try Our Free Tax Calculators</Link>
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}
