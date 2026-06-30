import MonthlyAccountingPageClient from '@/components/accounting/MonthlyAccountingPageClient';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Monthly Accounting & CFO Services | My Accountant',
        description: 'Professional monthly accounting, financial management, and outsourced CFO services for South African SMEs. Scalable solutions for startups and growing businesses.',
    };
    return getStaticPageMetadata('monthly-accounting', defaults);
}

export default function MonthlyAccountingPage() {
  return <MonthlyAccountingPageClient />;
}
