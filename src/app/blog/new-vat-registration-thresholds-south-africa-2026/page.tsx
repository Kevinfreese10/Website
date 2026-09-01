import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, FileText, HelpCircle } from 'lucide-react';
import { SITE_URL } from '@/lib/constants';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import ShareWidget from '@/components/blog/ShareWidget';

export const metadata: Metadata = {
  title: 'New VAT Registration Thresholds in South Africa (Effective 1 April 2026) | My Accountant',
  description: 'South Africa’s VAT thresholds increased: Compulsory registration is now R2.3 Million and Voluntary is R120,000. Learn how this impacts your business, existing registrations, and exit tax rules.',
  alternates: {
    canonical: `${SITE_URL}/blog/new-vat-registration-thresholds-south-africa-2026`,
  },
  openGraph: {
    title: 'New South African VAT Registration Thresholds (Effective 1 April 2026)',
    description: 'Compulsory VAT registration is now R2.3M and Voluntary is R120k. Complete guide for South African SMEs by qualified accountants.',
    url: `${SITE_URL}/blog/new-vat-registration-thresholds-south-africa-2026`,
    siteName: 'My Accountant',
    type: 'article',
  }
};

export default function NewVatThresholds2026Page() {
  const title = "New South African VAT Registration Thresholds (Effective 1 April 2026)";
  const excerpt = "South Africa’s Value-Added Tax (VAT) registration thresholds have officially increased: Compulsory is now R2.3 Million and Voluntary is R120,000. Here is everything your business needs to know.";

  return (
    <>
      <section className="relative w-full bg-slate-900 text-white border-b pt-20 pb-24 animate-in fade-in overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-700/[0.1] bg-[size:20px_20px]" />
        
        <div className="container relative mx-auto px-4 max-w-4xl z-10">
          <div className="flex flex-col items-center text-center space-y-6">
            <Badge variant="secondary" className="uppercase tracking-widest font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3.5 py-1">
              Official Tax Update · 2026
            </Badge>
            
            <h1 className="text-3xl font-black tracking-tight md:text-5xl lg:text-6xl leading-tight text-white">
              New South African <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">VAT Registration Thresholds</span>
            </h1>
            
            <p className="max-w-2xl text-lg font-medium text-slate-300 md:text-xl leading-relaxed">
              {excerpt}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8 pt-8 border-t border-slate-800 w-full max-w-2xl text-sm font-semibold text-slate-400">
              <span>Effective 1 April 2026</span>
              <span className="h-1 w-1 rounded-full bg-slate-600 hidden sm:inline" />
              <span>Authored by Kevin Freese (CIBA, SAIT)</span>
              <span className="h-1 w-1 rounded-full bg-slate-600 hidden sm:inline" />
              <span className="flex items-center"><Clock className="h-4 w-4 mr-1.5 text-blue-400" /> 6 min read</span>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full pt-8 pb-4">
        <TrustIndexWidget />
      </div>

      <article className="container mx-auto max-w-4xl px-4 pb-16 mt-4">
        <ShareWidget postTitle={title} postSlug="new-vat-registration-thresholds-south-africa-2026" />

        <div className="prose prose-lg md:prose-xl max-w-none prose-headings:font-headline prose-headings:font-black prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-blue-600">
          
          <p className="lead text-xl text-slate-800 font-medium">
            South Africa’s Value-Added Tax (VAT) registration thresholds have officially increased with effect from <strong>1 April 2026</strong>. The South African Revenue Service (SARS) is already administering all new registrations under these updated statutory limits.
          </p>

          <div className="my-10 overflow-x-auto not-prose">
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-lg bg-white">
              <div className="bg-slate-900 text-white px-6 py-4">
                <h3 className="text-lg font-bold">Summary: VAT Registration Threshold Changes</h3>
              </div>
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4 sm:p-5">Registration Type</th>
                    <th className="p-4 sm:p-5">Previous Threshold</th>
                    <th className="p-4 sm:p-5 text-blue-700">New Threshold (From 1 April 2026)</th>
                    <th className="p-4 sm:p-5">Measurement Basis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-sm sm:text-base font-medium">
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 sm:p-5 font-bold text-slate-900">
                      Compulsory VAT Registration
                    </td>
                    <td className="p-4 sm:p-5 text-slate-400 line-through">
                      R1,000,000
                    </td>
                    <td className="p-4 sm:p-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        R2,300,000
                      </span>
                    </td>
                    <td className="p-4 sm:p-5 text-slate-600 text-xs sm:text-sm">
                      Taxable supplies in consecutive 12 months (or contractual obligation)
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 sm:p-5 font-bold text-slate-900">
                      Voluntary VAT Registration
                    </td>
                    <td className="p-4 sm:p-5 text-slate-400 line-through">
                      R50,000
                    </td>
                    <td className="p-4 sm:p-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-black bg-blue-100 text-blue-800 border border-blue-300">
                        R120,000
                      </span>
                    </td>
                    <td className="p-4 sm:p-5 text-slate-600 text-xs sm:text-sm">
                      Taxable supplies exceeding R120k in 12 months with commercial trading proofs
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <h2>1. Compulsory Registration — R2.3 Million</h2>
          <p>
            Under the Value-Added Tax Act No. 89 of 1991 (as amended), a person or legal entity carrying on an enterprise is legally required to register for VAT where:
          </p>
          <ul>
            <li>The total value of taxable supplies (turnover) made in the course of that enterprise has exceeded <strong>R2.3 million (R2,300,000)</strong> in any preceding consecutive period of 12 months; OR</li>
            <li>There are reasonable grounds (such as a signed, written contractual obligation) to believe that the total value of taxable supplies will exceed <strong>R2.3 million</strong> in the next 12 consecutive months.</li>
          </ul>

          <div className="bg-amber-50 border-l-4 border-amber-500 p-5 rounded-r-xl my-6 not-prose">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-900 text-base m-0">Turnover vs. Net Profit</h4>
                <p className="text-amber-800 text-sm mt-1 m-0">
                  <strong>Important:</strong> This limit is determined strictly by <strong>taxable supplies (turnover/revenue)</strong>, NOT business profit. If your gross sales cross R2.3 million in any rolling 12-month period, you have <strong>21 business days</strong> from the end of that month to apply to SARS for compulsory registration.
                </p>
              </div>
            </div>
          </div>

          <h2>2. Voluntary Registration — R120,000</h2>
          <p>
            If your business has not reached the compulsory threshold of R2.3 million, you may still choose to apply for <strong>voluntary VAT registration</strong> once your taxable supplies exceed <strong>R120,000</strong> in a 12-month period.
          </p>
          <p>
            Voluntary registration offers major commercial advantages, particularly for business-to-business (B2B) suppliers, contractors, and service providers:
          </p>
          <ul>
            <li><strong>Input Tax Recovery:</strong> You can claim back the 15% VAT paid on operational expenses, professional tools, vehicles, software, and stock.</li>
            <li><strong>Corporate Tender Eligibility:</strong> Large corporate clients and municipal tenders frequently require valid VAT vendor certificates to award contracts.</li>
            <li><strong>Commercial Credibility:</strong> Displays established scale and institutional maturity.</li>
          </ul>

          <h2>3. Existing VAT Vendors with Turnover Below R2.3 Million</h2>
          <p>
            This is one of the most critical considerations for existing clients and business owners: If your company is already registered for VAT and its turnover is between R120,000 and R2.3 million (e.g. R1.5 million), <strong>your VAT registration is NOT automatically cancelled</strong>.
          </p>
          <p>
            You have two clear paths:
          </p>
          <ul>
            <li>
              <strong>Option 1 — Remain VAT Registered:</strong> You may continue operating as a registered vendor, submitting your bi-monthly VAT201 returns, claiming input tax deductions, and issuing tax invoices.
            </li>
            <li>
              <strong>Option 2 — Apply for Voluntary Deregistration:</strong> If your customers are retail consumers (B2C) who cannot claim input tax, or if the administrative compliance burden outweighs your input tax recoveries, you can apply to SARS for voluntary deregistration.
            </li>
          </ul>

          <h2>4. Important Caution: Exit VAT on Deregistration</h2>
          <p>
            Deregistering from VAT requires careful calculation and tax advisory. Under <strong>Section 8(2) of the VAT Act</strong>, when a vendor ceases to be registered, SARS treats this as a deemed supply:
          </p>
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-5 my-6 text-slate-800 text-base">
            <p className="m-0 font-medium">
              <strong>Exit Tax Formula:</strong> You are liable to pay <strong>Output VAT (15%)</strong> on the lesser of the original cost price or the open market value of all capital assets, vehicles, machinery, and trading stock held immediately prior to deregistration on which input tax was previously claimed.
            </p>
          </div>
          <p>
            Before applying for deregistration, always request a comprehensive Exit Tax calculation from your accountant to ensure there are no unexpected cash-flow liabilities.
          </p>

          <h2>5. Step-by-Step VAT Registration Process with SARS</h2>
          <p>
            SARS reviews all new VAT registrations with strict compliance verification to eliminate fraudulent VAT refunds. Key prerequisites required include:
          </p>
          <ol>
            <li><strong>Proof of Bank Account:</strong> Stamped bank statement or letter not older than 3 months matching registered CIPC company name.</li>
            <li><strong>Proof of Address:</strong> Utility bill or valid lease agreement for the enterprise’s business premises.</li>
            <li><strong>Representative Identification:</strong> Certified ID copy and SARS Public Officer appointment verification.</li>
            <li><strong>Commercial Invoices & Proof of Turnover:</strong> Issued sales invoices and matching bank statement credits demonstrating taxable supplies exceeding R120,000 (for voluntary registration) or exceeding R2.3M / signed contract (for compulsory).</li>
          </ol>

          <div className="my-16 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 border shadow-2xl text-center relative overflow-hidden not-prose">
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                <ShieldCheck className="h-4 w-4 text-blue-400" /> Fast Online Service
              </span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white m-0">
                Need Fast, Compliant VAT Registration?
              </h2>
              <p className="text-lg text-slate-300 font-medium">
                Our qualified Tax Practitioners and Chartered Business Accountants handle your full SARS VAT application, Public Officer verification, and VAT201 filing online.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Button asChild size="lg" className="h-14 px-8 text-base font-bold shadow-xl bg-blue-600 hover:bg-blue-500 text-white w-full sm:w-auto">
                  <Link href="/products/vat-registration">
                    Register for VAT Online — R1,400 <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-14 px-8 text-base font-bold bg-transparent text-white border-slate-600 hover:bg-slate-800 w-full sm:w-auto">
                  <Link href="/calculators/vat-calculator">
                    Free VAT Calculator
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <h2>Frequently Asked Questions</h2>
          <div className="space-y-4 not-prose mt-6">
            <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm">
              <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2 m-0">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                When did the new R2.3M VAT threshold take effect?
              </h4>
              <p className="text-slate-600 text-sm mt-2 m-0 leading-relaxed">
                The new VAT registration thresholds took effect on <strong>1 April 2026</strong>. SARS is actively assessing and issuing all new VAT registrations based on R2,300,000 (compulsory) and R120,000 (voluntary).
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm">
              <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2 m-0">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                Do I have to deregister if my turnover is below R2.3 Million?
              </h4>
              <p className="text-slate-600 text-sm mt-2 m-0 leading-relaxed">
                No. You are permitted to maintain your active VAT vendor status. Deregistration is entirely voluntary for businesses with turnover between R120,000 and R2.3M.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm">
              <h4 className="font-bold text-slate-900 text-lg flex items-center gap-2 m-0">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                How long does a SARS VAT registration take?
              </h4>
              <p className="text-slate-600 text-sm mt-2 m-0 leading-relaxed">
                Once all required proofs (bank confirmation, lease agreement, representative docs, and trading invoices) are submitted, SARS typically issues the VAT Notice of Registration within <strong>3 to 7 business days</strong>.
              </p>
            </div>
          </div>

        </div>
      </article>
    </>
  );
}
