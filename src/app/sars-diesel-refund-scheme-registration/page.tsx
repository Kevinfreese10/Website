import { Metadata } from 'next';
import { Factory, DollarSign, HelpCircle, CheckCircle2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Register for Diesel Refund Scheme | SARS SOQS Guide",
  description: "Register for the SARS Food Manufacturing & Agricultural Diesel Refund Scheme online via SOQS. Claim qualifying diesel levy refunds.",
  alternates: {
    canonical: `${SITE_URL}/sars-diesel-refund-scheme-registration`,
  },
  openGraph: {
    title: "Register for Food Manufacturing Diesel Refund Scheme",
    description: "Register for SARS diesel refund claims and tax rebates online.",
    url: `${SITE_URL}/sars-diesel-refund-scheme-registration`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "SARS Diesel Refund Registration" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Access the SARS Online Query Portal", detail: "Navigate to tools.sars.gov.za/soqs and choose 'Diesel Refund Scheme Registration'." },
  { step: "Step 2", title: "Verify VAT Registration & Industry Qualification", detail: "Ensure your entity is registered for VAT and operates in qualifying sectors (Food Manufacturing, Agriculture, Forestry, Mining)." },
  { step: "Step 3", title: "Complete VAT101 Diesel Registration Profile", detail: "Add diesel refund scheme user profile under your active VAT registration." },
  { step: "Step 4", title: "Upload Generator & Equipment Logbook Evidence", detail: "Attach diesel purchase tax invoices, generator specifications, electricity load shedding logs, and manufacturing flowcharts." },
  { step: "Step 5", title: "Submit Monthly/Bi-Monthly Rebate Claims", detail: "Claim refund amounts on your VAT201 return submissions." },
];

const faqs = [
  { question: "What is the Food Manufacturing Diesel Refund Scheme?", answer: "An official SARS tax relief scheme introduced to cushion food manufacturers against electricity load shedding costs by refunding fuel levies paid on diesel for electricity generation." },
  { question: "What records must be kept for SARS diesel refund audits?", answer: "Diesel delivery notes, tax invoices, logbooks detailing diesel litres consumed per generator, and power generation schedules." },
  { question: "Can My Accountant manage our company's diesel refund claims?", answer: "Yes! We assist food manufacturers, farmers, and industrial businesses with registration, logbook setup, and monthly VAT201 diesel refund claims." },
];

export default function SarsDieselRefundSchemeRegistrationPage() {
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
        badgeText="Industrial Tax Relief & Rebates"
        title={
          <>
            Register for Diesel <span className="text-gradient">Refund Scheme</span>
          </>
        }
        subtitle="Register for the SARS Diesel Refund Scheme for Food Manufacturers, Agriculture, and Mining to claim fuel levy rebates."
        primaryCta={{ text: "Register Diesel Refund", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/DieselRefundsRegistration"
          title="Submit a SARS Diesel Refund Registration Query"
          description="Access official SARS digital query portals to register for food manufacturing and agricultural diesel rebate schemes."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Registration Instructions
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Register for the SARS Diesel Refund Scheme</h2>
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
