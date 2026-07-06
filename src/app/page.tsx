import HomePageClient from '@/components/home/HomePageClient';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Script from 'next/script';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'My Accountant | Professional Accounting & Tax Services',
        description: 'Professional Accounting & Tax Services for South Africa. We handle SARS, CIPC, and all your compliance needs so you can focus on your business.',
    };
    return getStaticPageMetadata('home', defaults);
}

const homeFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "What accounting services do you provide for SMEs?", "acceptedAnswer": { "@type": "Answer", "text": "We provide comprehensive bookkeeping, annual financial statements, management accounts, and outsourced CFO services tailored for South African SMEs." } },
    { "@type": "Question", "name": "How does the VAT registration process work?", "acceptedAnswer": { "@type": "Answer", "text": "We handle the entire VAT registration process with SARS, ensuring your business meets the mandatory or voluntary requirements correctly." } },
    { "@type": "Question", "name": "Can you help with tax debt relief and SARS compromises?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, our specialists assist with Section 200 compromises and negotiations to settle outstanding tax debt legally and affordably." } },
    { "@type": "Question", "name": "Do you provide monthly management reports?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, we prepare regular management accounts, including Income Statements and Balance Sheets, to help you track your business performance." } },
    { "@type": "Question", "name": "What is the process for SARS disputes and objections?", "acceptedAnswer": { "@type": "Answer", "text": "We analyze the grounds for assessment, draft Section 104 objections, and manage the entire dispute resolution process with SARS." } },
    { "@type": "Question", "name": "Where can I find the latest South African tax tips?", "acceptedAnswer": { "@type": "Answer", "text": "You can visit our Tax Tip Blog, where we regularly publish articles on tax optimization, compliance updates, and financial advice for freelancers and business owners." } },
    { "@type": "Question", "name": "Do you assist with annual financial statement preparation?", "acceptedAnswer": { "@type": "Answer", "text": "Yes, we prepare IFRS-compliant annual financial statements for companies and trusts to ensure year-end compliance and audit readiness." } }
  ]
};

export default function Home() {
  return (
    <>
      <Script
        id="homepage-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqSchema) }}
      />
      <HomePageClient />
    </>
  );
}
