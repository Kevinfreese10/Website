import { Metadata } from 'next';
import Link from 'next/link';
import { HelpCircle, Clock, AlertTriangle, ArrowRight, Compass, FileCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageHero from '@/components/shared/PageHero';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';
import SarsOfficialLinkBox from '@/components/sars-online-query/SarsOfficialLinkBox';
import SarsExpertCta from '@/components/sars-online-query/SarsExpertCta';
import { SITE_URL, GLOBAL_OG_IMAGE } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Check SARS Auto-Assessment Status | SARS Online Query Guide',
  description:
    'Check if SARS auto-assessed your personal income tax return (ITR12). Learn how to review, accept, or edit auto-assessments on eFiling before the deadline.',
  alternates: {
    canonical: `${SITE_URL}/sars-auto-assessment-status-check`,
  },
  openGraph: {
    title: 'Check SARS Auto-Assessment Status Online | My Accountant',
    description: 'Step-by-step DIY guide to reviewing, editing, or disputing SARS ITR12 auto-assessments.',
    url: `${SITE_URL}/sars-auto-assessment-status-check`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: 'SARS Auto Assessment Check' }],
  },
};

const diySteps = [
  {
    step: 'Step 1',
    title: 'Open the SARS Auto-Assessment Status Lookup or eFiling',
    detail:
      'Navigate to tools.sars.gov.za/sarsonlinequery/assessmentlookup or log into SARS eFiling and click "Returns > Returns Issued > Personal Income Tax (ITR12)".',
  },
  {
    step: 'Step 2',
    title: 'Enter Your 13-Digit SA ID or Passport & Tax Number',
    detail:
      'On SOQS, input your South African ID number or passport number and 10-digit income tax reference number to check if your profile was selected for the July Auto-Assessment batch.',
  },
  {
    step: 'Step 3',
    title: 'Inspect Your Original Notice of Assessment (ITA34)',
    detail:
      'On eFiling, open "Notice of Assessment (ITA34)" and compare the third-party data pre-populated by SARS: employer IRP5/IT3(a), medical scheme certificate, retirement annuity IT3(f), and bank interest IT3(b).',
  },
  {
    step: 'Step 4',
    title: 'Audit Missing Deductions Before Clicking Accept',
    detail:
      'SARS auto-assessments NEVER include travel logbooks against code 3701, out-of-pocket medical expenses not submitted to your medical aid, home office expenses, wear-and-tear, or solar/CGT exclusions.',
  },
  {
    step: 'Step 5',
    title: 'Request Return to Edit & File a Revised ITR12',
    detail:
      'If deductions are missing or rental/freelance income must be declared, click "Request Correction" on your ITR12 work page, capture the full deductions, and submit before the October non-provisional filing deadline.',
  },
];

const rejectionCases = [
  {
    title: 'Omitted Travel Logbook & Out-of-Pocket Medical Claims',
    desc: 'Because employers and medical schemes only submit certificate totals, SARS auto-assessments omit business kilometres (code 3701) and qualifying out-of-pocket medical receipts—costing taxpayers thousands in lost refunds.',
  },
  {
    title: 'Expired 40-Business-Day / Filing Season Edit Window',
    desc: 'If you miss the annual Tax Season deadline for non-provisional taxpayers (typically late October), eFiling locks the "Request Correction" button unless you apply for an extension or lodge a Section 104 Notice of Objection (NOO).',
  },
  {
    title: 'Undeclared Side-Hustle, Rental, or Crypto Income',
    desc: 'Accepting an auto-assessment that omits rental income, freelance invoices, or capital gains exposes you to understatement penalties of up to 200% under Section 222 of the Tax Administration Act.',
  },
  {
    title: 'Refund Locked by Unverified Banking Details (RAV01)',
    desc: 'Even when an auto-assessment shows a negative credit balance (refund due), SARS places a banking stop on the payout if your bank account has changed or was not used in the last 3 years.',
  },
];

const faqs = [
  {
    question: 'What happens if I do nothing after receiving a SARS Auto-Assessment SMS?',
    answer:
      'Under current SARS rules, you do not need to click "Accept" if you agree with the auto-assessment—SARS automatically finalizes it. However, if you are owed a larger refund from unclaimed deductions or have additional income to declare, you must actively click "Request Correction" and file an edited ITR12.',
  },
  {
    question: 'How long does a SARS auto-assessment refund take to pay out?',
    answer:
      'For unmodified auto-assessments where banking details on RAV01 are active and verified, SARS pays out refunds exceeding R100 within 72 business hours. If you edit the return to add deductions and trigger verification, SARS turnaround is up to 21 business days.',
  },
  {
    question: 'What is the exact SARS eFiling path to edit an auto-assessment?',
    answer:
      'Log into SARS eFiling -> click "Returns" -> "Returns Issued" -> "Personal Income Tax (ITR12)" -> select the current tax year -> click "Request Correction" to unlock the editable ITR12 wizard.',
  },
  {
    question: 'What if the deadline to edit my SARS auto-assessment has already passed?',
    answer:
      'If the standard Tax Season filing window has closed, you must submit a formal Request for Extension or lodge a Notice of Objection (NOO) under Section 104 of the Tax Administration Act with supporting schedules.',
  },
  {
    question: 'Can My Accountant review my auto-assessment before the deadline closes?',
    answer:
      'Yes! Our registered tax practitioners review your ITA34 against your IRP5s, travel logbook, medical receipts, and Section 11F retirement contributions to ensure you claim every legal rand owed to you.',
  },
];

export default function SarsAutoAssessmentStatusCheckPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'SARS Online Query Guides', item: `${SITE_URL}/sars-online-query-system-guide` },
          { '@type': 'ListItem', position: 3, name: 'Check SARS Auto-Assessment Status', item: `${SITE_URL}/sars-auto-assessment-status-check` },
        ],
      },
      {
        '@type': 'HowTo',
        name: 'How to Check and Edit Your SARS Auto-Assessment Status',
        description: 'Step-by-step instructions to check if SARS auto-assessed your ITR12 return and how to submit a revised return on eFiling.',
        totalTime: 'PT15M',
        step: diySteps.map((s, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          name: s.title,
          text: s.detail,
        })),
      },
      {
        '@type': 'Service',
        name: 'SARS Auto-Assessment Review & Revised ITR12 Filing Service',
        description: 'Professional review and correction of SARS auto-assessments to claim travel logbooks, home office, and medical deductions.',
        provider: { '@type': 'Organization', name: 'My Accountant', url: SITE_URL },
        areaServed: { '@type': 'Country', name: 'South Africa' },
        url: `${SITE_URL}/sars-auto-assessment-status-check`,
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
    ],
  };

  return (
    <div className="space-y-12 pb-16 bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <PageHero
        badgeText="Personal Income Tax Season (ITR12)"
        title={
          <>
            Check SARS <span className="text-gradient">Auto-Assessment Status</span>
          </>
        }
        subtitle="Verify if SARS generated an automatic ITA34 tax assessment for your profile and ensure travel, home office, and medical deductions are not left unclaimed."
        primaryCta={{ text: 'File / Edit ITR12 Return (R550)', href: '/products/individual-tax-returns' }}
        secondaryCta={{ text: 'Free Refund Check', href: '/sars-tax-refund' }}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-4xl">
        <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-4">
            <div className="space-y-1">
              <Badge className="bg-primary text-primary-foreground font-bold text-xs uppercase tracking-wider">
                eFiling Navigation &amp; Turnaround
              </Badge>
              <h2 className="text-xl md:text-2xl font-black text-foreground">
                Where to Find &amp; Edit Your Auto-Assessment
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full shrink-0">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Refund Payout: 72 Hours | Edited Verification: 21 Business Days</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            <strong className="text-foreground">eFiling Navigation Path:</strong> Log into eFiling &rarr;{' '}
            <code className="bg-muted px-2 py-0.5 rounded font-mono text-foreground">
              Returns &rarr; Returns Issued &rarr; Personal Income Tax (ITR12) &rarr; Request Correction
            </code>
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/sarsonlinequery/assessmentlookup"
          title="Check Your Auto-Assessment Status Directly with SARS"
          description="Use official SARS digital channels to check auto-assessment selection notifications, refund status, and ITA34 calculations."
        />
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-primary/30 text-primary font-bold">
            Auto-Assessment Guide
          </Badge>
          <h2 className="text-3xl font-extrabold text-foreground">How to Check &amp; Edit Your SARS Auto-Assessment</h2>
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
              <CardContent className="text-sm text-muted-foreground pl-14">{s.detail}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-6 pt-4">
        <div className="text-center space-y-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wider border-amber-500/40 text-amber-700 font-bold">
            Common Traps &amp; Rejections
          </Badge>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
            Why You Shouldn’t Blindly Accept a SARS Auto-Assessment
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rejectionCases.map((rc, i) => (
            <Card key={i} className="border border-border/70">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  {rc.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground leading-relaxed">{rc.desc}</CardContent>
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
              <CardContent className="text-sm text-muted-foreground">{f.answer}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl space-y-4 pt-4">
        <h2 className="text-xl font-bold text-foreground">Related SARS Guides &amp; Fixed-Fee Packages</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <Link href="/products/individual-tax-returns" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>Individual Tax Return (ITR12)</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/sars-tax-refund" className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 hover:border-primary font-semibold text-foreground flex items-center justify-between">
            <span>Free SARS Tax Refund Check</span>
            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
          </Link>
          <Link href="/sars-tax-return-status-dashboard" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Track ITR12 Audit &amp; Refund Status</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-supporting-documents-upload-guide" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Upload Audit Supporting Docs</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/sars-disputes" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>Lodge Section 104 Objection</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
          <Link href="/calculators/salary-tax" className="p-3.5 rounded-xl border border-border hover:border-primary/50 font-semibold text-foreground flex items-center justify-between">
            <span>2026 PAYE &amp; Salary Tax Calculator</span>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-5xl">
        <SarsExpertCta />
      </section>
    </div>
  );
}
