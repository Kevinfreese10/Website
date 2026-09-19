import BookkeepingPageClient from '@/components/accounting/BookkeepingPageClient';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import { generateServicePillarSchema } from '@/lib/schema/productSchema';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Professional Bookkeeping Services South Africa | Monthly Record-Keeping',
        description: 'Outsource your bookkeeping to certified accountants in South Africa. Accurate monthly bank reconciliations, ledgers, VAT-ready accounts, and cloud software integration.',
    };
    return getStaticPageMetadata('bookkeeping-services', defaults);
}

const bookkeepingSchema = generateServicePillarSchema({
  title: 'Professional Bookkeeping Services South Africa',
  description: 'Monthly bookkeeping, bank reconciliations, accounts payable and receivable, management reports, and cloud accounting setup for South African SMEs.',
  slug: '/bookkeeping-services',
  serviceType: 'AccountingService',
  priceRange: 'From R850/month',
  breadcrumbs: [
    { name: 'Home', url: '/' },
    { name: 'Accounting Services', url: '/products#accounting' },
    { name: 'Bookkeeping Services', url: '/bookkeeping-services' }
  ],
  faqs: [
    {
      q: 'What does your monthly bookkeeping service include?',
      a: 'Our monthly bookkeeping includes capturing and categorizing all bank and credit card transactions, monthly bank reconciliations, accounts payable and receivable tracking, general ledger maintenance, and generating monthly trial balances and management accounts.'
    },
    {
      q: 'Which cloud accounting platforms do you support?',
      a: 'We work with all leading South African cloud platforms including Xero, Sage Business Cloud, and QuickBooks Online, ensuring your financial data is secure, backup up, and accessible in real time.'
    },
    {
      q: 'How does bookkeeping integrate with VAT submissions?',
      a: 'Accurate bookkeeping is the foundation of flawless VAT201 filing. We reconcile all input VAT against valid tax invoices and output VAT against sales, protecting your business against SARS audit assessments and disallowances.'
    },
    {
      q: 'Do you offer catch-up bookkeeping for backlog years?',
      a: 'Yes. If your bookkeeping is months or years behind, we provide historical catch-up bookkeeping to reconstruct your general ledgers and prepare clean figures for annual financial statements and tax filings.'
    }
  ]
});

export default function BookkeepingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(bookkeepingSchema) }}
      />
      <BookkeepingPageClient />
    </>
  );
}
