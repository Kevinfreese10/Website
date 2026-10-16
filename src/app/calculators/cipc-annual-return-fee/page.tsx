import Link from 'next/link';
import { Calculator, ArrowRight } from 'lucide-react';
import { SITE_URL } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import CalculatorDisclaimer from '@/components/calculators/CalculatorDisclaimer';
import CipcAnnualReturnFeeCalculatorClient from './CalculatorClient';

export default function CipcAnnualReturnFeeCalculatorPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': `${SITE_URL}/calculators/cipc-annual-return-fee#app`,
        name: 'CIPC Annual Return Fee & Penalty Calculator South Africa',
        url: `${SITE_URL}/calculators/cipc-annual-return-fee`,
        applicationCategory: 'BusinessApplication',
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
            name: 'CIPC Annual Return Fee Calculator',
            item: `${SITE_URL}/calculators/cipc-annual-return-fee`,
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
            CIPC Annual Return Fee Calculator
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Calculate your company&apos;s CIPC annual return filing fees and check for late penalties instantly.
          </p>
        </div>
      </section>

      <CipcAnnualReturnFeeCalculatorClient />

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Understanding CIPC Annual Returns in South Africa
        </h2>
        <Separator className="w-12 border-b-2 border-primary/20" />
        <p className="text-slate-600 text-sm leading-relaxed">
          An Annual Return is a statutory document that every registered South African company and close corporation must submit to CIPC within 30 business days of its incorporation anniversary under Section 33 of the Companies Act 71 of 2008. Alongside the Annual Return, companies must submit a Financial Accountability Supplement (FAS / CoR 30.2) or iXBRL Annual Financial Statements, plus an up-to-date Beneficial Ownership declaration.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/calculators">
              All Calculators <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/products/annual-returns">CIPC Annual Return Filing</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/company-secretarial-services-south-africa">Company Secretarial Services</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/cipc-beneficial-ownership-register-south-africa">Beneficial Ownership Register</Link>
          </Button>
        </div>
        <CalculatorDisclaimer note="Late filing is estimated with a flat penalty. CIPC applies a separate late-fee schedule that increases with how overdue the return is." />
      </section>
    </div>
  );
}
