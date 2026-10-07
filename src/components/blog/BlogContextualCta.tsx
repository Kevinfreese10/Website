import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  ArrowRight, 
  Calculator, 
  Building2, 
  FileCheck2, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface BlogContextualCtaProps {
  slug: string;
}

const TAX_NUMBER_SLUG = 'find-your-south-african-tax-reference-number-quick-guide';
const START_BUSINESS_SLUG = 'start-a-business-in-sa-for-under-r500-your-guide';
const NCR_SLUGS = new Set([
  'ncr-registration-your-key-to-sa-credit-compliance',
  'ncr-registration-your-essential-guide-in-south-africa',
]);

/**
 * Returns whether a blog slug has a dedicated high-converting contextual CTA.
 */
export function hasContextualCta(slug: string): boolean {
  return (
    slug === TAX_NUMBER_SLUG ||
    slug === START_BUSINESS_SLUG ||
    NCR_SLUGS.has(slug) ||
    slug.startsWith('ncr-registration')
  );
}

export default function BlogContextualCta({ slug }: BlogContextualCtaProps) {
  if (slug === TAX_NUMBER_SLUG) {
    return (
      <div 
        data-testid="blog-contextual-cta"
        className="my-12 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 md:p-8 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mt-6 -mr-6 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-400 inline" />
              SARS Compliance Next Steps
            </Badge>
          </div>

          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white font-headline">
            Found Your Tax Number? Fast-Track Your SARS Compliance
          </h2>

          <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-3xl">
            Need an official Tax Clearance Certificate (TCS PIN) for tenders or employment, or need to file your overdue ITR12 tax return? Our registered tax practitioners handle it 100% online in 24 hours.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-3">
            <Button
              asChild
              size="lg"
              className="h-13 px-6 text-base font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950 transition-all"
            >
              <Link href="/products/tax-clearance-certificate">
                Get Tax Clearance PIN (R350)
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-13 px-6 text-base font-bold bg-white/10 hover:bg-white/20 border-white/25 text-white transition-all backdrop-blur-sm"
            >
              <Link href="/products/individual-income-tax-return-itr12-simple">
                File ITR12 Tax Return (R750)
                <FileCheck2 className="ml-2 h-4 w-4 text-emerald-400" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (slug === START_BUSINESS_SLUG) {
    return (
      <div 
        data-testid="blog-contextual-cta"
        className="my-12 rounded-2xl border-2 border-blue-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 md:p-8 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mt-6 -mr-6 h-36 w-36 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 font-bold text-xs uppercase tracking-wider">
              <Building2 className="mr-1.5 h-3.5 w-3.5 text-blue-400 inline" />
              CIPC Company Registration
            </Badge>
          </div>

          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white font-headline">
            Ready to Make Your Business Official?
          </h2>

          <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-3xl">
            Take your business from idea to official registered entity. Get your official CIPC Registration, COR14.3, Share Certificates, B-BBEE Affidavit, and SARS Tax Number in 2-3 business days.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-3">
            <Button
              asChild
              size="lg"
              className="h-13 px-6 text-base font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950 transition-all"
            >
              <Link href="/products/private-company-registration">
                Register Company (R950)
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-13 px-6 text-base font-bold bg-white/10 hover:bg-white/20 border-white/25 text-white transition-all backdrop-blur-sm"
            >
              <Link href="/products/tender-ready-company-registration-package">
                Tender Ready Package (R1,600)
                <Sparkles className="ml-2 h-4 w-4 text-blue-400" />
              </Link>
            </Button>
          </div>

          <div className="pt-2">
            <Link 
              href="/company-registration"
              className="inline-flex items-center text-sm font-semibold text-blue-300 hover:text-blue-200 underline underline-offset-4"
            >
              Explore Company Registration Guide
              <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (NCR_SLUGS.has(slug) || slug.startsWith('ncr-registration')) {
    return (
      <div 
        data-testid="blog-contextual-cta"
        className="my-12 rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 md:p-8 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 -mt-6 -mr-6 h-36 w-36 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 font-bold text-xs uppercase tracking-wider">
              <Calculator className="mr-1.5 h-3.5 w-3.5 text-amber-400 inline" />
              NCR Compliance & Registration
            </Badge>
          </div>

          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white font-headline">
            Calculate Fees & Register with the National Credit Regulator
          </h2>

          <p className="text-slate-300 text-base md:text-lg leading-relaxed max-w-3xl">
            Avoid costly application rejections. Calculate your exact 2026 NCR statutory fees using our free calculator, or let our compliance specialists prepare and lodge your complete NCR Form 2 pack.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-3">
            <Button
              asChild
              size="lg"
              className="h-13 px-6 text-base font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950 transition-all"
            >
              <Link href="/calculators/ncr-registration-fee">
                Calculate NCR Fees (Free)
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-13 px-6 text-base font-bold bg-white/10 hover:bg-white/20 border-white/25 text-white transition-all backdrop-blur-sm"
            >
              <Link href="/products/ncr-registration">
                Apply for NCR Registration (R1,400)
                <ShieldCheck className="ml-2 h-4 w-4 text-amber-400" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
