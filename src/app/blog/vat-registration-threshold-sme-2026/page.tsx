import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { SITE_URL } from '@/lib/constants';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import ShareWidget from '@/components/blog/ShareWidget';

export const metadata: Metadata = {
  title: 'VAT Registration Threshold for SMEs in 2026',
  description: 'Understand the mandatory and voluntary VAT registration thresholds for South African SMEs in the 2026 tax year.',
  alternates: {
    canonical: `${SITE_URL}/blog/vat-registration-threshold-sme-2026`,
  },
};

export default function VatThresholdPage() {
  const title = "VAT Registration Threshold for SMEs in 2026";
  const excerpt = "Are you required to register for VAT? We breakdown the mandatory and voluntary VAT thresholds for 2026.";

  return (
    <>
      <section className="relative w-full bg-white border-b pt-20 pb-24 animate-in fade-in">
        <div className="absolute inset-0 bg-grid-slate-100/[0.04] bg-[size:20px_20px]" />
        
        <div className="container relative mx-auto px-4 max-w-4xl z-10">
          <div className="flex flex-col items-center text-center space-y-6">
            <Badge variant="secondary" className="uppercase tracking-widest font-extrabold bg-blue-50 text-blue-700 px-3 py-1">Business Tax</Badge>
            
            <h1 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl leading-tight text-slate-900">
              VAT Registration <span className="text-gradient bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Threshold 2026</span>
            </h1>
            
            <p className="max-w-2xl text-lg font-medium text-slate-600 md:text-xl leading-relaxed">
              {excerpt}
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-8 pt-8 border-t border-slate-200/60 w-full max-w-2xl">
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
        <ShareWidget postTitle={title} postSlug="vat-registration-threshold-sme-2026" />

        <div className="prose prose-lg md:prose-xl max-w-none prose-headings:font-headline prose-headings:font-black prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-blue-600">
          <h2>New South African VAT Registration Thresholds (Effective 1 April 2026)</h2>
          <p>
            South Africa’s Value-Added Tax (VAT) registration thresholds have officially increased with effect from <strong>1 April 2026</strong>. The South African Revenue Service (SARS) is already actively administering all VAT registrations under these new statutory thresholds.
          </p>

          <div className="my-8 overflow-x-auto">
            <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <thead className="bg-slate-100 text-slate-800 text-sm font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4 border-b border-slate-200">VAT Registration Category</th>
                  <th className="p-4 border-b border-slate-200">Old Threshold</th>
                  <th className="p-4 border-b border-slate-200 text-blue-700">New Threshold (From 1 April 2026)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-700 text-base">
                <tr className="hover:bg-slate-50">
                  <td className="p-4 font-semibold text-slate-900">Compulsory VAT Registration</td>
                  <td className="p-4 text-slate-500 line-through">R1,000,000</td>
                  <td className="p-4 font-bold text-emerald-600">R2,300,000</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-4 font-semibold text-slate-900">Voluntary VAT Registration</td>
                  <td className="p-4 text-slate-500 line-through">R50,000</td>
                  <td className="p-4 font-bold text-emerald-600">R120,000</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>1. Compulsory VAT Registration — R2.3 Million</h2>
          <p>
            A business is legally required to register for VAT where the total value of its <strong>taxable supplies (turnover)</strong> exceeds <strong>R2.3 million</strong> in any consecutive 12-month period, or where it enters into a written contractual agreement that will cause taxable supplies to exceed R2.3 million within 12 months.
          </p>
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg my-6 text-amber-900 text-base">
            <strong>Important Note:</strong> This threshold applies strictly to <em>taxable turnover (gross sales)</em>, not net business profit. Crossing R2.3m triggers mandatory registration within 21 days of the month-end.
          </div>

          <h2>2. Voluntary VAT Registration — R120,000</h2>
          <p>
            If your business has not reached the compulsory threshold of R2.3 million, you may still choose to apply for <strong>voluntary VAT registration</strong> once your taxable supplies exceed <strong>R120,000</strong> in a 12-month period.
          </p>
          <p>
            Voluntary registration offers major commercial advantages, especially for B2B enterprises, allowing you to claim back 15% input VAT on operational expenses, capital equipment, and stock, while enhancing commercial credibility with corporate clients and government tenders.
          </p>

          <h2>3. Existing VAT Vendors with Turnover Below R2.3 Million</h2>
          <p>
            This is critical for existing business owners: If your company is already registered for VAT and your annual turnover is currently below the new compulsory threshold (e.g. R1.5 million), <strong>your VAT registration is NOT automatically cancelled</strong>.
          </p>
          <ul>
            <li><strong>Option A (Remain Registered):</strong> Continue submitting bi-monthly VAT201 returns, claiming input VAT, and charging 15% VAT on invoices.</li>
            <li><strong>Option B (Apply for Deregistration):</strong> You may choose to apply to SARS for voluntary deregistration if administrative overhead outweighs your input tax benefits.</li>
          </ul>

          <h2>4. Important Caution: Exit VAT on Deregistration</h2>
          <p>
            Deregistering from VAT requires careful tax planning. Under Section 8(2) of the VAT Act, when a vendor deregisters, SARS levies <strong>Exit VAT (Output Tax)</strong> on the lesser of the original cost or the open market value of all assets and trading stock held immediately prior to deregistration on which input VAT was previously claimed.
          </p>

          <div className="my-16 bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-8 md:p-12 border shadow-2xl text-center relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white m-0">Need Help with VAT Registration or Assessment?</h2>
              <p className="text-lg text-slate-300 font-medium">
                Our qualified Tax Practitioners and Chartered Business Accountants handle fast, compliant SARS VAT registrations and deregistration assessments online.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                <Button asChild size="lg" className="h-14 px-8 text-base font-bold shadow-xl bg-blue-600 hover:bg-blue-500 text-white w-full sm:w-auto">
                  <Link href="/products/vat-registration">Register for VAT Online (R1,400)</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
