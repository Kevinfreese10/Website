import { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Turnover Tax vs Company Tax in South Africa',
  description: 'A comprehensive guide to understanding the difference between Turnover Tax and standard Company Tax for small businesses in South Africa.',
  alternates: {
    canonical: `${SITE_URL}/blog/turnover-tax-vs-company-tax`,
  },
  openGraph: {
    title: 'Turnover Tax vs Company Tax | My Accountant',
    description: 'Find out which tax system is best for your small business: Turnover Tax or standard Company Tax.',
  }
};

export default function TurnoverTaxVsCompanyTax() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${SITE_URL}/blog/turnover-tax-vs-company-tax#article`,
        headline: 'Turnover Tax vs Company Tax: Which is Right for You?',
        description:
          'A comprehensive guide to understanding the difference between Turnover Tax and standard Company Tax for small businesses in South Africa.',
        datePublished: '2026-01-30T08:00:00+02:00',
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
          '@id': `${SITE_URL}/blog/turnover-tax-vs-company-tax`,
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
            name: 'Turnover Tax vs Company Tax',
            item: `${SITE_URL}/blog/turnover-tax-vs-company-tax`,
          },
        ],
      },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <article className="prose prose-lg lg:prose-xl prose-blue mx-auto">
        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-8">
          Turnover Tax vs Company Tax: Which is Right for You?
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Small business owners in South Africa often struggle with tax compliance. To ease this burden, SARS introduced Turnover Tax as a simplified alternative to standard Company Tax. But is it the right choice for your business? Let's compare them.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">What is Standard Company Tax?</h2>
        <p className="text-gray-700 mb-6">
          Standard Company Tax applies to most registered companies (like Pty Ltds). The company is taxed on its <strong>taxable income</strong> (Profit = Income - Deductible Expenses).
        </p>
        <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
          <li><strong>Tax Rate:</strong> A flat rate of 27% on taxable income.</li>
          <li><strong>Complexity:</strong> Requires detailed bookkeeping to track all income and expenses accurately.</li>
          <li><strong>Other Taxes:</strong> The company may still need to register for VAT (if revenue exceeds R1 million), PAYE, and Provisional Tax separately.</li>
          <li><strong>Advantage:</strong> If the company makes a loss, it pays zero tax, and the loss can often be carried forward to offset future profits.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">What is Turnover Tax?</h2>
        <p className="text-gray-700 mb-6">
          Turnover Tax is a simplified tax system designed for micro-businesses with a <strong>qualifying turnover of less than R1 million per year</strong>. Instead of taxing profit, it taxes your total revenue (turnover).
        </p>
        <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
          <li><strong>Tax Rate:</strong> Progressive sliding scale based on turnover. The first R335,000 is tax-free. The rates are very low (e.g., 1% to 3% on amounts above the threshold).</li>
          <li><strong>Simplicity:</strong> It replaces Income Tax, VAT, Provisional Tax, Capital Gains Tax, and Dividends Tax in a single system.</li>
          <li><strong>Bookkeeping:</strong> Requires minimal record-keeping (just a record of cash received).</li>
          <li><strong>Disadvantage:</strong> Because it taxes revenue, you pay tax even if your business is running at a loss or has very low profit margins.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Small Business Corporations (SBC)</h2>
        <p className="text-gray-700 mb-6">
          It's also worth noting the SBC tax regime. If your company qualifies as an SBC (turnover under R20 million and other strict criteria), you still calculate tax on profit, but you get access to a heavily discounted sliding scale rather than the flat 27%. This is often the "sweet spot" for growing small businesses.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Which Should You Choose?</h2>
        <p className="text-gray-700 mb-6">
          Choose <strong>Turnover Tax</strong> if your turnover is under R1 million, your profit margins are high, and you want to minimize accounting fees and administrative hassle.
        </p>
        <p className="text-gray-700 mb-6">
          Choose <strong>Standard Company Tax (or SBC)</strong> if your business operates on low profit margins, you expect to make losses in the early years, or your turnover exceeds (or will soon exceed) R1 million.
        </p>

        <div className="bg-blue-50 p-6 rounded-lg mt-8">
          <h3 className="text-xl font-semibold text-blue-900 mb-2">Need Expert Tax Advice?</h3>
          <p className="text-blue-800 mb-4">
            We can help you analyze your financials and register you for the most tax-efficient system with SARS.
          </p>
          <Link href="/contact" className="inline-block bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 transition">
            Speak to a Tax Expert
          </Link>
        </div>
      </article>
    </div>
  );
}
