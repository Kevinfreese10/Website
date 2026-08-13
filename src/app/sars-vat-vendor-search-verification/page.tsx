import { Metadata } from 'next';
import { Search, CheckCircle2, ShieldCheck, HelpCircle, Receipt } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Verify VAT Vendor Registration Number | SARS Online Query",
  description: "Verify if a South African business has an active SARS VAT registration number online before claiming input VAT on tax invoices.",
  alternates: {
    canonical: `${SITE_URL}/sars-vat-vendor-search-verification`,
  },
  openGraph: {
    title: "Verify VAT Vendor Registration Number",
    description: "Instantly verify active SARS VAT vendor registration numbers online.",
    url: `${SITE_URL}/sars-vat-vendor-search-verification`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "Verify SARS VAT Vendor" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Access the SARS Online Query System", detail: "Go to tools.sars.gov.za/soqs and choose 'VAT Vendor Search & Verification'." },
  { step: "Step 2", title: "Enter 10-Digit VAT Registration Number", detail: "Input the vendor's 10-digit VAT registration number starting with '4'." },
  { step: "Step 3", title: "Submit Verification Search", detail: "Click search to query live SARS VAT database records." },
  { step: "Step 4", title: "Review Registered Trading Name & Status", detail: "Verify that the registered VAT name matches the supplier name printed on the tax invoice." },
  { step: "Step 5", title: "Save Verification Proof for VAT Audit", detail: "Print or save verification confirmation to support input tax claims during SARS VAT audits." },
];

const faqs = [
  { question: "Why is verifying supplier VAT numbers crucial for businesses?", answer: "SARS disallows input tax claims if invoices are issued by deregistered or fake VAT vendors. Claiming input tax on invalid VAT numbers leads to audit adjustments and 200% understatement penalties." },
  { question: "How many digits is a South African VAT number?", answer: "A SARS VAT registration number is a 10-digit number starting with the digit 4." },
  { question: "Can My Accountant perform automated bulk VAT vendor verification?", answer: "Yes! We run vendor master file audits to verify all supplier VAT numbers prior to filing your VAT201 return." },
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
        badgeText="VAT Compliance & Verification"
        title={
          <>
            Verify VAT Vendor <span className="text-gradient">Registration Number</span>
          </>
        }
        subtitle="Instantly check if a supplier or contractor has a valid, active SARS VAT number before claiming input tax on invoices."
        primaryCta={{ text: "Audit Vendor VAT Master", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://secure.sarsefiling.co.za/vatvendorsearch.aspx"
          title="Verify a SARS VAT Vendor Directly"
          description="Use official SARS digital query portals to check real-time VAT registration status and registered vendor names."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            VAT Verification Guide
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Verify a SARS VAT Vendor</h2>
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
