import Link from 'next/link';
import { Calculator } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import CalculatorDisclaimer from '@/components/calculators/CalculatorDisclaimer';
import CalculatorClient from './CalculatorClient';

export default function SbcTaxEstimatorPage() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://myacc.co.za/calculators/sbc-tax-estimator#webapp',
        name: 'Small Business Corporation (SBC) Tax Savings Estimator',
        url: 'https://myacc.co.za/calculators/sbc-tax-estimator',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        description: 'Estimate your corporate tax savings under Section 12E of the Income Tax Act by qualifying as a SARS Small Business Corporation (SBC) vs standard 27% CIT.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'ZAR'
        },
        provider: {
          '@id': 'https://myacc.co.za/#organization'
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://myacc.co.za' },
          { '@type': 'ListItem', position: 2, name: 'Calculators', item: 'https://myacc.co.za/calculators' },
          { '@type': 'ListItem', position: 3, name: 'SBC Tax Estimator', item: 'https://myacc.co.za/calculators/sbc-tax-estimator' }
        ]
      }
    ]
  };

  return (
    <div className="space-y-16 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Hero Header */}
      <section className="bg-slate-50 text-slate-900 py-16 border-b border-slate-200/50">
        <div className="container mx-auto px-4 text-center max-w-3xl space-y-4">
          <div className="h-14 w-14 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Calculator className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-hero-gradient pb-2">
            Small Business Corporation (SBC) Tax Savings Estimator
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Estimate your corporate tax savings by qualifying as a SARS Small Business Corporation (SBC).
          </p>
        </div>
      </section>

      <CalculatorClient />

      {/* Info details */}
      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <h3 className="text-2xl font-bold text-slate-900">Why the SBC Tax Structure is Critical for South African Startups</h3>
        <Separator className="w-12 border-b-2 border-primary/20" />
        <p className="text-slate-600 text-sm leading-relaxed">
          Standard corporate income tax in South Africa is calculated at a flat 27% rate, meaning you pay R27,000 for every R100,000 in taxable profit. Qualifying as an SBC allows your business to pay 0% tax on the first R99,000 of profit, and only 7% on profit up to R365,000. This structure is a powerful incentive designed by SARS to support early-stage growth and job creation.
        </p>
        <div className="pt-2 flex flex-wrap gap-3 text-xs font-semibold">
          <Link href="/tax-planning" className="text-primary hover:underline">Strategic Tax Planning →</Link>
          <Link href="/blog/turnover-tax-vs-company-tax" className="text-primary hover:underline">Turnover Tax vs SBC vs 27% CIT Guide →</Link>
          <Link href="/company-registration" className="text-primary hover:underline">Company Registration →</Link>
          <Link href="/calculators" className="text-primary hover:underline">All Calculators →</Link>
        </div>
        <CalculatorDisclaimer note="Small Business Corporation relief has strict qualifying criteria (shareholding, turnover and the nature of income). Meeting the turnover test alone does not qualify an entity." />
      </section>
    </div>
  );
}
