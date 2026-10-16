import Link from 'next/link';
import { Calculator, ArrowRight } from 'lucide-react';
import { SITE_URL } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import BeeScorecardCalculatorClient from './CalculatorClient';

export default function BeeScorecardEstimatorPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${SITE_URL}/calculators/bee-scorecard-estimator#app`,
        name: 'B-BBEE Scorecard & Recognition Level Estimator South Africa',
        url: `${SITE_URL}/calculators/bee-scorecard-estimator`,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'All',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'ZAR',
        },
        provider: { '@id': `${SITE_URL}/#organization` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Calculators', item: `${SITE_URL}/calculators` },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'B-BBEE Scorecard Estimator',
            item: `${SITE_URL}/calculators/bee-scorecard-estimator`,
          },
        ],
      },
    ],
  };

  return (
    <div className="space-y-16 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <section className="bg-slate-50 text-slate-900 py-16 border-b border-slate-200/50">
        <div className="container mx-auto px-4 text-center max-w-3xl space-y-4">
          <div className="h-14 w-14 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Calculator className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-hero-gradient pb-2">
            BEE Scorecard Estimator
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Estimate your B-BBEE recognition level using the generic scorecard elements.
          </p>
        </div>
      </section>

      <BeeScorecardCalculatorClient />

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">
          How B-BBEE EME, QSE &amp; Generic Scorecards Work in South Africa
        </h2>
        <Separator className="w-12 border-b-2 border-primary/20" />
        <p className="text-slate-600 text-sm leading-relaxed">
          Under the Amended B-BBEE Codes of Good Practice, Exempted Micro Enterprises (EMEs) with annual turnover under R10 million qualify for an automatic B-BBEE sworn affidavit (Level 1 at 100% black ownership, Level 2 at 51%+ black ownership, or Level 4 otherwise). Qualifying Small Enterprises (QSEs) with turnover between R10 million and R50 million with 51%+ black ownership also qualify for an affidavit, while other QSEs and Generic enterprises (turnover above R50 million) are measured across Ownership (25 points), Management Control (19 points), Skills Development (20 points), Enterprise &amp; Supplier Development (42 points), and Socio-Economic Development (5 points).
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/calculators">
              All Calculators <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/annual-financial-statements">Annual Financial Statements</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/company-secretarial-services-south-africa">Company Secretarial Services</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
