import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { SITE_URL } from '@/lib/constants';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import ShareWidget from '@/components/blog/ShareWidget';

export const metadata: Metadata = {
  title: 'CGT Annual Exclusion Increase for 2026',
  description: 'Learn about the 2026 increase in the Capital Gains Tax (CGT) annual exclusion in South Africa and how it benefits individual investors and trusts.',
  alternates: {
    canonical: `${SITE_URL}/blog/cgt-annual-exclusion-increase-2026`,
  },
};

export default function CGTExclusionPage() {
  const title = "CGT Annual Exclusion Increase for 2026";
  const excerpt = "The 2026 budget introduces a welcome relief for investors with an increase in the annual Capital Gains Tax exclusion amount.";

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${SITE_URL}/blog/cgt-annual-exclusion-increase-2026#article`,
        headline: title,
        description: excerpt,
        datePublished: '2026-02-25T08:00:00+02:00',
        dateModified: '2026-03-01T08:00:00+02:00',
        author: {
          '@id': `${SITE_URL}/#kevin-freese`,
          '@type': 'Person',
          name: 'Kevin Freese',
          url: `${SITE_URL}/about`,
        },
        publisher: {
          '@id': `${SITE_URL}/#organization`,
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': `${SITE_URL}/blog/cgt-annual-exclusion-increase-2026`,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
          {
            '@type': 'ListItem',
            position: 3,
            name: title,
            item: `${SITE_URL}/blog/cgt-annual-exclusion-increase-2026`,
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <section className="relative w-full bg-white border-b pt-20 pb-24 animate-in fade-in">
        <div className="absolute inset-0 bg-grid-slate-100/[0.04] bg-[size:20px_20px]" />
        
        <div className="container relative mx-auto px-4 max-w-4xl z-10">
          <div className="flex flex-col items-center text-center space-y-6">
            <Badge variant="secondary" className="uppercase tracking-widest font-extrabold bg-blue-50 text-blue-700 px-3 py-1">Capital Gains Tax</Badge>
            
            <h1 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl leading-tight text-slate-900">
              CGT Annual Exclusion <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Increase 2026</span>
            </h1>
            
            <p className="max-w-2xl text-lg font-medium text-slate-600 md:text-xl leading-relaxed">
              {excerpt}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8 pt-8 border-t border-slate-200/60 w-full max-w-2xl">
              <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                <span>August 2026</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5 text-blue-600" /> 4 min read</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full pt-8 pb-4">
        <TrustIndexWidget />
      </div>

      <article className="container mx-auto max-w-4xl px-4 pb-12 mt-4">
        <ShareWidget postTitle={title} postSlug="cgt-annual-exclusion-increase-2026" />

        <div className="prose prose-lg md:prose-xl max-w-none prose-headings:font-headline prose-headings:font-black prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-blue-600">
          <h2>What is the CGT Annual Exclusion?</h2>
          <p>
            Capital Gains Tax (CGT) is triggered when you dispose of an asset at a profit. To provide administrative relief for small gains, SARS grants natural persons (and special trusts) an annual exclusion.
          </p>
          
          <h3>The 2026 Increase</h3>
          <p>
            For the 2026 year of assessment, the annual exclusion for individuals has been increased, providing greater scope for tax-free portfolio rebalancing. This means the first portion of your aggregate capital gain for the year is entirely exempt from CGT. Furthermore, the exclusion in the year of death has also been adjusted upwards.
          </p>

          <h2>Strategic Planning</h2>
          <p>
            Investors should strategically time their asset disposals across multiple tax years to fully utilize their annual exclusions. Selling a portion of a highly appreciated asset over two consecutive tax years, instead of a lump sum, can effectively double your tax-free gain allowance.
          </p>

          <div className="my-16 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-8 md:p-12 border shadow-2xl text-center relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white m-0">Need Investment Tax Structuring?</h2>
              <p className="text-lg text-slate-300 font-medium">
                Let us help you minimize your CGT liabilities through intelligent planning.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                <Button asChild size="lg" className="h-14 px-8 text-base font-bold shadow-xl bg-blue-600 hover:bg-blue-500 text-white w-full sm:w-auto">
                  <Link href="/contact">Book a Strategy Session</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
