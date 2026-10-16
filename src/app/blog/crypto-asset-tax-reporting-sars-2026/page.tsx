import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { SITE_URL } from '@/lib/constants';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import ShareWidget from '@/components/blog/ShareWidget';

export const metadata: Metadata = {
  title: 'Crypto Asset Tax Reporting to SARS in 2026',
  description: 'A comprehensive guide to reporting crypto asset gains, losses, and income to SARS for the 2026 tax year. Stay compliant and avoid penalties.',
  alternates: {
    canonical: `${SITE_URL}/blog/crypto-asset-tax-reporting-sars-2026`,
  },
};

export default function CryptoTaxPage() {
  const title = "Crypto Asset Tax Reporting to SARS in 2026";
  const excerpt = "As SARS intensifies its scrutiny on digital assets, understanding how to accurately report your crypto trades and holdings is more crucial than ever.";

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${SITE_URL}/blog/crypto-asset-tax-reporting-sars-2026#article`,
        headline: title,
        description: excerpt,
        datePublished: '2026-02-18T08:00:00+02:00',
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
          '@id': `${SITE_URL}/blog/crypto-asset-tax-reporting-sars-2026`,
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
            item: `${SITE_URL}/blog/crypto-asset-tax-reporting-sars-2026`,
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
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/80" />
        
        <div className="container relative mx-auto px-4 max-w-4xl z-10">
          <div className="flex flex-col items-center text-center space-y-6">
            <Badge variant="secondary" className="uppercase tracking-widest font-extrabold bg-blue-50 text-blue-700 px-3 py-1">Crypto Tax</Badge>
            
            <h1 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl leading-tight text-slate-900">
              Crypto Asset Tax <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Reporting 2026</span>
            </h1>
            
            <p className="max-w-2xl text-lg font-medium text-slate-600 md:text-xl leading-relaxed">
              {excerpt}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8 pt-8 border-t border-slate-200/60 w-full max-w-2xl">
              <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                <span>August 2026</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5 text-blue-600" /> 6 min read</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full pt-8 pb-4">
        <TrustIndexWidget />
      </div>

      <article className="container mx-auto max-w-4xl px-4 pb-12 mt-4">
        <ShareWidget postTitle={title} postSlug="crypto-asset-tax-reporting-sars-2026" />

        <div className="prose prose-lg md:prose-xl max-w-none prose-headings:font-headline prose-headings:font-black prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-blue-600">
          <h2>SARS and Crypto Assets: The 2026 Landscape</h2>
          <p>
            The South African Revenue Service (SARS) considers crypto assets to be intangible assets for income tax purposes. They are not viewed as currency. Consequently, standard tax rules apply to any profits or losses you make from crypto asset transactions.
          </p>
          
          <h3>Capital vs Revenue: The Eternal Debate</h3>
          <p>
            One of the most complex areas of crypto taxation is determining whether your gains should be taxed as <strong>revenue</strong> (normal income tax) or <strong>capital</strong> (Capital Gains Tax). 
          </p>
          <ul>
            <li><strong>Revenue:</strong> If you are actively trading crypto to make short-term profits, your gains will likely be classified as income and taxed at your marginal rate (up to 45%).</li>
            <li><strong>Capital:</strong> If you buy crypto with the intention of holding it long-term as an investment, your gains upon disposal will likely be subject to CGT.</li>
          </ul>

          <h3>Reporting Requirements</h3>
          <p>
            You are required to declare all crypto-related income in your annual tax return. Failing to disclose crypto gains is a criminal offense and can result in severe penalties. SARS is actively employing advanced data mining techniques and collaborating with local exchanges to track taxpayer activity.
          </p>

          <div className="my-16 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-8 md:p-12 border shadow-2xl text-center relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white m-0">Confused by Crypto Taxes?</h2>
              <p className="text-lg text-slate-300 font-medium">
                Our specialized tax practitioners can help you reconcile your trades and file accurately.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                <Button asChild size="lg" className="h-14 px-8 text-base font-bold shadow-xl bg-blue-600 hover:bg-blue-500 text-white w-full sm:w-auto">
                  <Link href="/contact">Get Crypto Tax Help</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
