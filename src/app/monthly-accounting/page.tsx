import MonthlyAccountingPageClient from '@/components/accounting/MonthlyAccountingPageClient';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import { generateServicePillarSchema } from '@/lib/schema/productSchema';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Monthly Accounting & CFO Services | My Accountant',
        description: 'Professional monthly accounting, financial management, and outsourced CFO services for South African SMEs. Scalable solutions for startups and growing businesses.',
    };
    return getStaticPageMetadata('monthly-accounting', defaults);
}

const monthlyAccountingSchema = generateServicePillarSchema({
  title: 'Monthly Accounting & Outsourced CFO Services',
  description: 'Ongoing monthly bookkeeping, management accounts, VAT submissions, and outsourced CFO advisory for South African SMEs.',
  slug: '/monthly-accounting',
  serviceType: 'AccountingService',
  priceRange: 'From R1,850/month',
  breadcrumbs: [
    { name: 'Home', url: '/' },
    { name: 'Accounting Services', url: '/products#accounting' },
    { name: 'Monthly Accounting', url: '/monthly-accounting' },
  ],
  faqs: [
    { q: "What are monthly accounting services?", a: "Monthly accounting services involve ongoing bookkeeping, transaction processing, reconciliations, VAT submissions, management accounts, and financial reporting performed each month to keep your business financially compliant and organised." },
    { q: "What is the difference between accounting services and CFO services?", a: "Accounting services focus on recording and maintaining financial information, while CFO services provide strategic financial leadership, forecasting, growth planning, financial oversight, and executive-level financial advice." },
    { q: "Do small businesses need monthly accounting services?", a: "Yes. Monthly accounting services help businesses maintain accurate records, manage cash flow, remain SARS compliant, and make informed business decisions." },
    { q: "Can My Accountant manage payroll and tax submissions?", a: "Yes. We provide integrated payroll, PAYE, VAT, income tax, and SARS compliance services as part of our monthly accounting solutions." },
    { q: "Do you offer online accounting services?", a: "Yes. My Accountant operates as an online accounting firm assisting businesses throughout South Africa remotely using cloud accounting and digital document systems." }
  ]
});

export default function MonthlyAccountingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(monthlyAccountingSchema) }}
      />
      <MonthlyAccountingPageClient />
    </>
  );
}
