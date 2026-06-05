import { getPartnerBySlug } from '@/lib/firebase-admin';
import { User } from '@/lib/types';
import { notFound } from 'next/navigation';
import PartnerHeader from '@/components/partner/PartnerHeader';
import PartnerFooter from '@/components/partner/PartnerFooter';
import { Metadata } from 'next';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const partner = await getPartnerBySlug(slug);

  if (!partner) return { title: 'Practice Not Found' };

  const lp = partner.landingPage;
  const title = lp?.metaTitle || `${partner.companyName || partner.name} | Professional Accounting & Tax`;
  const description = lp?.metaDescription || lp?.heroSubtitle;
  
  let ogImage = lp?.heroImageUrl || GLOBAL_OG_IMAGE;
  if (ogImage.startsWith('/')) {
    ogImage = `${SITE_URL}${ogImage}`;
  }

  return {
    title: title,
    description: description,
    alternates: {
        canonical: `${SITE_URL}/p/${slug}`,
    },
    openGraph: {
      title: title,
      description: description,
      images: [{
        url: ogImage,
        width: 1200,
        height: 630,
        alt: title
      }],
      type: 'website',
      url: `${SITE_URL}/p/${slug}`,
      siteName: partner.companyName || partner.name,
      locale: 'en_ZA',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    }
  };
}

export default async function PartnerLandingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const partner = await getPartnerBySlug(slug);

  if (!partner) {
    notFound();
  }

  const lp = partner.landingPage;
  const isOutline = lp?.buttonStyle === 'outline';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --partner-primary: ${lp?.primaryColor || '#214392'};
          --partner-secondary: ${lp?.secondaryColor || lp?.primaryColor || '#214392'};
          --partner-bg: ${lp?.backgroundColor || '#ffffff'};
          --partner-text: ${lp?.textColor || '#111827'};
          --partner-card-bg: ${lp?.cardBackgroundColor || '#ffffff'};
          --partner-card-border: ${lp?.cardBorderColor || '#e5e7eb'};
          --partner-btn-bg: ${lp?.buttonColor || lp?.primaryColor || '#214392'};
          --partner-btn-text: ${lp?.buttonTextColor || '#ffffff'};

          /* Tailwind UI standardization overrides */
          --primary: ${lp?.primaryColor || '#214392'};
          --ring: ${lp?.primaryColor || '#214392'};
          --primary-foreground: ${lp?.buttonTextColor || '#ffffff'};
        }
        .partner-btn {
          background-color: ${isOutline ? 'transparent' : 'var(--partner-btn-bg)'} !important;
          color: ${isOutline ? 'var(--partner-btn-bg)' : 'var(--partner-btn-text)'} !important;
          border: ${isOutline ? '1px solid var(--partner-btn-bg)' : 'none'} !important;
        }
        .partner-btn-secondary {
          background-color: var(--partner-secondary) !important;
          color: var(--partner-text) !important;
        }
        .partner-text {
          color: var(--partner-primary) !important;
        }
        .partner-icon {
          color: var(--partner-secondary) !important;
        }
        .partner-text-main {
          color: var(--partner-text) !important;
        }
        .partner-border {
          border-color: var(--partner-primary) !important;
        }
        .partner-card {
          background-color: var(--partner-card-bg) !important;
          border-color: var(--partner-card-border) !important;
        }
        .partner-page-bg {
          background-color: var(--partner-bg) !important;
        }
      `}} />
      <PartnerHeader partner={partner} />
      <main className="flex-grow partner-page-bg partner-text-main">
        {children}
      </main>
      <PartnerFooter partner={partner} />
    </div>
  );
}
