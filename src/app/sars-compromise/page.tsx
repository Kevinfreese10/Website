import SarsCompromisePageClient from '@/components/sars/SarsCompromisePageClient';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import { generateServicePillarSchema } from '@/lib/schema/productSchema';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'SARS Compromise of Debt | Tax Debt Settlement & Relief',
        description: 'Explore your options for a SARS Compromise of Debt under Section 200 of the TAA. We help you negotiate a legal settlement with SARS to write off tax debt.',
    };
    return getStaticPageMetadata('sars-compromise', defaults);
}

const sarsCompromiseSchema = generateServicePillarSchema({
  title: 'SARS Compromise of Debt & Tax Debt Settlement',
  description: 'Legally reduce and settle outstanding SARS tax debt under Section 200 of the Tax Administration Act. Professional tax dispute representation.',
  slug: '/sars-compromise',
  serviceType: 'TaxConsultant',
  priceRange: 'From R2,850',
  breadcrumbs: [
    { name: 'Home', url: '/' },
    { name: 'Tax Services', url: '/products#tax-returns' },
    { name: 'SARS Compromise of Debt', url: '/sars-compromise' }
  ],
  faqs: [
    {
      q: 'What is a SARS Compromise of Debt?',
      a: 'A SARS Compromise of Debt is a legal agreement entered into under Section 200 of the Tax Administration Act (TAA) where SARS agrees to permanently write off a portion of an individual or company\'s tax liability, provided the remaining agreed amount is paid.'
    },
    {
      q: 'Who qualifies for a SARS Compromise of Debt?',
      a: 'To qualify, you must demonstrate genuine financial hardship, prove that SARS will recover more than it would through liquidation or sequestration, and ensure all tax returns are up to date with full asset and liability disclosure.'
    },
    {
      q: 'Can SARS freeze bank accounts while a compromise is negotiated?',
      a: 'SARS can issue third-party appointments to deduct funds from your bank. However, our registered tax practitioners immediately file a formal Suspension of Payment under Section 164 of the TAA to halt collection action while negotiating.'
    },
    {
      q: 'How long does a SARS compromise application take?',
      a: 'A compromise review typically takes 30 to 90 business days depending on the complexity of your financial disclosure and the SARS Debt Management committee meeting schedule.'
    }
  ]
});

export default function SarsCompromisePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sarsCompromiseSchema) }}
      />
      <SarsCompromisePageClient />
    </>
  );
}
