import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Building2, 
  Users, 
  FileText, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  AlertTriangle,
  Receipt,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'NBC Provident Fund Employer Guide (2026)',
  description: 'Step-by-step guide to National Bargaining Council (NBC) Provident Fund employer registration in SA: compliance rules, documents, levies, and online filing.',
  alternates: {
    canonical: `${SITE_URL}/nbc-provident-fund-guide`,
  },
  openGraph: {
    title: 'NBC Provident Fund Employer Guide (2026) | My Accountant',
    description: 'Step-by-step guide to National Bargaining Council (NBC) Provident Fund employer registration in SA: compliance rules, documents, levies, and online filing.',
    url: `${SITE_URL}/nbc-provident-fund-guide`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: 'NBC Provident Fund Guide' }],
  },
};

const diySteps = [
  { 
    step: 'Step 1', 
    title: 'Identify Your Industry Bargaining Council Scope', 
    detail: 'Determine which National Bargaining Council (NBC) governs your business activities (e.g. NBCRFLI for Road Freight & Logistics, MEIBC for Metal & Engineering, or regional building and cleaning councils).' 
  },
  { 
    step: 'Step 2', 
    title: 'Compile Required Company & Employee Records', 
    detail: 'Gather your CIPC CoR14.3 registration, proof of business premises, director contact details, and certified ID copies for all employees along with current wage rates and job designations.' 
  },
  { 
    step: 'Step 3', 
    title: 'Complete Council Employer Application Pack', 
    detail: 'Draft the statutory employer registration forms, employee provident fund nomination schedules, and council levy registration forms.' 
  },
  { 
    step: 'Step 4', 
    title: 'Council Verification & Employer Number Issuance', 
    detail: 'Submit your application pack to the council. Once processed, the council issues an official employer registration number and employee member numbers.' 
  },
  { 
    step: 'Step 5', 
    title: 'Monthly Return Filings & Contributions', 
    detail: 'Process monthly payroll deductions (employee and employer provident fund portions) and file monthly council returns to maintain a valid Letter of Good Standing.' 
  },
];

const faqs = [
  {
    question: 'What is the NBC Provident Fund in South Africa?',
    answer: 'The NBC (National Bargaining Council) Provident Fund is a statutory retirement fund established under collective bargaining agreements in South Africa. When a business operates in a regulated sector (such as road freight, clothing, or engineering), membership in the industry provident fund is legally mandatory for both the employer and employees.',
  },
  {
    question: 'Is NBC Provident Fund registration compulsory for employers?',
    answer: 'Yes. If your business activities fall within the registered scope of a National Bargaining Council agreement that has been extended to non-parties by the Minister of Employment and Labour, registering your company and staff is mandatory under the Labour Relations Act (LRA).',
  },
  {
    question: 'What documents are required to register an employer for NBC Provident Fund?',
    answer: 'Required documents include: CIPC company registration (CoR14.3 / CK documents), certified ID copies of all employees (certified within 3 months), proof of business physical address (utility bill or lease agreement), director ID copies, and an employee wage schedule.',
  },
  {
    question: 'What happens if a company fails to register with the council?',
    answer: 'Non-compliant employers face compliance orders, arbitration awards, and subpoenas from council agents. The council can demand backdated contributions plus interest and penalties, and will refuse to issue a Certificate / Letter of Good Standing needed for tenders.',
  },
  {
    question: 'How long does NBC Provident Fund company registration take?',
    answer: 'Preparing and submitting the complete registration pack with My Accountant takes 1–2 working days. Council verification and issuance of your employer number typically takes 7–14 working days depending on the specific council.',
  },
  {
    question: 'Can My Accountant handle ongoing monthly council returns?',
    answer: 'Yes! Our monthly payroll administration service calculates provident fund deductions, prepares monthly bargaining council return schedules, and ensures your business maintains a 100% compliant Letter of Good Standing.',
  },
];

