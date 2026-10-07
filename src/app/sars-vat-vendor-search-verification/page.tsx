import { Metadata } from 'next';
import Link from 'next/link';
import { 
  Search, 
  CheckCircle2, 
  ShieldCheck, 
  HelpCircle, 
  Receipt, 
  AlertTriangle, 
  Building2, 
  ArrowRight, 
  Clock, 
  ExternalLink,
  FileCheck2
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
  title: 'VAT Vendor Search & SARS Verification Guide',
  description:
    'Free SARS VAT vendor search guide. Instantly verify 10-digit South African supplier VAT registration numbers online to protect your 15% input tax claims.',
  alternates: {
    canonical: `${SITE_URL}/sars-vat-vendor-search-verification`,
  },
  openGraph: {
    title: 'VAT Vendor Search & SARS Verification Guide | My Accountant',
    description:
      'Free SARS VAT vendor search guide. Instantly verify 10-digit South African supplier VAT registration numbers online to protect your 15% input tax claims.',
    url: `${SITE_URL}/sars-vat-vendor-search-verification`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: 'Verify SARS VAT Vendor' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VAT Vendor Search & SARS Verification Guide | My Accountant',
    description:
      'Free SARS VAT vendor search guide. Instantly verify 10-digit South African supplier VAT registration numbers online to protect your 15% input tax claims.',
    images: [GLOBAL_OG_IMAGE],
  },
};

const diySteps = [
  { step: 'Step 1', title: 'Open the Official SARS VAT Vendor Search Portal', detail: 'Navigate to secure.sarsefiling.co.za/vatvendorsearch.aspx or access SOQS online without needing an eFiling login.' },
  { step: 'Step 2', title: 'Enter the 10-Digit VAT Registration Number', detail: "Input the supplier's 10-digit VAT number (South African VAT numbers strictly start with the digit '4')." },
  { step: 'Step 3', title: 'Complete Security Captcha & Search', detail: 'Click search to query live SARS VAT database records in real time.' },
  { step: 'Step 4', title: 'Verify Registered Legal Name & Trading Name', detail: 'Check that the registered name on SARS exactly matches the supplier name printed on your supplier invoice.' },
  { step: 'Step 5', title: 'Download or Screenshot Proof for Your Audit File', detail: 'Keep a copy of the verification search in your monthly accounting records to safeguard your 15% input VAT deduction during SARS audits.' },
];

const invoiceRequirements = [
  { title: 'Contains "Tax Invoice"', desc: 'The words "Tax Invoice", "VAT Invoice", or "Invoice" must appear in a prominent place.' },
  { title: 'Supplier VAT Details', desc: "Supplier's registered legal/trading name, physical or postal address, and 10-digit VAT registration number." },
  { title: 'Recipient Details (Over R5,000)', desc: "Your business legal name, address, and your own VAT number (mandatory if the invoice exceeds R5,000 incl. VAT)." },
  { title: 'Invoice Number & Date', desc: 'An individual serialized invoice number and the exact date of issue.' },
  { title: 'Accurate Goods Description', desc: 'A full and proper description of the goods delivered or services rendered (not generic phrases).' },
  { title: 'VAT Breakdown & Total', desc: 'The consideration for the supply, the VAT amount charged (15%), or a statement that VAT is included at 15%.' },
];

const faqs = [
  { question: 'Why is verifying supplier VAT numbers crucial for businesses?', answer: 'SARS disallows input tax claims if invoices are issued by deregistered, fraudulent, or non-existent VAT vendors. Claiming input tax on invalid VAT numbers leads to immediate audit assessments and understatement penalties of up to 200% under the Tax Administration Act.' },
  { question: 'How many digits is a South African VAT number?', answer: 'A SARS VAT registration number is strictly a 10-digit number starting with the digit 4. If an invoice shows a number that is not 10 digits or starts with another digit, it is not a valid South African VAT number.' },
  { question: 'What is the official URL for SARS VAT vendor search?', answer: 'The official free lookup portal is hosted by SARS at secure.sarsefiling.co.za/vatvendorsearch.aspx. No login or password is required to perform a search.' },
  { question: 'Can I claim input tax if the supplier registered name is different from their trading name?', answer: 'Yes, provided the VAT vendor search confirms that the trading name or legal entity matches the VAT number, and the invoice meets all Section 20 requirements under the VAT Act.' },
  { question: 'What happens if a supplier charges VAT but is not VAT registered?', answer: 'Charging VAT when not registered is a criminal offence under South African tax law. You may not claim 15% input tax on that invoice, and you should demand a credit note or a revised invoice without VAT.' },
  { question: 'Does My Accountant verify supplier VAT numbers during monthly bookkeeping?', answer: 'Yes! Our AI Accountant and chartered accounting team audit all supplier tax invoices against Section 20 compliance and verify active VAT vendor status before submitting your bi-monthly VAT201 return.' },
];

