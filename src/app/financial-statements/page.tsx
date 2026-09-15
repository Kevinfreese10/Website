import { getStaticPageMetadata } from '@/lib/seo-utils';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import { BarChart3, ArrowRight, FileCheck, FileText, PenTool, BookOpen } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
    const defaults: Metadata = {
        title: 'Financial Statements & Reporting Services | My Accountant',
        description: 'Annual financial statements (AFS) prepared by qualified accountants. CIPC-compliant reporting for VAT & non-VAT registered businesses. Draft, review & sign-off services.',
    };
    return getStaticPageMetadata('financial-statements', defaults);
}

export default function FinancialStatementsPage() {
  const services = [
    {
      title: "AFS for VAT-Registered Businesses",
      description: "Full annual financial statements for VAT-registered companies, including income statements, balance sheets, notes, and directors' reports. Prepared in accordance with IFRS for SMEs or full IFRS as required, and ready for CIPC submission.",
      icon: FileCheck,
      link: "/products/annual-financial-statements-for-vat-registered-businesses",
    },
    {
      title: "AFS for Non-VAT Registered Businesses",
      description: "Streamlined annual financial statements for businesses that are not registered for VAT. We ensure your financials comply with the applicable reporting framework and are accepted by SARS, banks, and other stakeholders.",
      icon: FileText,
      link: "/products/annual-financial-statements-non-vat-registered",
    },
    {
      title: "Draft & Sign-Off Only",
      description: "Already have your bookkeeping done? We review your trial balance, prepare the annual financial statements, and provide an independent accountant's report and sign-off — ideal for businesses with in-house bookkeepers.",
      icon: PenTool,
      link: "/products/annual-financial-statements-draft-and-sign-off-only",
    },
    {
      title: "Annual Financial Statements Overview",
      description: "Learn more about our full range of financial statement services, including compilation reports, independent reviews, and audit-ready packages. We cater to companies of all sizes across every industry in South Africa.",
      icon: BookOpen,
      link: "/annual-financial-statements",
    },
  ];

  const faqs = [
    {
      q: "Who needs annual financial statements in South Africa?",
      a: "Every company registered with CIPC is required to prepare annual financial statements (AFS) within six months of its financial year-end, as stipulated by the Companies Act 71 of 2008. This applies to private companies (Pty Ltd), personal liability companies, non-profit companies, and state-owned companies. Close corporations must also prepare AFS under the Close Corporations Act. Even if a company is dormant, annual financial statements must still be prepared and kept on record for at least seven years.",
    },
    {
      q: "What is included in annual financial statements?",
      a: "A complete set of annual financial statements typically includes a statement of financial position (balance sheet), a statement of comprehensive income (income statement), a statement of changes in equity, a cash flow statement, and notes to the financial statements including accounting policies and explanatory information. For smaller entities reporting under IFRS for SMEs, certain components may be simplified. Additionally, a directors' report and an accountant's compilation or independent review report are usually required.",
    },
    {
      q: "What are the CIPC financial statement requirements?",
      a: "CIPC requires all registered companies to prepare annual financial statements in accordance with an appropriate financial reporting framework (IFRS, IFRS for SMEs, or the modified cash basis for qualifying entities). Companies with a Public Interest Score (PI Score) above 350 must have their financial statements audited, while those with a PI score between 100 and 350 must undergo an independent review. Companies below a PI score of 100 may opt for a compilation report by an independent accounting professional. Financial statements must be approved by the board of directors and kept available at the company's registered office.",
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
          <div className="h-16 w-16 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
            Financial Statements &amp; Reporting Services
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            CIPC-compliant annual financial statements prepared by qualified accountants. From draft to sign-off, we deliver accurate reporting that satisfies SARS, banks, and investors.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild size="lg" className="font-bold px-10 h-12">
              <Link href="/contact">Get Your Statements Prepared</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="font-bold h-12">
              <Link href="/products">View All Services</Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <TrustIndexWidget />
      </div>

      {/* Services Grid */}
      <section className="container mx-auto px-4 max-w-5xl space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Financial Statement Services</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service, i) => (
            <Card key={i} className="border shadow-sm border-border bg-card flex flex-col justify-between">
              <CardHeader className="space-y-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl font-bold">{service.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-slate-600 text-sm leading-relaxed space-y-4">
                <p>{service.description}</p>
                <Button asChild variant="link" className="px-0 text-primary">
                  <Link href={service.link}>Learn more <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Box */}
      <section className="container mx-auto px-4 max-w-4xl">
        <div className="bg-primary text-white p-8 lg:p-12 rounded-xl text-center space-y-6 shadow-xl">
          <h3 className="text-3xl font-bold">Compliant Financial Statements — Done Right</h3>
          <p className="text-white/80 max-w-xl mx-auto text-base">
            Whether you need a full set of IFRS financial statements or a simple compilation report, our team delivers accurate, CIPC-ready reports on time and within budget.
          </p>
          <Button asChild variant="secondary" size="lg" className="font-bold h-12 bg-white text-primary hover:bg-slate-100">
            <Link href="/contact">Get Your Statements Prepared <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Financial Statements FAQs</h2>
          <Separator className="w-16 mx-auto border-b-2 border-primary/20" />
        </div>

        <div className="w-full space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-border pb-6 last:border-0">
              <h3 className="text-lg font-bold text-foreground mb-2">
                {faq.q}
              </h3>
              <div className="text-slate-600 leading-relaxed">
                {faq.a}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
