import { Metadata } from 'next';
import { Search, CheckCircle2, FileText, UserCheck, ShieldCheck, HelpCircle, Calculator, Percent } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "SARS Turnover Tax Registration & Tax Rate Guide | Micro-Business Tax",
  description: "Complete guide to SARS Turnover Tax registration for South African micro-businesses with turnover under R1 million. Calculate rates, download TT01 form, and apply online.",
  alternates: {
    canonical: `${SITE_URL}/sars-turnover-tax-registration`,
  },
  openGraph: {
    title: "SARS Turnover Tax Registration & Tax Rate Guide | My Accountant",
    description: "Learn how Turnover Tax works in SA. Qualifying criteria, tax tables (0% up to R335k), TT01 application steps, and expert assistance.",
    url: `${SITE_URL}/sars-turnover-tax-registration`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "SARS Turnover Tax Guide" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Check Eligibility Criteria", detail: "Ensure your annual business turnover is R1 million or less and that your business is not a professional service company (like law or accounting firms) or public company." },
  { step: "Step 2", title: "Complete SARS TT01 Registration Form", detail: "Download the official TT01 Application for Registration for Turnover Tax form from the SARS website." },
  { step: "Step 3", title: "Submit Application Before Tax Year Starts", detail: "New businesses can register within 2 months of starting. Existing businesses must submit the TT01 form before the beginning of the tax year (28/29 February)." },
  { step: "Step 4", title: "SARS Profile Verification", detail: "SARS will update your tax reference profile on eFiling to reflect Turnover Tax status (Category TT)." },
  { step: "Step 5", title: "Submit TT02 Returns & TT03 Annual Reconciliations", detail: "Pay interim Turnover Tax payments twice a year (TT02 in August and February) and submit your annual final return (TT03)." },
];

const faqs = [
  { question: "What is SARS Turnover Tax?", answer: "Turnover Tax is a simplified, elective tax system for South African micro-businesses with a qualifying annual turnover of R1 million or less. It replaces Income Tax, VAT, Provisional Tax, and Capital Gains Tax with a single, low-rate tax on gross revenue." },
  { question: "What are the SARS Turnover Tax rates?", answer: "For the tax year: R0 - R335,000 is 0%; R335,001 - R500,000 is 1% of amount over R335k; R500,001 - R750,000 is R1,650 + 2% of amount over R500k; R750,001 - R1,000,000 is R6,650 + 3% of amount over R750k." },
  { question: "Can a company registered for Turnover Tax also register for VAT?", answer: "Turnover Tax replaces VAT by default. However, micro-businesses registered for Turnover Tax may elect to voluntarily register for VAT provided they meet standard VAT requirements." },
  { question: "When is the deadline to register for Turnover Tax?", answer: "Existing businesses must apply before the start of the new tax year (by 28/29 February). Newly established micro-businesses can register within 2 months from the date business activities commenced." },
];

export default function SarsTurnoverTaxRegistrationPage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <PageHero
        title="SARS Turnover Tax Registration & Guide"
        subtitle="Simplified, low-rate tax for South African micro-businesses with annual turnover of R1 million or less."
        badge="SARS Official Query Guide"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        <TrustIndexWidget />

        <SarsOfficialLinkBox
          queryTitle="SARS Turnover Tax Portal & TT01 Forms"
          officialUrl="https://www.sars.gov.za/types-of-tax/turnover-tax/"
          description="Access official SARS Turnover Tax information, download TT01 registration forms, and manage your micro-business tax profile online via SARS eFiling or SOQS."
        />

        {/* Overview & Tax Rates Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="border border-slate-200/80 shadow-sm bg-white rounded-2xl">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Percent className="w-5 h-5 text-blue-600" />
                How Turnover Tax Works
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 text-sm text-slate-600 leading-relaxed">
              <p>
                Turnover Tax is designed by SARS to reduce administrative friction and bookkeeping costs for micro-businesses with annual gross revenue of <strong>R1 million or less</strong>.
              </p>
              <ul className="space-y-2 list-disc pl-5">
                <li><strong>Replaces multiple taxes:</strong> Combines Income Tax, VAT, Provisional Tax, and CGT into one single tax payment.</li>
                <li><strong>Taxed on Revenue, not Profit:</strong> You pay tax on gross turnover rather than taxable income, eliminating complex expense deductions.</li>
                <li><strong>Reduced Compliance Costs:</strong> Requires minimal record-keeping (only records of income, dividends, and asset liabilities).</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border border-slate-200/80 shadow-sm bg-white rounded-2xl">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Calculator className="w-5 h-5 text-blue-600" />
                SARS Turnover Tax Rates
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
                      <td className="p-2.5 font-medium">R0 – R335,000</td>
                      <td className="p-2.5 text-emerald-700 font-bold">0% (Tax Free)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">R335,001 – R500,000</td>
                      <td className="p-2.5">1% of amount above R335,000</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">R500,001 – R750,000</td>
                      <td className="p-2.5">R1,650 + 2% of amount above R500,000</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">R750,001 – R1,000,000</td>
                      <td className="p-2.5">R6,650 + 3% of amount above R750,000</td>
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
            <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">TT01 Application</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {diySteps.map((step, idx) => (
              <Card key={idx} className="border border-slate-200/80 shadow-sm bg-white rounded-2xl hover:border-blue-300 transition-all">
                <CardContent className="p-6 space-y-3">
                  <span className="text-xs font-black uppercase text-blue-600 tracking-wider">{step.step}</span>
                  <h3 className="font-bold text-slate-900 text-base">{step.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{step.detail}</p>
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
              <Card key={idx} className="border border-slate-200/80 shadow-sm bg-white rounded-2xl">
                <CardContent className="p-6 space-y-2">
                  <h3 className="font-bold text-slate-900 text-base">{faq.question}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
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
