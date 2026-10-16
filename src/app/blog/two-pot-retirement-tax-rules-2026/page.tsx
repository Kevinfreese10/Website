import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { SITE_URL } from '@/lib/constants';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import ShareWidget from '@/components/blog/ShareWidget';

export const metadata: Metadata = {
  title: 'Two-Pot Retirement Tax Rules for 2026',
  description: 'Understand the new two-pot retirement system in South Africa and the essential tax rules effective for 2026. Learn how to manage your savings efficiently.',
  alternates: {
    canonical: `${SITE_URL}/blog/two-pot-retirement-tax-rules-2026`,
  },
  openGraph: {
    title: 'Two-Pot Retirement Tax Rules for 2026',
    description: 'Understand the new two-pot retirement system in South Africa and the essential tax rules effective for 2026.',
    url: `${SITE_URL}/blog/two-pot-retirement-tax-rules-2026`,
    type: 'article',
  }
};

export default function TwoPotRetirementPage() {
  const title = "Two-Pot Retirement Tax Rules for 2026";
  const excerpt = "The two-pot retirement system fundamentally changes how South Africans access their pension funds. Discover the vital tax implications you need to know for 2026.";

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${SITE_URL}/blog/two-pot-retirement-tax-rules-2026#article`,
        headline: title,
        description: excerpt,
        datePublished: '2026-02-10T08:00:00+02:00',
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
          '@id': `${SITE_URL}/blog/two-pot-retirement-tax-rules-2026`,
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
            item: `${SITE_URL}/blog/two-pot-retirement-tax-rules-2026`,
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
      {/* HERO SECTION */}
      <section className="relative w-full bg-white border-b pt-20 pb-24 animate-in fade-in">
        <div className="absolute inset-0 bg-grid-slate-100/[0.04] bg-[size:20px_20px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/80" />
        
        <div className="container relative mx-auto px-4 max-w-4xl z-10">
          <div className="flex flex-col items-center text-center space-y-6">
            <Badge variant="secondary" className="uppercase tracking-widest font-extrabold bg-blue-50 text-blue-700 px-3 py-1">Retirement Tax</Badge>
            
            <h1 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl leading-tight text-slate-900">
              Two-Pot Retirement <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Tax Rules 2026</span>
            </h1>
            
            <p className="max-w-2xl text-lg font-medium text-slate-600 md:text-xl leading-relaxed">
              {excerpt}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8 pt-8 border-t border-slate-200/60 w-full max-w-2xl">
              <div className="flex items-center gap-4">
                <div className="text-center sm:text-left">
                  <p className="font-bold text-slate-900 leading-tight">Kevin Freese</p>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">Chartered Accountant (CIBA, SAIT)</p>
                </div>
              </div>
              <div className="hidden sm:block h-10 w-px bg-slate-200" />
              <div className="flex items-center gap-4 text-sm font-semibold text-slate-600">
                <span>August 2026</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5 text-blue-600" /> 5 min read</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full pt-8 pb-4">
        <TrustIndexWidget />
      </div>

      <article className="container mx-auto max-w-4xl px-4 pb-12 mt-4">
        <ShareWidget postTitle={title} postSlug="two-pot-retirement-tax-rules-2026" />

        <div className="prose prose-lg md:prose-xl max-w-none prose-headings:font-headline prose-headings:font-black prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-blue-600">
          <h2>Understanding the Two-Pot System</h2>
          <p>
            The two-pot retirement system, fully operational as of 2026, aims to strike a balance between long-term retirement savings and short-term financial emergencies. Your retirement contributions are now divided into two distinct components: the <strong>Savings Pot</strong> (accessible) and the <strong>Retirement Pot</strong> (preserved).
          </p>
          
          <h3>The Savings Pot</h3>
          <p>
            A maximum of one-third of your retirement contributions goes into the Savings Pot. You can withdraw from this pot once per tax year, provided the withdrawal is at least R2,000. It is critical to understand that any withdrawals from the Savings Pot will be added to your taxable income and taxed at your marginal tax rate for the year.
          </p>

          <h3>The Retirement Pot</h3>
          <p>
            The remaining two-thirds of your contributions are locked in the Retirement Pot. These funds cannot be accessed under any circumstances before retirement. Upon retirement, this pot must be used to purchase an annuity to provide a regular income stream.
          </p>

          <h2>Tax Implications of Early Withdrawals</h2>
          <p>
            SARS requires that standard PAYE is withheld by the fund administrator upon any withdrawal from the Savings Pot. Depending on your total income for the year, you may need to pay in additional tax upon assessment if the initial withholding was insufficient. 
          </p>

          <div className="my-16 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-8 md:p-12 border shadow-2xl text-center relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white m-0">Need Expert Tax Advice?</h2>
              <p className="text-lg text-slate-300 font-medium">
                Ensure you are making the most tax-efficient decisions regarding your retirement funds. Book a free consultation today.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                <Button asChild size="lg" className="h-14 px-8 text-base font-bold shadow-xl bg-blue-600 hover:bg-blue-500 text-white w-full sm:w-auto">
                  <Link href="/contact">Book Free Consultation</Link>
                </Button>
              </div>
            </div>
          </div>

        </div>
      </article>
    </>
  );
}
