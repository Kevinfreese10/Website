import { Metadata } from 'next';
import Link from 'next/link';
import {
  CheckCircle2,
  FileText,
  HelpCircle,
  Calculator,
  Percent,
  Clock,
  AlertTriangle,
  ArrowRight,
  Compass
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'SARS Turnover Tax Guide & Rates 2026/2027',
  description:
    'Complete guide to SARS Turnover Tax registration for South African micro-businesses with turnover under R2.3 million (effective 1 April 2026). Calculate rates, download TT01 form, and apply online.',
  alternates: {
    canonical: `${SITE_URL}/sars-turnover-tax-registration`,
  },
  openGraph: {
    title: 'SARS Turnover Tax Guide & Rates 2026/2027 | My Accountant',
    description:
      'Learn how Turnover Tax works in SA. Qualifying criteria (up to R2.3M), tax tables (0% up to R600k), TT01 application steps, and expert assistance.',
    url: `${SITE_URL}/sars-turnover-tax-registration`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: 'SARS Turnover Tax Guide' }],
  },
};

const diySteps = [
  {
    step: 'Step 1',
    title: 'Check Sixth Schedule Eligibility Criteria',
    detail:
      'Verify that your qualifying annual gross turnover will not exceed R2.3 million (effective 1 April 2026) and that no more than 20% of your receipts come from "professional services" (accounting, legal, medical, engineering, or IT consulting by a company/CC) or investment income.',
  },
  {
    step: 'Step 2',
    title: 'Download & Complete SARS Form TT01',
    detail:
      'Download the official TT01 (Application for Registration as a Micro Business for Turnover Tax) from sars.gov.za and complete all shareholder/member declarations.',
  },
  {
    step: 'Step 3',
    title: 'Submit via SOQS or SARS eFiling Before the Deadline',
    detail:
      'Existing businesses must submit Form TT01 before the start of the year of assessment (on or before 28/29 February). Newly started micro-businesses must apply within 2 months from the date business activities commenced.',
  },
  {
    step: 'Step 4',
    title: 'Verify Turnover Tax Activation on SARS eFiling',
    detail:
      'SARS processes TT01 registrations within 7 to 21 business days and issues a formal Turnover Tax registration notice activating TT02 and TT03 return types on eFiling.',
  },
  {
    step: 'Step 5',
    title: 'Submit Bi-Annual TT02 Estimates & Annual TT03 Return',
    detail:
      'Submit and pay interim Turnover Tax payments twice a year (Form TT02 by 31 August and 28 February) and lodge your final annual Turnover Tax return (Form TT03) during Corporate/Individual Filing Season.',
  },
];

const rejectionCases = [
  {
    title: 'Professional Services Disqualification (Para 3 of Sixth Schedule)',
    desc: 'Companies and Close Corporations deriving more than 20% of receipts from professional services (IT, consulting, medical, legal, engineering, accounting) are disqualified from Turnover Tax and should use Section 12E SBC instead.',
  },
  {
    title: 'Missing the 28 February Prior-Year Cut-Off',
    desc: 'If an existing trading business submits Form TT01 on or after 1 March, SARS rejects the election for the current tax year and defers registration to the next assessment year.',
  },
  {
    title: 'Cross-Shareholding in Multiple Companies',
    desc: 'If any shareholder holds shares or member’s interest in another unlisted company or CC (other than dormant/exempt entities), SARS disqualifies the micro-business from the Sixth Schedule.',
  },
  {
    title: 'Financial Year-End Not Ending on 28/29 February',
    desc: 'A company cannot register for Turnover Tax if its registered CIPC financial year-end is any month other than February.',
  },
];

