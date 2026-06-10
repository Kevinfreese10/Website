import TaxConsultantPageClient from '@/components/sars/TaxConsultantPageClient';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Professional Tax Consultant SA | SARS Compliance | My Accountant',
        description: 'Get expert tax consulting and SARS dispute assistance in South Africa. We handle audits, objections, compromises, penalty remissions, and structured tax planning.',
    };
    return getStaticPageMetadata('tax-consultant', defaults);
}

export default function TaxConsultantPage() {
  return <TaxConsultantPageClient />;
}
