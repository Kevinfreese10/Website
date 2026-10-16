import Link from 'next/link';
import { Calculator } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import CalculatorDisclaimer from '@/components/calculators/CalculatorDisclaimer';
import CalculatorClient from './CalculatorClient';

export default function SalaryTaxCalculatorPage() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://myacc.co.za/calculators/salary-tax#webapp',
        name: 'Salary Tax (PAYE) Calculator 2026/2027',
        url: 'https://myacc.co.za/calculators/salary-tax',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        description: 'Estimate your monthly SARS pay-as-you-earn (PAYE) deductions, age rebates, medical aid credits, and net take-home salary based on the 2026/2027 tax rates.',
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
          { '@type': 'ListItem', position: 3, name: 'Salary Tax (PAYE) Calculator', item: 'https://myacc.co.za/calculators/salary-tax' }
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
            Salary Tax (PAYE) Calculator 2026/2027
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Estimate your monthly SARS pay-as-you-earn (PAYE) deductions and net take-home salary based on the latest tax rates.
          </p>
        </div>
      </section>

      <CalculatorClient />

      {/* Explanatory notes */}
      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <h3 className="text-2xl font-bold text-slate-900">How SARS Personal Income Tax Calculations Work</h3>
        <Separator className="w-12 border-b-2 border-primary/20" />
        <p className="text-slate-600 text-sm leading-relaxed">
          South Africa utilizes a progressive tax system. This means that as your income increases, the percentage of tax you pay on each additional Rand also increases. The calculation begins by grouping your total annual salary into brackets, calculating the gross tax due, and then applying any rebates or medical aid tax credits for which you qualify.
        </p>
        <div className="pt-2 flex flex-wrap gap-3 text-xs font-semibold">
          <Link href="/individual-tax-returns" className="text-primary hover:underline">Individual Tax Returns (ITR12) →</Link>
          <Link href="/payroll-services" className="text-primary hover:underline">Payroll Services →</Link>
          <Link href="/calculators/total-cost-to-employer" className="text-primary hover:underline">Total Cost to Employer Calculator →</Link>
          <Link href="/calculators" className="text-primary hover:underline">All Calculators →</Link>
        </div>
        <CalculatorDisclaimer note="Take-home pay shown here does not deduct UIF, medical scheme contributions, retirement funding or any other payroll deduction." />
      </section>
    </div>
  );
}
