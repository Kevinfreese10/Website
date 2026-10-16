import SarsRefundPageClient from '@/components/sars/SarsRefundPageClient';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { generateServicePillarSchema } from '@/lib/schema/productSchema';
import { Metadata } from 'next';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const defaults: Metadata = {
    title: 'Free SARS Tax Refund Check | Are You Due a Refund? | My Accountant',
    description:
      'Find out if SARS owes you money. Get a free compliance assessment — we check your eFiling profile for unclaimed refunds from medical credits, retirement deductions, work-from-home claims and more. Results in 24 hours.',
    keywords: [
      'SARS refund',
      'tax refund South Africa',
      'SARS eFiling',
      'tax compliance check',
      'unclaimed tax refund',
      'ITR12',
      'income tax return',
      'medical aid tax credit',
      'retirement annuity deduction',
      'free tax assessment',
    ],
    openGraph: {
      title: 'Are You Due a Refund from SARS? | Free Compliance Check',
      description:
        'Thousands of South Africans are owed money by SARS. Let our registered tax practitioners check your profile for free — results in 24 hours.',
      type: 'website',
    },
  };
  return getStaticPageMetadata('sars-tax-refund', defaults);
}

const sarsRefundSchema = generateServicePillarSchema({
  title: 'SARS Tax Refund Assessment & ITR12 Return Filing',
  description:
    'Professional SARS eFiling tax refund review, ITR12 personal income tax return filing, and SARS audit verification support.',
  slug: '/sars-tax-refund',
  serviceType: 'TaxConsultant',
  priceRange: 'From R550',
  breadcrumbs: [
    { name: 'Home', url: '/' },
    { name: 'Tax Services', url: '/products#tax-returns' },
    { name: 'SARS Tax Refund Check', url: '/sars-tax-refund' },
  ],
  faqs: [
    {
      q: 'How long does SARS take to pay out a tax refund in 2026?',
      a: 'If your ITR12 return is not selected for verification and your banking details are verified, SARS pays out refunds within 72 business hours. If selected for verification, SARS has a 21-business-day turnaround once supporting documents are uploaded.',
    },
    {
      q: 'Why is my SARS tax refund on hold or got a "Selected for Verification" status?',
      a: 'SARS withholds refunds if you have unfiled prior-year returns, unverified banking details (RAV01), or an open verification case requiring IRP5s, medical aid tax certificates, retirement annuity IT3(f) certificates, or a travel logbook.',
    },
    {
      q: 'Can I claim a SARS refund for previous tax years?',
      a: 'Yes. Unclaimed medical out-of-pocket expenses, Section 11F retirement annuity contributions, travel logbooks, and commission deductions can be claimed for overdue prior tax years or requested via a Reduced Assessment / Section 104 objection.',
    },
  ],
});

export default function SarsRefundPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(sarsRefundSchema) }}
      />
      <SarsRefundPageClient />
    </>
  );
}
