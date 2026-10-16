import Link from 'next/link';
import { Calculator } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import CalculatorDisclaimer from '@/components/calculators/CalculatorDisclaimer';
import CalculatorClient from './CalculatorClient';

export default function ProvisionalTaxEstimatorPage() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://myacc.co.za/calculators/provisional-tax-estimator#webapp',
        name: 'Provisional Tax Estimator (IRP6)',
        url: 'https://myacc.co.za/calculators/provisional-tax-estimator',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        description: 'Estimate your SARS IRP6 provisional tax payable (1st and 2nd period payments) based on your estimated annual taxable income.',
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
          { '@type': 'ListItem', position: 3, name: 'Provisional Tax Estimator', item: 'https://myacc.co.za/calculators/provisional-tax-estimator' }
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

      <section className="bg-slate-50 text-slate-900 py-16 border-b border-slate-200/50">
        <div className="container mx-auto px-4 text-center max-w-3xl space-y-4">
          <div className="h-14 w-14 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Calculator className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-hero-gradient pb-2">
            Provisional Tax Estimator
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Estimate your tax payable based on your estimated annual taxable income.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-5xl space-y-10">
        <CalculatorClient />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">How SARS IRP6 Provisional Tax Payments Work</h2>
        <Separator className="w-12 border-b-2 border-primary/20" />
        <p className="text-slate-600 text-sm leading-relaxed">
          Provisional taxpayers in South Africa submit two mandatory IRP6 returns per tax year: the first payment is due six months into the tax year (typically 31 August for individuals and February year-end companies), and the second payment is due at the end of the tax year (28 February). Accurate estimation prevents the 20% under-estimation penalty under Paragraph 20 of the Fourth Schedule to the Income Tax Act.
        </p>
        <div className="pt-2 flex flex-wrap gap-3 text-xs font-semibold">
          <Link href="/provisional-tax" className="text-primary hover:underline">Provisional Tax Services (IRP6) →</Link>
          <Link href="/individual-tax-returns" className="text-primary hover:underline">Individual Tax Returns (ITR12) →</Link>
          <Link href="/tax-planning" className="text-primary hover:underline">Strategic Tax Planning →</Link>
          <Link href="/calculators" className="text-primary hover:underline">All Calculators →</Link>
        </div>
        <CalculatorDisclaimer note="This estimates the annual liability. An actual IRP6 payment is calculated on the basic amount or an estimate of taxable income, less employees' tax and any prior payment for the year." />
      </section>
    </div>
  );
}
