import { Metadata } from 'next';
import { Building2, FileText, HelpCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Register a New Trust with SARS via SOQS | Online Guide",
  description: "Register a family, testamentary, or trading trust with SARS online via SOQS. Submit IT77T registration and trustee documents.",
  alternates: {
    canonical: `${SITE_URL}/sars-trust-registration-online`,
  },
  openGraph: {
    title: "Register a New Trust with SARS via SOQS",
    description: "Step-by-step DIY guide to registering a trust for income tax with SARS online.",
    url: `${SITE_URL}/sars-trust-registration-online`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "SARS Trust Registration Online" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Access SARS Online Query Portal", detail: "Go to tools.sars.gov.za/soqs and select 'New Trust Registration (IT77T)'." },
  { step: "Step 2", title: "Enter Trust Identification & Masters Reference", detail: "Input the Trust Name, Master's Office Registration Number (e.g. IT1234/2026), and registered address." },
  { step: "Step 3", title: "Appoint Representative Taxpayer (Main Trustee)", detail: "Provide full details and tax reference number of the designated main trustee." },
  { step: "Step 4", title: "Upload Required Trust Documentation", detail: "Attach Letters of Authority (issued by Master of High Court), registered Trust Deed, and ID copies of all trustees and beneficiaries." },
  { step: "Step 5", title: "Obtain Trust Income Tax Number", detail: "SARS will review documentation and issue an official 10-digit income tax reference number for the trust." },
];

const faqs = [
  { question: "Is tax registration mandatory for all registered trusts in South Africa?", answer: "Yes. All trusts registered with the Master of the High Court must be registered for income tax with SARS, regardless of activity." },
  { question: "What documents are required to register a trust with SARS?", answer: "Master's Letters of Authority, registered Trust Deed, proof of trust bank account, utility bill, and certified ID copies of trustees and beneficiaries." },
  { question: "Can My Accountant register and manage trust taxes for us?", answer: "Yes! We specialize in trust tax registration, IT3(a) reporting, beneficiary distributions, and annual IT12TR income tax filings." },
];

export default function SarsTrustRegistrationOnlinePage() {
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
        badgeText="Trust Tax Compliance"
        title={
          <>
            Register a New Trust <span className="text-gradient">with SARS Online</span>
          </>
        }
        subtitle="Submit trust income tax registration (IT77T), Letters of Authority, and trustee documentation online via the SARS query system."
        primaryCta={{ text: "Register Trust Tax Account", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/trustregistration/"
          title="Submit a SARS Trust Registration Query"
          description="Use official SARS digital channels to register your trust for tax and submit required Master's court documentation."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Trust Registration Steps
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Register a Trust with SARS Online</h2>
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
