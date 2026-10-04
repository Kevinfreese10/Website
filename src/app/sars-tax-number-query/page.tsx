import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Search, 
  CheckCircle2, 
  FileText, 
  UserCheck, 
  ShieldCheck, 
  HelpCircle, 
  MessageSquare, 
  Smartphone, 
  Globe, 
  ArrowRight, 
  Clock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'How to Get Your SARS Tax Number (2026 Guide)',
  description: 'Find or get your SARS tax reference number in minutes: eFiling, MobiApp, branch or SMS. Step-by-step 2026 guide, plus we can register it for you.',
  alternates: {
    canonical: `${SITE_URL}/sars-tax-number-query`,
  },
  openGraph: {
    title: 'How to Get Your SARS Tax Number (2026 Guide) | My Accountant',
    description: 'Find or get your SARS tax reference number in minutes: eFiling, MobiApp, branch or SMS. Step-by-step 2026 guide, plus we can register it for you.',
    url: `${SITE_URL}/sars-tax-number-query`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: 'SARS Tax Number Query' }],
  },
};

const diySteps = [
  { step: 'Step 1', title: 'Visit the Official SARS Online Query System', detail: 'Go to tools.sars.gov.za/soqs or access via the official SARS Digital Channels portal.' },
  { step: 'Step 2', title: "Select 'What's My Tax Number?'", detail: 'Choose the individual or entity option from the main query menu.' },
  { step: 'Step 3', title: 'Enter Your ID / Passport / Company Reg Number', detail: 'Input your 13-digit South African ID number, passport number, or CIPC company registration number along with your full legal name.' },
  { step: 'Step 4', title: 'Complete Security Verification', detail: 'Provide your registered mobile number or email address to receive a one-time PIN (OTP).' },
  { step: 'Step 5', title: 'Receive Tax Number via SMS/Email', detail: 'Once verified, SARS will immediately send your 10-digit tax reference number to your verified contact details.' },
];

const faqs = [
  { question: 'How many digits is a SARS tax reference number?', answer: 'A SARS individual or company tax reference number consists of exactly 10 digits, typically starting with 0, 1, 2, 3, or 9.' },
  { question: 'How can I get my SARS tax number via SMS?', answer: 'Send an SMS with the text: TRN [Space] [Your 13-digit ID Number] to 33063 (e.g. TRN 8501015000080). SARS will reply via SMS with your 10-digit tax reference number. This only works from the cellphone number registered on your SARS profile.' },
  { question: 'Can I get my tax number if my cellphone number or email changed?', answer: 'If your contact details on SARS record are outdated, the automated OTP will fail. You can either book a virtual appointment at a SARS branch or appoint My Accountant as your Registered Tax Practitioner to update your RAV01 profile and pull your official Notice of Registration (IT150).' },
  { question: 'Is a tax number automatically issued when starting employment?', answer: 'Most employers auto-register new employees via SARS eFiling during monthly payroll submissions. However, if your registration was delayed or you need an official IT150 document for HR, we can register or retrieve it for you.' },
  { question: 'What is an IT150 Notice of Registration?', answer: 'The IT150 is the official, stamped SARS confirmation letter that displays your name, ID number, and 10-digit tax reference number. Banks and new employers usually require this PDF document when opening business accounts or onboarding staff.' },
  { question: 'How long does it take for My Accountant to retrieve my tax number?', answer: 'When you appoint us as your SARS Registered Representative, we can verify your profile, update outdated contact details, and deliver your official SARS IT150 Notice of Registration within 24 hours.' },
];

export default function SarsTaxNumberQueryPage() {
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
        badgeText="SARS Tax Reference Number Guide"
        title={
          <>
            How to Get Your <span className="text-gradient">SARS Tax Number</span>
          </>
        }
        subtitle="Need your 10-digit SARS income tax reference number for a new job, bank account, or tax return? Here are the 4 fastest ways to find or register it in 2026."
        primaryCta={{ text: "Retrieve Tax Number (R250)", href: "/products/sars-registered-representative-appointment" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      {/* Quick Answer Box (Above the fold featured snippet target) */}
      <section className="container mx-auto px-4 max-w-4xl">
        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
            <div className="space-y-1">
              <Badge className="bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider mb-1">
                Quick Answer
              </Badge>
              <h2 className="text-2xl font-black text-foreground tracking-tight">
                4 Ways to Find or Get Your SARS Tax Number (2026)
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full shrink-0">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Updated for 2026 Tax Year</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Method 1: SMS */}
            <Card className="border border-border/70 hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold text-muted-foreground">Method 1 (Instant)</span>
                    <CardTitle className="text-base font-bold">SMS to 33063</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>Send an SMS with the exact text:</p>
                <code className="block bg-muted px-2.5 py-1.5 rounded font-mono text-xs text-foreground font-bold">
                  TRN &lt;13-digit ID Number&gt;
                </code>
                <p className="text-[11px]">Send to <strong className="text-foreground">33063</strong>. SARS will reply via SMS with your 10-digit number. (Must be sent from your registered cellphone).</p>
              </CardContent>
            </Card>

            {/* Method 2: SARS SOQS */}
            <Card className="border border-border/70 hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold text-muted-foreground">Method 2 (Online DIY)</span>
                    <CardTitle className="text-base font-bold">SARS Online Query</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>Go to the SARS Online Query System (SOQS) at <span className="font-semibold text-foreground">tools.sars.gov.za/soqs</span>.</p>
                <p>Select "What's My Tax Number?", enter your SA ID or passport, and verify via OTP sent to your cell or email.</p>
              </CardContent>
            </Card>

            {/* Method 3: eFiling / MobiApp */}
            <Card className="border border-border/70 hover:border-primary/40 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold text-muted-foreground">Method 3 (Portal)</span>
                    <CardTitle className="text-base font-bold">SARS eFiling / MobiApp</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>Log in to your SARS eFiling profile or the SARS MobiApp on your smartphone.</p>
                <p>Your 10-digit number appears on the dashboard, and you can download your official <strong className="text-foreground">Notice of Registration (IT150)</strong> PDF under Profile.</p>
              </CardContent>
            </Card>

            {/* Method 4: My Accountant Assistance */}
            <Card className="border-2 border-primary/30 bg-primary/5 hover:border-primary transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold text-primary">Method 4 (Guaranteed)</span>
                    <CardTitle className="text-base font-bold text-foreground">Appoint My Accountant</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>Cellphone number changed? Can't receive the SARS OTP? Need a brand-new tax number or official stamped IT150 for employment?</p>
                <p className="font-medium text-foreground">We verify your profile with SARS and deliver your official IT150 document in 24 hours.</p>
                <Button asChild size="sm" className="w-full mt-2 font-bold h-8 text-xs">
                  <Link href="/products/sars-registered-representative-appointment">
                    Get Tax Number via Accountant <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Official Link Box */}
      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/whatsmytaxnumber"
          title="Query Your SARS Tax Reference Number Directly"
          description="Use the official SARS online portal to request your individual or company tax number via SMS or email."
        />
      </section>

      {/* DIY Steps */}
      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Step-by-Step Instructions
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Retrieve Your SARS Tax Number DIY</h2>
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
