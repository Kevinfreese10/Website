import Link from 'next/link';
import { Calculator } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import CalculatorDisclaimer from '@/components/calculators/CalculatorDisclaimer';
import CalculatorClient from './CalculatorClient';

export default function NcrRegistrationFeeCalculatorPage() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://myacc.co.za/calculators/ncr-registration-fee#webapp',
        name: 'NCR Registration Fee Calculator',
        url: 'https://myacc.co.za/calculators/ncr-registration-fee',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        description: 'Estimate your National Credit Regulator (NCR) initial registration, branch, and application fees in South Africa.',
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
          { '@type': 'ListItem', position: 3, name: 'NCR Registration Fee Calculator', item: 'https://myacc.co.za/calculators/ncr-registration-fee' }
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
            NCR Registration Fee Calculator
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Estimate your National Credit Regulator (NCR) initial registration, branch, and application fees in South Africa.
          </p>
        </div>
      </section>

      <CalculatorClient />

      {/* Info details */}
      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <h3 className="text-2xl font-bold text-slate-900">Understanding NCR Registration Steps</h3>
        <Separator className="w-12 border-b-2 border-primary/20" />
        <p className="text-slate-600 text-sm leading-relaxed">
          Becoming a registered credit provider involves submitting an application, payment of fees, and supplying various required supporting documents (including CIPC records, tax clearance, and police clearance for directors). Once approved, you are issued an NCR registration certificate and number, which must be displayed on all loan agreements and premises.
        </p>
        <div className="pt-2 flex flex-wrap gap-3 text-xs font-semibold">
          <Link href="/products/ncr-registration" className="text-primary hover:underline">NCR Registration Service (R1,400 + NCR Fees) →</Link>
          <Link href="/company-registration" className="text-primary hover:underline">Company Registration →</Link>
          <Link href="/calculators" className="text-primary hover:underline">All Calculators →</Link>
        </div>
        <CalculatorDisclaimer />
      </section>
    </div>
  );
}
