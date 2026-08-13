import { Metadata } from 'next';
import { AlertTriangle, ShieldAlert, HelpCircle, CheckCircle2, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: "Report SARS Employee Corruption & Misconduct | SOQS",
  description: "Anonymously report extortion, bribery, audit solicitation, or misconduct by SARS officials directly to SARS Anti-Corruption and Law Enforcement.",
  alternates: {
    canonical: `${SITE_URL}/sars-report-employee-corruption`,
  },
  openGraph: {
    title: "Report SARS Employee Corruption & Misconduct",
    description: "Submit confidential anti-corruption and misconduct reports to SARS online.",
    url: `${SITE_URL}/sars-report-employee-corruption`,
    siteName: "My Accountant",
    locale: "en_ZA",
    type: "website",
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: "Report SARS Corruption" }],
  },
};

const diySteps = [
  { step: "Step 1", title: "Access the SARS Anti-Corruption Hotline / SOQS", detail: "Go to tools.sars.gov.za/soqs or access the toll-free SARS Anti-Corruption Hotline (0800 00 2870)." },
  { step: "Step 2", title: "Choose Anonymous vs Named Disclosure", detail: "Select whether to file an anonymous whistleblowing report or provide your contact details under Protected Disclosures Act." },
  { step: "Step 3", title: "Detail the Alleged Misconduct", detail: "Provide specific details: SARS official's name, employee number (if known), branch location, case/audit reference, and date of occurrence." },
  { step: "Step 4", title: "Attach Supporting Evidence", detail: "Upload email threads, audio recordings, WhatsApp messages, or financial extortion demands." },
  { step: "Step 5", title: "Submit to Anti-Corruption Unit", detail: "SARS Internal Integrity Unit and independent auditors will investigate the report confidentially." },
];

const faqs = [
  { question: "Is whistleblowing on SARS employee corruption completely anonymous?", answer: "Yes. SARS utilizes independent anti-corruption channels (operated by external administrators like KPMG/Deloitte or secure SOQS portals) ensuring your identity is never revealed." },
  { question: "What constitutes SARS employee corruption?", answer: "Soliciting bribes or kickbacks to clear tax debt, manipulating audit findings in exchange for money, unauthorized disclosure of taxpayer records, or extortion." },
  { question: "Can My Accountant protect my tax compliance if an official acts improperly?", answer: "Yes! As SAIT registered tax practitioners, we strictly enforce statutory tax laws, escalate abusive audit behavior to the Tax Ombudsman, and protect your legal rights." },
];

export default function SarsReportEmployeeCorruptionPage() {
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
        badgeText="Anti-Corruption & Whistleblowing"
        title={
          <>
            Report SARS Employee <span className="text-gradient">Corruption &amp; Misconduct</span>
          </>
        }
        subtitle="Report extortion, bribery, unauthorized audit tampering, or illegal conduct by SARS officials through confidential and anonymous channels."
        primaryCta={{ text: "Protect Your Tax Rights", href: "/contact" }}
        secondaryCta={{ text: "View All Tax Services", href: "/products#sars-services" }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          title="Lodge an Anonymous Corruption Report with SARS"
          description="Use official SARS anti-corruption digital channels to report bribery or official misconduct in confidence."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Reporting Instructions
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Report SARS Employee Corruption</h2>
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
