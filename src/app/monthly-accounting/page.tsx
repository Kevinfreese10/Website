import MonthlyAccountingPageClient from '@/components/accounting/MonthlyAccountingPageClient';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Script from 'next/script';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Monthly Accounting & CFO Services | My Accountant',
        description: 'Professional monthly accounting, financial management, and outsourced CFO services for South African SMEs. Scalable solutions for startups and growing businesses.',
    };
    return getStaticPageMetadata('monthly-accounting', defaults);
}

const monthlyAccountingFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "What are monthly accounting services?", "acceptedAnswer": { "@type": "Answer", "text": "Monthly accounting services involve ongoing bookkeeping, transaction processing, reconciliations, VAT submissions, management accounts, and financial reporting performed each month to keep your business financially compliant and organised." } },
    { "@type": "Question", "name": "What is the difference between accounting services and CFO services?", "acceptedAnswer": { "@type": "Answer", "text": "Accounting services focus on recording and maintaining financial information, while CFO services provide strategic financial leadership, forecasting, growth planning, financial oversight, and executive-level financial advice." } },
    { "@type": "Question", "name": "Do small businesses need monthly accounting services?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Monthly accounting services help businesses maintain accurate records, manage cash flow, remain SARS compliant, and make informed business decisions." } },
    { "@type": "Question", "name": "Can My Accountant manage payroll and tax submissions?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. We provide integrated payroll, PAYE, VAT, income tax, and SARS compliance services as part of our monthly accounting solutions." } },
    { "@type": "Question", "name": "Do you offer online accounting services?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. My Accountant operates as an online accounting firm assisting businesses throughout South Africa remotely using cloud accounting and digital document systems." } }
  ]
};

export default function MonthlyAccountingPage() {
  return (
    <>
      <Script
        id="monthly-accounting-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(monthlyAccountingFaqSchema) }}
      />
      <MonthlyAccountingPageClient />
    </>
  );
}
