import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Landmark, ShieldCheck, PieChart } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import Script from 'next/script';
import { KEVIN_FREESE_PROFILE_IMAGE } from '@/lib/constants';


export const revalidate = 3600;


export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Annual Financial Statements (AFS) | My Accountant',
        description: 'Professional preparation of IFRS-compliant Annual Financial Statements for South African companies and trusts.',
    };
    return getStaticPageMetadata('annual-financial-statements', defaults);
}

export default function AnnualFinancialStatementsPage() {
  const steps = [
    { title: 'IFRS Compliance', description: 'Ensure your financials adhere to the latest reporting standards.', icon: ShieldCheck },
    { title: 'Audit Readiness', description: 'Prepare for independent review or full audit with clean, structured data.', icon: FileText },
    { title: 'Tax Alignment', description: 'Sync your accounting profit with your SARS taxable income requirements.', icon: Landmark },
    { title: 'Stakeholder Confidence', description: 'Present professional financials to banks, investors, and CIPC.', icon: PieChart },
  ];

  const afsFaqs = [
    {
      q: "What are Annual Financial Statements (AFS)?",
      a: "Annual Financial Statements are a formal record of a business's financial activities over a 12-month period, prepared in accordance with IFRS or IFRS for SMEs. They include a Balance Sheet, Income Statement, Cash Flow Statement, and notes to the financial statements."
    },
    {
      q: "Is it compulsory to prepare Annual Financial Statements in South Africa?",
      a: "Yes. Under Section 30 of the South African Companies Act, all registered companies must prepare Annual Financial Statements within 6 months after the end of their financial year."
    },
    {
      q: "What is a Public Interest Score (PIS) and why does it matter?",
      a: "The Public Interest Score determines whether your company requires its financial statements to be audited, independently reviewed, or simply compiled. It is calculated annually based on turnover, number of employees, third-party liabilities, and number of shareholders."
    },
    {
      q: "How long does it take to prepare Annual Financial Statements?",
      a: "Our typical turnaround time for preparing standard, IFRS-compliant Annual Financial Statements is 7 to 10 working days, provided all financial records and bank statements are complete."
    }
  ];

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": afsFaqs.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a
      }
    }))
  };

  return (
    <div className="space-y-16 pb-16 bg-background relative overflow-hidden">
      <Script
        id="afs-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="relative w-full overflow-hidden pt-16 lg:pt-24 pb-20 text-center bg-background">
        {/* Aurora background blobs */}
        <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
        <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
        <div className="aurora-blob aurora-blue w-[300px] h-[300px] bottom-0 left-1/3 animate-aurora-drift" style={{ animationDelay: '-10s' }} />
        {/* Dot grid overlay */}
        <div className="absolute inset-0 bg-dot-grid" />

        <div className="container relative z-10 mx-auto px-4">
          <h1 className="mb-6 text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-center text-hero-gradient pb-2">
            <span className="text-gradient">Annual Financial Statements</span>
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl font-medium text-muted-foreground max-w-3xl mx-auto">
            Accurate, compliant, and ready for review. We help South African companies and trusts finalize their year-end financial reporting with precision.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center pt-8">
            <Button asChild size="lg" className="font-bold px-10 shadow-xl">
                <Link href="/contact">Request an AFS Quote</Link>
            </Button>
          </div>
        </div>
      </section>

      <TrustIndexWidget />

      {/* Key AFS Statistics */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-10 bg-slate-50 rounded-3xl border border-slate-100 p-8 shadow-sm text-center max-w-4xl mx-auto">
          <div className="space-y-2">
            <p className="text-4xl md:text-5xl font-black text-primary">1,500+</p>
            <p className="text-sm font-bold text-foreground/80">AFS Compiled</p>
            <p className="text-xs text-muted-foreground leading-normal">Compiled for South African close corporations, private companies, and trusts.</p>
          </div>
          <div className="space-y-2">
            <p className="text-4xl md:text-5xl font-black text-primary">100%</p>
            <p className="text-sm font-bold text-foreground/80">SARS & CIPC Acceptance</p>
            <p className="text-xs text-muted-foreground leading-normal">Perfect submission record without compliance flags or rejections.</p>
          </div>
          <div className="space-y-2">
            <p className="text-4xl md:text-5xl font-black text-primary">R50M+</p>
            <p className="text-sm font-bold text-foreground/80">Business Funding Enabled</p>
            <p className="text-xs text-muted-foreground leading-normal">Compliant financials utilized by clients to secure bank loans and investor funding.</p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Standard-Setting Year-End Support</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Our accountants ensure your annual reporting is correct and compliant with the Companies Act.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="glass-card shadow-sm h-full">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg font-bold">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Public Interest Score & Reporting Table */}
      <section className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-foreground tracking-tight">South African Company Reporting Requirements</h2>
            <p className="text-sm text-muted-foreground font-semibold">Determine the statutory reporting standard required for your entity based on its Public Interest Score (PIS).</p>
          </div>
          
          <div className="overflow-x-auto rounded-2xl border shadow-sm">
            <table className="w-full border-collapse bg-white text-left text-sm text-foreground/80">
              <thead className="bg-slate-50 text-foreground">
                <tr className="border-b">
                  <th className="px-6 py-4 font-bold">Public Interest Score (PIS)</th>
                  <th className="px-6 py-4 font-bold">Audit vs. Review Requirement</th>
                  <th className="px-6 py-4 font-bold">Applicable Financial Framework</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-semibold text-foreground">Under 100 points</td>
                  <td className="px-6 py-4">No audit or review required (Compilation report only).</td>
                  <td className="px-6 py-4">IFRS for SMEs or Entity-Specific Framework</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-semibold text-foreground">100 - 349 points (independently prepared)</td>
                  <td className="px-6 py-4">Independent Review by a qualified external practitioner.</td>
                  <td className="px-6 py-4">IFRS for SMEs</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-semibold text-foreground">100 - 349 points (internally prepared)</td>
                  <td className="px-6 py-4">Compulsory Statutory Audit.</td>
                  <td className="px-6 py-4">IFRS or IFRS for SMEs</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-semibold text-foreground">350 points and above</td>
                  <td className="px-6 py-4">Compulsory Statutory Audit.</td>
                  <td className="px-6 py-4">Full IFRS</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Expert AFS Quote */}
      <section className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto p-8 border-l-4 border-primary bg-primary/5 rounded-r-2xl text-left">
          <span className="text-5xl text-primary/30 font-serif leading-none block -mt-4 -ml-2">“</span>
          <p className="text-lg font-medium text-foreground/90 italic leading-relaxed">
            "Accurate annual financial statements are more than just a CIPC or SARS compliance requirement. They are the ultimate health check for your business, and the first document that banks, lenders, and investors demand. A clean, professionally compiled set of financials is the key to unlocking corporate finance in South Africa."
          </p>
          <div className="mt-6 flex items-center gap-4">
            <img
              src={KEVIN_FREESE_PROFILE_IMAGE}
              alt="Kevin Freese - Managing Director"
              className="h-14 w-14 rounded-full object-cover border-2 border-primary/20 shadow-sm shrink-0"
            />
            <div>
              <h4 className="text-base font-black text-foreground leading-tight">Kevin Freese</h4>
              <p className="text-xs text-muted-foreground font-semibold">
                Managing Director, Registered Tax Practitioner (SARS ID: PR-0098553)
              </p>
              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                CIBA SBA Practitioner (CIBA201509-5372) | SAIT General Tax Practitioner (SAIT47011519)
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section className="container mx-auto px-4 max-w-4xl">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black tracking-tight text-foreground text-center">Frequently Asked Questions</h2>
            <p className="text-sm text-muted-foreground font-semibold text-center">Important details on annual financial statement compliance.</p>
          </div>
          
          <div className="w-full space-y-6">
          {afsFaqs.map((faq, index) => (
            <div key={index} className="border-b border-border pb-6 last:border-0">
              <h3 className="text-lg font-bold text-foreground mb-2">
                {faq.q}
              </h3>
              <div className="text-slate-600 leading-relaxed">
                {faq.a}
              </div>
            </div>
          ))}
        </div>
        </div>
      </section>

      <section className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto p-12 rounded-3xl glass-card border shadow-sm">
            <h2 className="text-3xl font-bold">Close Your Year with Peace of Mind</h2>
            <p className="text-lg text-muted-foreground mt-4 leading-relaxed">
                Whether you need financials for a bank loan application, CIPC compliance, or shareholder review, we deliver accurate statements you can rely on.
            </p>
            <Button asChild size="lg" className="mt-8 shadow-lg font-bold">
                <Link href="/contact">Talk to a Specialist</Link>
            </Button>
        </div>
      </section>
    </div>
  );
}
