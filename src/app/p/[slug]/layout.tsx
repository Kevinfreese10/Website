import { getPartnerBySlug } from '@/lib/firebase-admin';
import { User } from '@/lib/types';
import { notFound } from 'next/navigation';
import PartnerHeader from '@/components/partner/PartnerHeader';
import PartnerFooter from '@/components/partner/PartnerFooter';
import { Metadata } from 'next';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';
import Script from 'next/script';

export const revalidate = 3600;

const fontLinks: Record<string, string> = {
  inter: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  outfit: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap',
  serif: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap',
  mono: 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&display=swap',
};

const fontFamilies: Record<string, string> = {
  sans: 'var(--font-body), sans-serif',
  inter: '"Inter", sans-serif',
  outfit: '"Outfit", sans-serif',
  serif: '"Playfair Display", Georgia, serif',
  mono: '"Fira Code", monospace',
};

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
    robots: {
      index: true,
      follow: true,
    },
    /*
     * DELIBERATE: partner storefronts always canonicalise to myacc.co.za, including when reached
     * via a partner's own custom domain.
     *
     * This is a product decision, not an oversight — partner sites are a lead-generation and
     * white-label presentation tool, not an independent SEO asset. Consolidating link equity on
     * the main domain also avoids the partner storefronts competing with myacc.co.za for the same
     * South African accounting terms, which is what would happen if each self-canonicalised
     * (the underlying service content is largely identical across them).
     *
     * Consequences, accepted:
     *   - partner custom domains cannot rank under their own brand
     *   - /p/ is disallowed in robots.txt, so these pages are not indexed on the main domain either
     *   - custom domains have no robots.txt or sitemap of their own (middleware.ts does not route
     *     those paths), which is consistent with them not being intended to rank
     *
     * If the commercial position changes and partners should rank independently, this needs to
     * change together with the middleware matcher and per-domain robots/sitemap routes — please
     * don't "fix" the canonical on its own.
     */
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

  const radiusMap = {
    none: '0px',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
  };
  const rawRadius = lp?.borderRadius || (lp?.cardRadius === '0' ? 'none' : lp?.cardRadius === '0.5rem' ? 'sm' : lp?.cardRadius === '1.5rem' ? 'lg' : 'md');
  const radiusValue = radiusMap[rawRadius as keyof typeof radiusMap] || lp?.cardRadius || '0.5rem';

  const cardBgColor = lp?.cardBackgroundColor || lp?.cardBg || '#ffffff';
  const cardBorderColor = lp?.cardBorderColor || lp?.cardBorder || '#e5e7eb';

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Dynamic Font Loading */}
      {lp?.fontFamily && fontLinks[lp.fontFamily] && (
        <link rel="stylesheet" href={fontLinks[lp.fontFamily]} />
      )}

      {/* Google Analytics Script Injection */}
      {lp?.googleAnalyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${lp.googleAnalyticsId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${lp.googleAnalyticsId}');
            `}
          </Script>
        </>
      )}

      {/* Meta Pixel Script Injection */}
      {lp?.metaPixelId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${lp.metaPixelId}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --partner-primary: ${lp?.primaryColor || '#214392'};
          --partner-secondary: ${lp?.secondaryColor || lp?.primaryColor || '#214392'};
          --partner-bg: ${lp?.backgroundColor || '#ffffff'};
          --partner-text: ${lp?.textColor || '#111827'};
          --partner-card-bg: ${cardBgColor};
          --partner-card-border: ${cardBorderColor};
          --partner-btn-bg: ${lp?.buttonColor || lp?.primaryColor || '#214392'};
          --partner-btn-text: ${lp?.buttonTextColor || '#ffffff'};

          /* Tailwind UI standardization overrides */
          --primary: ${lp?.primaryColor || '#214392'};
          --ring: ${lp?.primaryColor || '#214392'};
          --primary-foreground: ${lp?.buttonTextColor || '#ffffff'};
          --radius: ${radiusValue};
          --partner-radius: ${radiusValue};
        }
        
        /* Font Family styling */
        body, html, div, span, p, h1, h2, h3, h4, h5, h6, button, input, select, textarea {
          font-family: ${fontFamilies[lp?.fontFamily || 'sans'] || fontFamilies.sans};
        }
        pre, code, .font-mono {
          font-family: ${lp?.fontFamily === 'mono' ? 'var(--font-body)' : 'monospace, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas'} !important;
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

        /* Border Radius controls mapping */
        .partner-card, .partner-btn, button, input, select, textarea, .rounded-xl, .rounded-lg, .rounded-xl {
          border-radius: var(--partner-radius) !important;
        }

        /* Glassmorphism custom controls overrides */
        ${lp?.glassmorphism ? `
        .partner-card, .glass-card, .glass {
          background: ${cardBgColor ? `${cardBgColor}70` : 'rgba(255, 255, 255, 0.45)'} !important;
          backdrop-filter: blur(20px) saturate(180%) !important;
          -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
          border: 1px solid ${cardBorderColor || 'rgba(255, 255, 255, 0.25)'} !important;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.05) !important;
        }
        ` : ''}
      `}} />
      <PartnerHeader partner={partner} />
      <main className="flex-grow partner-page-bg partner-text-main">
        {children}
      </main>
      <PartnerFooter partner={partner} />
    </div>
  );
}
