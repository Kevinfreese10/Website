import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Calculator,
  HelpCircle
} from 'lucide-react';
import CalculatorDisclaimer from '@/components/calculators/CalculatorDisclaimer';
import CalculatorClient from './CalculatorClient';

export default function TurnoverTaxCalculatorPage() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://myacc.co.za/calculators/turnover-tax-calculator#webapp',
        name: 'SARS Turnover Tax Calculator (2026/2027)',
        url: 'https://myacc.co.za/calculators/turnover-tax-calculator',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        description: 'Calculate your estimated SARS Turnover Tax payable for South African micro-businesses with annual gross revenue up to R2.3 million (effective 1 April 2026).',
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
          { '@type': 'ListItem', position: 3, name: 'Turnover Tax Calculator', item: 'https://myacc.co.za/calculators/turnover-tax-calculator' }
        ]
      }
    ]
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <Calculator className="w-3.5 h-3.5" />
            Micro-Business Tax Tool 2026/2027
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            SARS Turnover Tax Calculator (2026/2027)
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto text-sm sm:text-base">
            Calculate your estimated SARS Turnover Tax payable for micro-businesses with annual gross revenue up to R2.3 million (effective 1 April 2026).
          </p>
        </div>

        <CalculatorClient />

        {/* Additional Info Section */}
        <Card className="border border-slate-200/80 shadow-sm bg-white rounded-xl">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              Turnover Tax Brackets Summary (Effective 1 April 2026)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-xs text-slate-600 space-y-4">
            <p>
              The table below outlines the progressive Turnover Tax rates applicable to qualifying South African sole proprietors, partnerships, close corporations, and companies:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-200">
                    <th className="p-2.5">Turnover Bracket</th>
                    <th className="p-2.5">Rate of Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-2.5 font-medium">R0 – R600,000</td>
                    <td className="p-2.5 text-emerald-700 font-bold">0% (Tax Free)</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">R600,001 – R950,000</td>
                    <td className="p-2.5">1% of amount above R600,000</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">R950,001 – R1,400,000</td>
                    <td className="p-2.5">R3,500 + 2% of amount above R950,000</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-medium">R1,400,001 – R2,300,000</td>
                    <td className="p-2.5">R12,500 + 3% of amount above R1,400,000</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="pt-2 flex flex-wrap gap-3 text-xs font-semibold">
              <Link href="/sars-turnover-tax-registration" className="text-primary hover:underline">SARS Turnover Tax Registration →</Link>
              <Link href="/blog/turnover-tax-vs-company-tax" className="text-primary hover:underline">Turnover Tax vs SBC vs 27% CIT Guide →</Link>
              <Link href="/calculators" className="text-primary hover:underline">All Calculators →</Link>
            </div>
          </CardContent>
        </Card>
      </div>
      <CalculatorDisclaimer />
    </main>
  );
}
