import Link from 'next/link';
import { Calculator } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import CalculatorDisclaimer from '@/components/calculators/CalculatorDisclaimer';
import CalculatorClient from './CalculatorClient';

export default function TotalCostToEmployerCalculatorPage() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://myacc.co.za/calculators/total-cost-to-employer#webapp',
        name: 'Total Cost to Employer (TCOE) Calculator',
        url: 'https://myacc.co.za/calculators/total-cost-to-employer',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        description: 'Calculate your company\'s full payroll overhead in South Africa, including employer UIF, SDL, and COIDA estimations on top of gross salary.',
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
          { '@type': 'ListItem', position: 3, name: 'Total Cost to Employer Calculator', item: 'https://myacc.co.za/calculators/total-cost-to-employer' }
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
            Total Cost to Employer (TCOE) Calculator
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Calculate your company&apos;s full payroll overhead, including employer UIF, SDL, and COIDA estimations on top of gross salary.
          </p>
        </div>
      </section>

      <CalculatorClient />

      {/* Explanatory notes */}
      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <h3 className="text-2xl font-bold text-slate-900">Why Calculating TCOE is Critical for South African Businesses</h3>
        <Separator className="w-12 border-b-2 border-primary/20" />
        <p className="text-slate-600 text-sm leading-relaxed">
          Many small business owners assume that the gross salary on an employment contract is their only labor cost. However, in South Africa, employers are statutorily required to contribute to the Unemployment Insurance Fund (UIF), the Skills Development Levy (SDL - for companies with an annual payroll above R500,000), and yearly COIDA insurance premiums. Accurately modeling these overheads is essential for hiring planning and cash flow health.
        </p>
        <div className="pt-2 flex flex-wrap gap-3 text-xs font-semibold">
          <Link href="/payroll-services" className="text-primary hover:underline">Payroll Services →</Link>
          <Link href="/outsourced-payroll-fees-sa" className="text-primary hover:underline">Outsourced Payroll Fee Guide →</Link>
          <Link href="/calculators/uif-coida-calculator" className="text-primary hover:underline">UIF &amp; COIDA Calculator →</Link>
          <Link href="/calculators" className="text-primary hover:underline">All Calculators →</Link>
        </div>
        <CalculatorDisclaimer note="The Skills Development Levy is estimated per employee. The R500 000 exemption applies to your TOTAL annual payroll, not to an individual salary, and the Employment Tax Incentive is not applied here." />
      </section>
    </div>
  );
}
