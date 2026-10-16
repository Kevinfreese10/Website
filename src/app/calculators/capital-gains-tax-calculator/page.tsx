import Link from 'next/link';
import { Calculator, ArrowRight } from 'lucide-react';
import { SITE_URL } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import CapitalGainsTaxCalculatorClient from './CalculatorClient';

export default function CapitalGainsTaxCalculatorPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${SITE_URL}/calculators/capital-gains-tax-calculator#app`,
        name: 'Capital Gains Tax (CGT) Calculator South Africa',
        url: `${SITE_URL}/calculators/capital-gains-tax-calculator`,
        applicationCategory: 'FinanceApplication',
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
            name: 'Capital Gains Tax Calculator',
            item: `${SITE_URL}/calculators/capital-gains-tax-calculator`,
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
            Capital Gains Tax Calculator
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Estimate your CGT payable for individuals or companies.
          </p>
        </div>
      </section>

      <CapitalGainsTaxCalculatorClient />

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">
          How SARS Calculates Capital Gains Tax (Eighth Schedule)
        </h2>
        <Separator className="w-12 border-b-2 border-primary/20" />
        <p className="text-slate-600 text-sm leading-relaxed">
          Under the Eighth Schedule to the South African Income Tax Act 58 of 1962, Capital Gains Tax (CGT) is not a separate tax but forms part of income tax. Your capital gain is calculated as Proceeds minus Base Cost. Natural persons qualify for an annual exclusion (R40,000) and a R2 million primary residence exclusion, with 40% of the net capital gain included in taxable income and taxed at your marginal rate (effective maximum 18%). Companies and trusts have an 80% inclusion rate, resulting in an effective CGT rate of 21.6% for companies (80% × 27%) and 36% for trusts (80% × 45%).
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/calculators">
              All Calculators <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/individual-tax-returns">Individual Tax Returns (ITR12)</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/tax-planning">Strategic Tax Planning</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/blog/cgt-annual-exclusion-increase-2026">CGT Annual Exclusion Guide</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
