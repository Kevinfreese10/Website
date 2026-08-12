import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { SITE_URL } from '@/lib/constants';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import ShareWidget from '@/components/blog/ShareWidget';

export const metadata: Metadata = {
  title: 'VAT Registration Threshold for SMEs in 2026 | My Accountant',
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
          <h2>Mandatory VAT Registration</h2>
          <p>
            In South Africa, any business that makes taxable supplies exceeding R1 million in any consecutive 12-month period is legally obligated to register for Value-Added Tax (VAT). Failing to register when you cross this threshold can result in substantial penalties and back-taxes being owed to SARS.
          </p>
          
          <h3>Voluntary Registration</h3>
          <p>
            If your taxable supplies exceed R50,000 in a 12-month period, you may choose to register for VAT voluntarily. This is often advantageous for B2B companies, as being VAT registered allows you to claim input VAT on your business expenses and makes your business appear more established to corporate clients.
          </p>

          <h2>The Registration Process in 2026</h2>
          <p>
            SARS has digitized much of the VAT registration process via eFiling. However, the supporting documentation required (proof of address, bank statements, representative details) is scrutinized closely to prevent VAT fraud. 
          </p>

          <div className="my-16 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 md:p-12 border shadow-2xl text-center relative overflow-hidden">
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white m-0">Need to Register for VAT?</h2>
              <p className="text-lg text-slate-300 font-medium">
                We handle VAT registrations seamlessly, ensuring you are fully compliant without the administrative headache.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
                <Button asChild size="lg" className="h-14 px-8 text-base font-bold shadow-xl bg-blue-600 hover:bg-blue-500 text-white w-full sm:w-auto">
                  <Link href="/products/vat-registration">Register Now</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </article>
    </>
  );
}