const faqs = [
  {
    question: 'What is SARS Turnover Tax?',
    answer:
      'Turnover Tax is a simplified, elective tax system under the Sixth Schedule to the Income Tax Act for South African micro-businesses with qualifying annual turnover of R2.3 million or less (effective 1 April 2026). It replaces Income Tax, Provisional Tax, Capital Gains Tax, and (unless elected otherwise) VAT with a single low tax on gross turnover.',
  },
  {
    question: 'What are the SARS Turnover Tax rates for 2026/2027?',
    answer:
      'Effective 1 April 2026: R0 – R600,000 is 0% (Tax Free); R600,001 – R950,000 is 1% of turnover above R600,000; R950,001 – R1,400,000 is R3,500 + 2% of turnover above R950,000; R1,400,001 – R2,300,000 is R12,500 + 3% of turnover above R1,400,000.',
  },
  {
    question: 'How long does SARS take to approve a TT01 Turnover Tax registration?',
    answer:
      'Once Form TT01 and supporting CIPC / ID documents are uploaded via SOQS or eFiling, SARS typically takes 7 to 21 business days to verify Sixth Schedule eligibility and activate your Turnover Tax profile.',
  },
  {
    question: 'Is Turnover Tax or Section 12E Small Business Corporation (SBC) better for my business?',
    answer:
      'Turnover Tax taxes gross revenue regardless of expenses, making it ideal for high-margin micro-businesses with low overhead costs. If your business has high deductible expenses or low net profit margins (under 15%), a standard Pty Ltd taxed under Section 12E SBC often results in lower tax.',
  },
  {
    question: 'When is the deadline to register for Turnover Tax?',
    answer:
      'Existing businesses must apply before the start of the new tax year (on or before 28/29 February). Newly established micro-businesses must submit Form TT01 within 2 months of commencing business operations.',
  },
];

export default function SarsTurnoverTaxRegistrationPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'SARS Online Query Guides', item: `${SITE_URL}/sars-online-query-system-guide` },
          { '@type': 'ListItem', position: 3, name: 'SARS Turnover Tax Registration', item: `${SITE_URL}/sars-turnover-tax-registration` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Register for SARS Turnover Tax (Form TT01)',
        description: 'Step-by-step guide to registering a South African micro-business for SARS Turnover Tax.',
        totalTime: 'PT30M',
        step: diySteps.map((s, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          name: s.title,
          text: s.detail,
        })),
      },
      {
        '@type': 'Service',
        name: 'SARS Turnover Tax Registration (TT01) & Return Filing (TT02/TT03)',
        description: 'Professional Sixth Schedule eligibility assessment, Form TT01 registration, and bi-annual TT02/TT03 filing.',
        provider: { '@type': 'Organization', name: 'My Accountant', url: SITE_URL },
        areaServed: { '@type': 'Country', name: 'South Africa' },
        url: `${SITE_URL}/sars-turnover-tax-registration`,
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHero
        title="SARS Turnover Tax Registration & Guide"
        subtitle="Simplified, low-rate tax for South African micro-businesses with annual turnover of R2.3 million or less."
        badgeText="SARS Official Query Guide 2026/2027"
        primaryCta={{ text: 'Calculate Turnover Tax', href: '/calculators/turnover-tax-calculator' }}
        secondaryCta={{ text: 'Consult a Tax Practitioner', href: '/contact' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <TrustIndexWidget />

        <SarsOfficialLinkBox
          title="SARS Turnover Tax Portal & TT01 Forms"
          portalUrl="https://www.sars.gov.za/types-of-tax/turnover-tax/"
          description="Access official SARS Turnover Tax information, download TT01 registration forms, and manage your micro-business tax profile online via SARS eFiling or SOQS."
        />

        {/* Overview & Tax Rates Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border border-slate-200/80 shadow-sm bg-white rounded-xl">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Percent className="w-5 h-5 text-blue-600" />
                How Turnover Tax Works &amp; eFiling Navigation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-sm text-slate-600 leading-relaxed">
              <p>
                Turnover Tax is designed by SARS under the Sixth Schedule to reduce administrative friction for micro-businesses with annual gross revenue of <strong>R2.3 million or less</strong> (increased from R1 million effective 1 April 2026).
              </p>
              <ul className="space-y-2 list-disc pl-5">
                <li><strong>eFiling Path:</strong> Log into eFiling &rarr; <em>Organisations &rarr; Tax Types &rarr; Manage Tax Types</em> (or upload Form TT01 via SOQS Supporting Documents).</li>
                <li><strong>SARS Turnaround Time:</strong> 7 to 21 business days from TT01 submission.</li>
                <li><strong>Higher Tax-Free Threshold:</strong> The first R600,000 of gross turnover is 100% tax-free.</li>
                <li><strong>Filing Deadlines:</strong> Interim TT02 returns due 31 August &amp; 28 February; annual TT03 due during Tax Season.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 shadow-sm bg-white rounded-xl">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Calculator className="w-5 h-5 text-blue-600" />
                SARS Turnover Tax Rates (Effective 1 April 2026)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-600">
                  <thead className="bg-slate-100 text-slate-800 font-bold">
                    <tr>
                      <th className="p-2.5 rounded-l-lg">Turnover Bracket</th>
                      <th className="p-2.5 rounded-r-lg">Tax Payable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5 font-medium">R0 – R600,000</td>
                      <td className="p-2.5 text-emerald-700 font-bold">0% (Tax Free)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">R600,001 – R950,000</td>
                      <td className="p-2.5">1% of amount above R600,000</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">R950,001 – R1,400,000</td>
                      <td className="p-2.5">R3,500 + 2% of amount above R950,000</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">R1,400,001 – R2,300,000</td>
                      <td className="p-2.5">R12,500 + 3% of amount above R1,400,000</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DIY Step-by-Step Guide */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              DIY Turnover Tax Registration Steps
            </h2>
            <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
              TT01 Application
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {diySteps.map((step, idx) => (
              <Card key={idx} className="border border-slate-200/80 shadow-sm bg-white rounded-xl hover:border-blue-300 transition-all">
                <CardContent className="p-6 space-y-3">
                  <span className="text-xs font-black uppercase text-blue-600 tracking-wider">{step.step}</span>
                  <h3 className="font-bold text-slate-900 text-base">{step.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{step.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Rejection & Disqualification Edge Cases */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            Common TT01 Rejection &amp; Disqualification Rules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rejectionCases.map((rc, idx) => (
              <Card key={idx} className="border border-slate-200/80 shadow-sm bg-white rounded-xl">
                <CardContent className="p-6 space-y-2">
                  <h3 className="font-bold text-slate-900 text-base">{rc.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{rc.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* FAQs */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, idx) => (
              <Card key={idx} className="border border-slate-200/80 shadow-sm bg-white rounded-xl">
                <CardContent className="p-6 space-y-2">
                  <h3 className="font-bold text-slate-900 text-base">{faq.question}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Related Guides & Service Packages */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900">Related SARS Guides, Calculators &amp; Packages</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <Link href="/calculators/turnover-tax-calculator" className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:border-blue-500 font-semibold text-slate-900 flex items-center justify-between">
              <span>Turnover Tax vs SBC Calculator</span>
              <ArrowRight className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            </Link>
            <Link href="/blog/turnover-tax-vs-company-tax" className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 hover:border-blue-500 font-semibold text-slate-900 flex items-center justify-between">
              <span>Turnover Tax vs Company Tax Guide</span>
              <ArrowRight className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            </Link>
            <Link href="/products/company-tax-returns" className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 font-semibold text-slate-900 flex items-center justify-between">
              <span>Company Tax Return (ITR14) Filing</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            </Link>
            <Link href="/sars-tax-number-query" className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 font-semibold text-slate-900 flex items-center justify-between">
              <span>How to Get Your SARS Tax Number</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            </Link>
            <Link href="/sars-tax-compliance-status-pin" className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 font-semibold text-slate-900 flex items-center justify-between">
              <span>Request &amp; Verify SARS TCS PIN</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            </Link>
            <Link href="/sars-online-query-system-guide" className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 font-semibold text-slate-900 flex items-center justify-between">
              <span>All SARS Online Queries (SOQS)</span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            </Link>
          </div>
        </section>

        {/* Expert CTA */}
        <SarsExpertCta
          title="Need Help Registering or Calculating Turnover Tax?"
          subtitle="Our registered SARS tax practitioners will evaluate if Turnover Tax is right for your business, complete your TT01 submission, and keep your micro-business 100% compliant."
        />
      </div>
    </main>
  );
}
