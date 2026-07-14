import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import TaxReturnWizard from '@/components/tax/TaxReturnWizard';
import { FileText, Calculator, ShieldCheck, Target, ArrowRight, Building, Landmark } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Individual Income Tax Returns (ITR12) Services | My Accountant',
        description: 'Professional, affordable, and accurate Individual Income Tax Return (ITR12) filing in South Africa. Let our registered tax practitioners maximize your refund and ensure full SARS compliance.',
    };
    return getStaticPageMetadata('individual-tax-returns', defaults);
}

export default function IndividualTaxReturnsPage() {
  const faqs = [
    {
      q: "Who MUST submit an Income Tax Return (ITR12)?",
      a: "You must submit an ITR12 if you: earn more than the tax threshold for the year; have more than one employer or income source; run a business as a sole proprietor or freelancer; receive a travel allowance or use a company car; earned rental income; or want to claim deductions for medical aid or retirement annuities.",
    },
    {
      q: "Who DOES NOT need to submit an Income Tax Return?",
      a: "You do not need to submit a return if ALL of the following apply: your total salary for the year before tax is below R500,000; you only have ONE employer; you have no other sources of income (like rental, business, or freelance income); and you have no deductions to claim (like medical aid, retirement annuities, or travel expenses).",
    },
    {
      q: "What should I do if SARS has NOT issued me an Auto Assessment?",
      a: "If you have not received an SMS or email from SARS regarding an Auto Assessment, and you meet the criteria to file a return, you must manually compile and submit your ITR12 tax return via eFiling before the deadline. Do not wait for an auto-assessment that may never come, as you could incur late submission penalties. Use our wizard above to find the correct package to submit your return.",
    },
    {
      q: "What should I do if I HAVE been Auto Assessed?",
      a: "Do not blindly accept the Auto Assessment! SARS calculates this based on third-party data (banks, medical aids, employers) but often misses allowable deductions like home office expenses, travel logbooks, or donations. We highly recommend having a tax practitioner review your auto-assessment before you accept it. If we find missing deductions, we will file an amended return to maximize your refund.",
    },
    {
      q: "When is the SARS deadline for Individual Tax Returns?",
      a: "Tax season for individuals typically opens in July. Non-provisional taxpayers usually have until late October to submit via eFiling. Provisional taxpayers (those with business, rental, or freelance income) generally have until late January of the following year. Missing deadlines results in severe administrative penalties.",
    },
  ];

  return (
    <div className="space-y-16 pb-24 bg-background relative overflow-hidden">
      {/* Hero Section */}
      <section className="text-foreground py-20 lg:py-32 bg-background relative overflow-hidden">
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-blue w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container mx-auto px-4 text-center max-w-4xl space-y-6 relative z-10">
          <div className="inline-flex items-center rounded-full border bg-background/50 px-3 py-1 text-sm font-medium backdrop-blur-sm mb-4">
            <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            2026 Tax Season is Open
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Individual Tax Returns in South Africa
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Professional, hassle-free ITR12 submissions by registered tax practitioners. We ensure absolute SARS compliance while legally maximizing your tax refund.
          </p>

          {/* LOGO CREDIBILITY RIBBON */}
          <div className="mt-16 border-t border-slate-200 pt-8 relative z-10 hidden sm:block">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground text-center mb-6">
              Accredited Professional Memberships & Regulatory Compliance
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-70 hover:opacity-100 transition-opacity duration-300">
              {/* CIBA Badge */}
              <div className="flex items-center gap-2 text-foreground font-black tracking-tight text-sm">
                <div className="h-7 w-7 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center"><Building className="h-4 w-4 text-blue-500" /></div>
                <div className="flex flex-col text-left">
                  <span className="leading-none text-xs">CIBA Member</span>
                  <span className="text-[8px] text-muted-foreground font-medium">Biz Accountant</span>
                </div>
              </div>
              {/* SAIT Badge */}
              <div className="flex items-center gap-2 text-foreground font-black tracking-tight text-sm">
                <div className="h-7 w-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center"><Landmark className="h-4 w-4 text-emerald-500" /></div>
                <div className="flex flex-col text-left">
                  <span className="leading-none text-xs">SAIT Member</span>
                  <span className="text-[8px] text-muted-foreground font-medium">Tax Practitioner</span>
                </div>
              </div>
              {/* SAICA Badge */}
              <div className="flex items-center gap-2 text-foreground font-black tracking-tight text-sm">
                <div className="h-7 w-7 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center"><ShieldCheck className="h-4 w-4 text-indigo-500" /></div>
                <div className="flex flex-col text-left">
                  <span className="leading-none text-xs">SAICA Affiliate</span>
                  <span className="text-[8px] text-muted-foreground font-medium">Chartered Accounting</span>
                </div>
              </div>
              {/* SARS Badge */}
              <div className="flex items-center gap-2 text-foreground font-black tracking-tight text-sm">
                <div className="h-7 w-7 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-500">S</div>
                <div className="flex flex-col text-left">
                  <span className="leading-none text-xs">SARS Registered</span>
                  <span className="text-[8px] text-muted-foreground font-medium">Tax Practitioners</span>
                </div>
              </div>
              {/* CIPC Badge */}
              <div className="flex items-center gap-2 text-foreground font-black tracking-tight text-sm">
                <div className="h-7 w-7 rounded-md bg-purple-500/10 border border-purple-500/20 flex items-center justify-center"><Building className="h-4 w-4 text-purple-500" /></div>
                <div className="flex flex-col text-left">
                  <span className="leading-none text-xs">CIPC Agent</span>
                  <span className="text-[8px] text-muted-foreground font-medium">Company Registry</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 relative z-20 -mt-20 mb-12">
        <TrustIndexWidget />
      </div>

      {/* Interactive Wizard Section */}
      <section className="relative z-20 mb-12 px-4">
        <TaxReturnWizard />
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 max-w-5xl space-y-12 pt-10">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Why File Your Taxes With Us?</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg pt-2">
            Filing your own taxes can lead to missed deductions or costly SARS penalties. We take the stress out of tax season.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col items-center text-center">
             <div className="bg-primary/10 p-3 rounded-full mb-4">
               <ShieldCheck className="h-6 w-6 text-primary" />
             </div>
             <h3 className="font-semibold text-xl mb-2">100% SARS Compliant</h3>
             <p className="text-sm text-muted-foreground leading-relaxed">
               As registered tax practitioners, we ensure your return is submitted accurately and on time, protecting you from administrative penalties.
             </p>
          </div>
          
          <div className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col items-center text-center">
             <div className="bg-primary/10 p-3 rounded-full mb-4">
               <Target className="h-6 w-6 text-primary" />
             </div>
             <h3 className="font-semibold text-xl mb-2">Maximum Refunds</h3>
             <p className="text-sm text-muted-foreground leading-relaxed">
               We meticulously review your medical aid, retirement annuities, travel logbooks, and allowable expenses to ensure you get the maximum legal refund.
             </p>
          </div>

          <div className="bg-card p-6 rounded-2xl border shadow-sm flex flex-col items-center text-center">
             <div className="bg-primary/10 p-3 rounded-full mb-4">
               <FileText className="h-6 w-6 text-primary" />
             </div>
             <h3 className="font-semibold text-xl mb-2">Audit Protection</h3>
             <p className="text-sm text-muted-foreground leading-relaxed">
               If your return is selected for verification or audit by SARS, our experts will handle the submission of supporting documents and correspondence on your behalf.
             </p>
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section className="bg-muted/30 py-20 mt-20">
        <div className="container mx-auto px-4 max-w-3xl space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
            <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
          </div>

          <div className="grid gap-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-card p-6 rounded-2xl border shadow-sm">
                <h3 className="font-bold text-lg mb-3 flex items-start gap-3">
                  <span className="text-primary font-black">Q.</span>
                  {faq.q}
                </h3>
                <p className="text-muted-foreground leading-relaxed flex items-start gap-3">
                  <span className="text-muted-foreground/30 font-black">A.</span>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Bottom CTA */}
      <section className="container mx-auto px-4 max-w-4xl pt-10 text-center">
        <div className="bg-primary text-primary-foreground rounded-3xl p-10 md:p-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 opacity-20 pattern-diagonal-lines" />
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to submit your tax return?</h2>
            <p className="text-lg opacity-90 max-w-xl mx-auto">
              Scroll back up to our Tax Wizard, answer 2 quick questions, and let's get your ITR12 filed today.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
