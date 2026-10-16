import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import {
  Calculator,
  HelpCircle
} from 'lucide-react';
import CalculatorDisclaimer from '@/components/calculators/CalculatorDisclaimer';
import CalculatorClient from './CalculatorClient';

export default function PayrollCostCalculatorPage() {
  const faqs = [
    {
      q: 'How does the payroll cost sliding scale work?',
      a: 'For up to 10 employees, you pay a flat rate of R6,400 per month. If you have between 11 and 50 employees, you pay R6,400 plus an additional R190 per month for each employee above 10. The total fee is capped at a maximum of R14,000 per month for 50 employees.'
    },
    {
      q: 'What is included in the monthly payroll service?',
      a: 'Our monthly payroll service includes digital payslip distribution, calculation and submission of monthly EMP201 returns (PAYE, UIF, SDL) to SARS, monthly electronic UIF declaration submissions (UI19) to the Department of Labour, bi-annual and annual EMP501 reconciliations, and generation of IRP5 tax certificates at year-end.'
    },
    {
      q: 'Are there any setup fees or hidden costs?',
      a: 'No, we do not charge setup fees to transition your payroll. All standard payroll calculations, document generation, and returns are covered under the single monthly fee calculated by this tool.'
    }
  ];

  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://myacc.co.za/calculators/payroll-cost#webapp',
        name: 'Payroll Cost Calculator',
        url: 'https://myacc.co.za/calculators/payroll-cost',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        description: 'Estimate your monthly outsourced payroll administration and SARS/Department of Labour compliance fees instantly.',
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
          { '@type': 'ListItem', position: 3, name: 'Payroll Cost Calculator', item: 'https://myacc.co.za/calculators/payroll-cost' }
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
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl font-headline text-hero-gradient pb-2">
            Payroll Cost Calculator
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Estimate your monthly outsourced payroll administration and SARS/Department of Labour compliance fees instantly.
          </p>
        </div>
      </section>

      <CalculatorClient />

      {/* FAQs Section */}
      <section className="container mx-auto px-4 max-w-3xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="w-full space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-border pb-6 last:border-0">
              <h3 className="text-lg font-bold text-foreground mb-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary shrink-0 animate-pulse" />
                  {faq.q}
                </div>
              </h3>
              <div className="text-slate-600 leading-relaxed">
                {faq.a}
              </div>
            </div>
          ))}
        </div>
        <div className="pt-2 flex flex-wrap gap-3 text-xs font-semibold">
          <Link href="/outsourced-payroll-fees-sa" className="text-primary hover:underline">Outsourced Payroll Fee Guide →</Link>
          <Link href="/payroll-services" className="text-primary hover:underline">Payroll Services →</Link>
          <Link href="/payroll-administration" className="text-primary hover:underline">Payroll Administration &amp; EMP501 →</Link>
          <Link href="/calculators" className="text-primary hover:underline">All Calculators →</Link>
        </div>
        <CalculatorDisclaimer note="Pricing shown is indicative. Confirm current fees before quoting a client." />
      </section>
    </div>
  );
}