export default function SarsVatVendorSearchVerificationPage() {
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
        badgeText="SARS VAT Vendor Verification"
        title={
          <>
            SARS VAT Vendor <span className="text-gradient">Search & Verification</span>
          </>
        }
        subtitle="Instantly verify if a South African supplier or contractor has a valid, active SARS VAT number before paying invoices or claiming 15% input VAT."
        primaryCta={{ text: "File VAT201 Return (R650)", href: "/products/vat201-vat-return-submission-filing" }}
        secondaryCta={{ text: "Apply for VAT Registration", href: "/products/vat-registration" }}
      />

      <TrustIndexWidget />

      {/* Quick Action Guide Box */}
      <section className="container mx-auto px-4 max-w-4xl">
        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
            <div className="space-y-1">
              <Badge className="bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider mb-1">
                Quick Action Guide
              </Badge>
              <h2 className="text-2xl font-black text-foreground tracking-tight">
                How to Check a SARS VAT Number in 30 Seconds
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full shrink-0">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Official 2026 Lookup Tool</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border border-border/70">
              <CardHeader className="pb-2">
                <span className="text-xs uppercase font-bold text-primary">Rule 1</span>
                <CardTitle className="text-base font-bold">10-Digit Format</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                All legitimate SARS VAT numbers contain <strong className="text-foreground">exactly 10 digits</strong> and start with the number <strong className="text-foreground">4</strong> (e.g. 4123456789).
              </CardContent>
            </Card>

            <Card className="border border-border/70">
              <CardHeader className="pb-2">
                <span className="text-xs uppercase font-bold text-primary">Rule 2</span>
                <CardTitle className="text-base font-bold">Trading Name Match</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                The registered legal entity returned by SARS must match the name printed on the invoice or its registered "trading as" name.
              </CardContent>
            </Card>

            <Card className="border border-border/70">
              <CardHeader className="pb-2">
                <span className="text-xs uppercase font-bold text-primary">Rule 3</span>
                <CardTitle className="text-base font-bold">Section 20 Check</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                Invoices over R5,000 must include your own company name, physical address, and VAT registration number to be deductible.
              </CardContent>
            </Card>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/40 p-4 rounded-xl border border-border/50">
            <div className="text-sm">
              <span className="font-bold text-foreground">Need an audit of your vendor master file?</span>
              <p className="text-xs text-muted-foreground">We review all monthly invoices to prevent SARS VAT audit penalties.</p>
            </div>
            <Button asChild size="sm" className="font-bold shrink-0">
              <Link href="/contact">
                Consult a VAT Specialist <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Official Link Box */}
      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://secure.sarsefiling.co.za/vatvendorsearch.aspx"
          title="Verify a SARS VAT Vendor Directly on eFiling"
          description="Use the official SARS digital lookup service to check real-time VAT registration status and registered vendor legal names."
        />
      </section>

      {/* DIY Steps */}
      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Step-by-Step Instructions
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">Step-by-Step VAT Vendor Search Guide</h2>
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

      {/* Section 20 Compliance Checklist */}
      <section className="container mx-auto px-4 max-w-4xl space-y-6 pt-4">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            SARS Compliance
          </Badge>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Section 20 Tax Invoice Checklist
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            A valid VAT number alone does not guarantee your input tax deduction. Every invoice must satisfy these 6 statutory requirements:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {invoiceRequirements.map((req, i) => (
            <Card key={i} className="border border-border/70">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  {req.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                {req.desc}
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
