import Link from 'next/link';
import { Calculator } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import CalculatorDisclaimer from '@/components/calculators/CalculatorDisclaimer';
import CalculatorClient from './CalculatorClient';

export default function VatCalculatorPage() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://myacc.co.za/calculators/vat-calculator#webapp',
        name: 'South African VAT Calculator (15%)',
        url: 'https://myacc.co.za/calculators/vat-calculator',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        description: 'Quickly add or remove 15% South African Value-Added Tax (VAT) from any ZAR amount, and review the updated 2026/2027 VAT registration thresholds.',
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
          { '@type': 'ListItem', position: 3, name: 'South African VAT Calculator', item: 'https://myacc.co.za/calculators/vat-calculator' }
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
            South African VAT Calculator
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Quickly add or remove 15% VAT from any amount.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-5xl space-y-10">
        <CalculatorClient />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">South African VAT Rate &amp; 2026/2027 Registration Thresholds</h2>
        <Separator className="w-12 border-b-2 border-primary/20" />
        <p className="text-slate-600 text-sm leading-relaxed">
          Value-Added Tax (VAT) in South Africa is levied at the standard rate of 15% on most goods and services supplied by VAT-registered vendors. Effective 1 April 2026, the compulsory SARS VAT registration threshold increased from R1 million to R2.3 million in taxable supplies over any consecutive 12-month period, while the voluntary VAT registration threshold increased from R50,000 to R120,000.
        </p>
        <div className="pt-2 flex flex-wrap gap-3 text-xs font-semibold">
          <Link href="/vat-registration-south-africa" className="text-primary hover:underline">VAT Registration South Africa (R1,500) →</Link>
          <Link href="/blog/vat-registration-threshold-sme-2026" className="text-primary hover:underline">2026 VAT Threshold Increase Guide →</Link>
          <Link href="/bookkeeping" className="text-primary hover:underline">Monthly Bookkeeping &amp; VAT201 Filing →</Link>
          <Link href="/calculators" className="text-primary hover:underline">All Calculators →</Link>
        </div>
        <CalculatorDisclaimer />
      </section>
    </div>
  );
}
