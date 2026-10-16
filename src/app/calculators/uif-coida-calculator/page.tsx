import Link from 'next/link';
import { Calculator } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import CalculatorDisclaimer from '@/components/calculators/CalculatorDisclaimer';
import CalculatorClient from './CalculatorClient';

export default function UifCoidaCalculatorPage() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://myacc.co.za/calculators/uif-coida-calculator#webapp',
        name: 'UIF & COIDA Calculator',
        url: 'https://myacc.co.za/calculators/uif-coida-calculator',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        description: 'Calculate monthly UIF employee/employer contributions (capped at R177.12 each) and estimate annual COIDA Workmen\'s Compensation levies based on gross salary.',
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
          { '@type': 'ListItem', position: 3, name: 'UIF & COIDA Calculator', item: 'https://myacc.co.za/calculators/uif-coida-calculator' }
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
            UIF &amp; COIDA Calculator
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Calculate monthly UIF contributions and estimate COIDA levies based on gross salary.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-5xl space-y-10">
        <CalculatorClient />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">How UIF and COIDA Contributions Work in South Africa</h2>
        <Separator className="w-12 border-b-2 border-primary/20" />
        <p className="text-slate-600 text-sm leading-relaxed">
          Every South African employer must deduct 1% from an employee&apos;s monthly gross remuneration and contribute a matching 1% for the Unemployment Insurance Fund (UIF), subject to the monthly remuneration ceiling of R17,712 (maximum R177.12 each, or R354.24 combined per month). Employers must also register with the Compensation Fund (COIDA) and submit an annual Return of Earnings (ROE) to obtain a Letter of Good Standing.
        </p>
        <div className="pt-2 flex flex-wrap gap-3 text-xs font-semibold">
          <Link href="/products/coid-workmens-compensation-registration" className="text-primary hover:underline">COIDA Registration (R1,200) →</Link>
          <Link href="/products/letter-of-good-standing" className="text-primary hover:underline">Letter of Good Standing Renewal →</Link>
          <Link href="/products/uif-registration-labour" className="text-primary hover:underline">UIF uFiling Registration →</Link>
          <Link href="/calculators" className="text-primary hover:underline">All Calculators →</Link>
        </div>
        <CalculatorDisclaimer note="COIDA is estimated without applying the annual earnings ceiling, and assessment tariffs vary by industry classification. Treat the COIDA figure as indicative only." />
      </section>
    </div>
  );
}
