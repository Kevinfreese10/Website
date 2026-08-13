import { Metadata } from 'next';
import { Users, FileText, HelpCircle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Report a Deceased Estate to SARS | SARS Online Query",
  description: "Report a deceased taxpayer to SARS online via SOQS. Submit death certificates, Letter of Executorship, and register a deceased estate tax profile.",
  alternates: {
    canonical: `${SITE_URL}/sars-deceased-estate-reporting`,
  },
  openGraph: {
    title: "Report a Deceased Estate to SARS",
    description: "Step-by-step DIY guide to notifying SARS of a deceased taxpayer and appointing an executor.",
    url: `${SITE_URL}/sars-deceased-estate-reporting`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "SARS Deceased Estate Reporting" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Access the SARS Online Query System", detail: "Navigate to online.sars.gov.za and choose 'Report Deceased Estate'." },
  { step: "Step 2", title: "Input Deceased Taxpayer Information", detail: "Enter full legal name, SA ID or passport number, tax reference number, and date of death." },
  { step: "Step 3", title: "Provide Executor / Representative Details", detail: "Input contact details, ID number, and tax reference number of the appointed Executor or legal representative." },
  { step: "Step 4", title: "Upload Legal Documents", detail: "Attach Death Certificate, Letter of Executorship (issued by Master of High Court), certified ID of Executor, and death notice." },
  { step: "Step 5", title: "Receive Estate Tax Reference Number", detail: "SARS will update the deceased taxpayer's status to 'Deceased Estate' and issue formal instructions to finalize pre- and post-date of death assessments." },
];

const faqs = [
  { question: "Why must a deceased estate be reported to SARS?", answer: "SARS requires finalization of income tax up to the date of death, as well as assessment of Estate Duty (Rev 267) before the Executor can distribute estate assets." },
  { question: "Who is authorized to deal with SARS on behalf of a deceased estate?", answer: "Only the formally appointed Executor (holding a Master's Letter of Executorship) or an accredited tax practitioner acting under Executor Power of Attorney." },
  { question: "Can My Accountant manage deceased estate tax compliance?", answer: "Yes! We handle date-of-death income tax returns, Capital Gains Tax calculations on deemed disposals, and Estate Duty declarations." },
];

export default function SarsDeceasedEstateReportingPage() {
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
        badgeText="Deceased Estate Tax Compliance"
        title={
          <>
            Report a Deceased Estate <span className="text-gradient">to SARS Online</span>
          </>
        }
        subtitle="Notify SARS of a taxpayer's passing, submit Letters of Executorship, and finalize estate tax compliance."
        primaryCta={{ text: "Deceased Estate Tax Help", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          title="Report a Deceased Estate Directly with SARS"
          description="Use official SARS digital query portals to register a deceased estate and submit Master's court documentation."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Reporting Workflow Guide
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Report a Deceased Estate to SARS</h2>
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
