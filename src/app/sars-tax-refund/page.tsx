import SarsRefundPageClient from '@/components/sars/SarsRefundPageClient';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Free SARS Tax Refund Check | Are You Due a Refund? | My Accountant',
        description: 'Find out if SARS owes you money. Get a free compliance assessment — we check your eFiling profile for unclaimed refunds from medical credits, retirement deductions, work-from-home claims and more. Results in 24 hours.',
        keywords: ['SARS refund', 'tax refund South Africa', 'SARS eFiling', 'tax compliance check', 'unclaimed tax refund', 'ITR12', 'income tax return', 'medical aid tax credit', 'retirement annuity deduction', 'free tax assessment'],
        openGraph: {
            title: 'Are You Due a Refund from SARS? | Free Compliance Check',
            description: 'Thousands of South Africans are owed money by SARS. Let our registered tax practitioners check your profile for free — results in 24 hours.',
            type: 'website',
        },
    };
    return getStaticPageMetadata('sars-tax-refund', defaults);
}

export default function SarsRefundPage() {
  return <SarsRefundPageClient />;
}
