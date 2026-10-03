import { Metadata } from 'next';
import { industries } from '@/lib/industries';
import IndustryPageLayout from '@/components/industries/IndustryPageLayout';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

const industry = industries['ecommerce-online-sellers'];

export const metadata: Metadata = {
  title: { absolute: industry.metaTitle },
  description: industry.metaDescription,
  alternates: {
    canonical: `${SITE_URL}/industries/ecommerce-online-sellers`,
  },
  openGraph: {
    title: industry.metaTitle,
    description: industry.metaDescription,
    url: `${SITE_URL}/industries/ecommerce-online-sellers`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: industry.title }],
  },
  twitter: {
    card: 'summary_large_image',
    title: industry.metaTitle,
    description: industry.metaDescription,
    images: [GLOBAL_OG_IMAGE],
  },
};

export default function EcommerceIndustryPage() {
  return <IndustryPageLayout industry={industry} />;
}
