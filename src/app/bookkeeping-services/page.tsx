import BookkeepingPageClient from '@/components/accounting/BookkeepingPageClient';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Professional Bookkeeping Services | My Accountant',
        description: 'Outsource your bookkeeping to certified professionals in South Africa. Comprehensive monthly record-keeping, bank reconciliations, ledgers, and cloud accounting.',
    };
    return getStaticPageMetadata('bookkeeping-services', defaults);
}

export default function BookkeepingPage() {
  return <BookkeepingPageClient />;
}