export default function NbcProvidentFundGuidePage() {
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
    <div className="space-y-12 pb-16 bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <PageHero
        badgeText="Statutory Labour Compliance"
        title={
          <>
            NBC Provident Fund <span className="text-gradient">Employer Registration Guide</span>
          </>
        }
        subtitle="Learn how National Bargaining Council (NBC) provident fund registration works for South African employers, who must register, required documents, and monthly compliance rules."
        primaryCta={{ text: "Register Employer (R750)", href: "/products/nbc-provident-fund-company-registration" }}
        secondaryCta={{ text: "Monthly Payroll Services", href: "/monthly-payroll" }}
      />

      <TrustIndexWidget />

      {/* Quick Summary / Key Highlights */}
      <section className="container mx-auto px-4 max-w-4xl">
        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
            <div className="space-y-1">
              <Badge className="bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider mb-1">
                Employer Compliance Overview
              </Badge>
              <h2 className="text-2xl font-black text-foreground tracking-tight">
                National Bargaining Council (NBC) Fund Requirements
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full shrink-0">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Labour Relations Act Compliance</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border border-border/70">
              <CardHeader className="pb-2">
                <span className="text-xs uppercase font-bold text-primary">Mandatory Scope</span>
                <CardTitle className="text-base font-bold">Extended Agreements</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Collective agreements gazetted by the Minister apply to <strong className="text-foreground">all employers</strong> in the sector, whether they belong to an employers' organisation or not.
              </CardContent>
            </Card>

            <Card className="border border-border/70">
              <CardHeader className="pb-2">
                <span className="text-xs uppercase font-bold text-primary">Benefits</span>
                <CardTitle className="text-base font-bold">Good Standing</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Registered employers receive an official Council Number and can obtain a <strong className="text-foreground">Letter of Good Standing</strong> essential for commercial and government contracts.
              </CardContent>
            </Card>

            <Card className="border border-border/70">
              <CardHeader className="pb-2">
                <span className="text-xs uppercase font-bold text-primary">Penalties</span>
                <CardTitle className="text-base font-bold">Avoid Back-Levies</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Failing to register triggers council enforcement audits with backdated levies, interest, and CCMA / Labour Court arbitration awards.
              </CardContent>
            </Card>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/40 p-4 rounded-xl border border-border/50">
            <div className="text-sm">
              <span className="font-bold text-foreground">Need your company registered with the council?</span>
              <p className="text-xs text-muted-foreground">We compile your application pack, verify employee IDs, and file with the council.</p>
            </div>
            <Button asChild size="sm" className="font-bold shrink-0">
              <Link href="/products/nbc-provident-fund-company-registration">
                Register Employer (R750) <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Step-by-Step Guide */}
      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Registration Process
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Register with an NBC Provident Fund</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {diySteps.map((s, i) => (
            <Card key={i} className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                    0{i + 1}
                  </span>
                  <CardTitle className="text-lg font-bold">{s.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground pl-14">
                {s.detail}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Required Documentation */}
      <section className="container mx-auto px-4 max-w-4xl space-y-6 pt-4">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Documentation Checklist
          </Badge>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
            What You Need to Register
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            Ensure you have these documents ready to ensure quick turnaround without council queries:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border border-border/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary shrink-0" />
                Company Registration (CoR14.3)
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Official CIPC certificate proving registered enterprise name, registration number, and registered directors.
            </CardContent>
          </Card>

          <Card className="border border-border/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Users className="h-4 w-4 text-primary shrink-0" />
                Certified Employee ID Copies
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Clear certified copies of ID or passport/work permits for all employees to be registered (certified within 90 days).
            </CardContent>
          </Card>

          <Card className="border border-border/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary shrink-0" />
                Proof of Business Premises
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Municipal rates account or lease agreement dated within 3 months showing the physical workplace address.
            </CardContent>
          </Card>

          <Card className="border border-border/70">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Receipt className="h-4 w-4 text-primary shrink-0" />
                Employee Wage & Designation Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              List of staff with dates of engagement, job classifications, basic wages, and contact information.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-6 pt-6">
        <h2 className="text-2xl font-bold text-foreground text-center">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 gap-4">
          {faqs.map((f, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                  {f.question}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {f.answer}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-5xl">
        <SarsExpertCta />
      </section>
    </div>
  );
}
