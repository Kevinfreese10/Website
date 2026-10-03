import { notFound } from 'next/navigation';
import { industries } from '@/lib/industries';
import IndustryPageLayout from '@/components/industries/IndustryPageLayout';
import { Metadata } from 'next';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return Object.keys(industries).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const industry = industries[slug];
  
  if (!industry) return { title: 'Industry Not Found' };

  return {
    title: { absolute: `${industry.metaTitle || industry.title}` },
    description: industry.metaDescription || industry.description,
    alternates: {
      canonical: `${SITE_URL}/industries/${slug}`,
    },
    openGraph: {
      title: `${industry.metaTitle || industry.title}`,
      description: industry.metaDescription || industry.description,
      url: `${SITE_URL}/industries/${slug}`,
      siteName: 'My Accountant',
      locale: 'en_ZA',
      type: 'website',
      images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: `${industry.title} | My Accountant` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${industry.metaTitle || industry.title}`,
      description: industry.metaDescription || industry.description,
      images: [GLOBAL_OG_IMAGE],
    },
  };
}

export default async function IndustryPage({ params }: Props) {
  const { slug } = await params;
  const industry = industries[slug];

  if (!industry) {
    notFound();
  }

  return <IndustryPageLayout industry={industry} />;
}
