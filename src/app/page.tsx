import HomePageClient from '@/components/home/HomePageClient';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import { getAdminDb } from '@/lib/firebase-admin';
import { SITE_URL } from '@/lib/constants';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const defaults: Metadata = {
    title: 'My Accountant | Top Online Accounting & Tax Firm in SA',
    description: 'Trusted by 10,000+ SA businesses with 200+ 5-star reviews. Expert online accounting, SARS tax returns, VAT filing, and CIPC compliance. Book a consult today.',
  };
  const metadata = await getStaticPageMetadata('home', defaults);
  // Ensure any cached or overridden title does not contain the star symbol
  if (typeof metadata.title === 'string' && metadata.title.includes('★')) {
    metadata.title = 'My Accountant | Top Online Accounting & Tax Firm in SA';
  } else if (
    metadata.title &&
    typeof metadata.title === 'object' &&
    'absolute' in metadata.title &&
    typeof metadata.title.absolute === 'string' &&
    metadata.title.absolute.includes('★')
  ) {
    metadata.title = { absolute: 'My Accountant | Top Online Accounting & Tax Firm in SA' };
  }
  return metadata;
}

const DEFAULT_FEATURED_PRICES: Record<string, number> = {
  'ncr-registration': 1400,
  'accountants-letter': 1200,
  'tax-clearance-pin': 350,
};

async function getFeaturedServicePrices(): Promise<Record<string, number>> {
  const targetSlugs = ['ncr-registration', 'accountants-letter', 'tax-clearance-pin'];
  try {
    const db = getAdminDb();
    const snapshot = await db.collection('services')
      .where('slug', 'in', targetSlugs)
      .get();

    const prices: Record<string, number> = { ...DEFAULT_FEATURED_PRICES };
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.slug && typeof data.price === 'number') {
        prices[data.slug] = data.price;
      }
    });
    return prices;
  } catch (error) {
    console.error('[HomePage] Error fetching featured service prices from Firestore Admin, using fallback defaults:', error);
    return DEFAULT_FEATURED_PRICES;
  }
}

const homeFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "@id": `${SITE_URL}/#faq`,
  "isPartOf": {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`
  },
  "publisher": {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`
  },
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

export default async function Home() {
  const featuredPrices = await getFeaturedServicePrices();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFaqSchema) }}
      />
      <HomePageClient initialPrices={featuredPrices} />
    </>
  );
}
