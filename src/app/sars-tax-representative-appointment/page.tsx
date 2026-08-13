import { Metadata } from 'next';
import { UserCheck, Building2, HelpCircle, CheckCircle2, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Appoint Registered Tax Representative / Public Officer | SARS SOQS",
  description: "Appoint or update a registered tax representative or Public Officer for a company, trust, or individual with SARS online via SOQS.",
  alternates: {
    canonical: `${SITE_URL}/sars-tax-representative-appointment`,
  },
  openGraph: {
    title: "Appoint Registered Tax Representative / Public Officer",
    description: "Update official Public Officer and Tax Representative details with SARS online.",
    url: `${SITE_URL}/sars-tax-representative-appointment`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "Appoint SARS Representative" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Access the SARS Online Query System", detail: "Go to tools.sars.gov.za/soqs and select 'Appoint Representative Taxpayer'." },
  { step: "Step 2", title: "Input Entity & Representative Details", detail: "Enter company CIPC registration number, tax reference number, and proposed Public Officer's ID & tax reference number." },
  { step: "Step 3", title: "Select Representative Type", detail: "Choose role: Public Officer (Company), Trustee, Representative Taxpayer, or Power of Attorney." },
  { step: "Step 4", title: "Upload Supporting Documents", detail: "Attach CIPC COR39 / CoR14.3 certificate, Company Resolution appointing the Public Officer, ID copy, and utility bill." },
  { step: "Step 5", title: "SARS Verification & Approval", detail: "SARS will review submission and update the official RAV01 profile with the new Public Officer details." },
];

const faqs = [
  { question: "What is a SARS Public Officer?", answer: "A Public Officer is the legally appointed representative of a South African company who is personally responsible for all tax filings and compliance under the Tax Administration Act." },
  { question: "Can a South African company operate without a SARS Public Officer?", answer: "No. Failure to appoint a Public Officer within one month of incorporation is an offence under Section 246 of the Tax Administration Act." },
  { question: "Can My Accountant act as your company's SARS Public Officer or Representative?", answer: "Yes! As registered SAIT tax practitioners, we can be appointed as your legal tax representative or manage your company's SARS eFiling profile under Power of Attorney." },
];

export default function SarsTaxRepresentativeAppointmentPage() {
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
        badgeText="Corporate Tax Governance"
        title={
          <>
            Appoint Registered <span className="text-gradient">Tax Representative</span>
          </>
        }
        subtitle="Appoint or update a Public Officer, Representative Taxpayer, or accredited Tax Practitioner for your business or trust."
        primaryCta={{ text: "Appoint Tax Representative", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/RegisteredRepresentative"
          guideUrl="https://www.sars.gov.za/client-segments/tax-practitioners/"
          title="Appoint a Tax Representative / Public Officer Online"
          description="Use official SARS digital query portals to submit company resolutions, CIPC certificates, and representative appointments."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Appointment Instructions
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Appoint a SARS Representative</h2>
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
