import { Metadata } from 'next';
import Link from 'next/link';
import { 
  FileText, 
  ShieldCheck, 
  Search, 
  UserCheck, 
  DollarSign, 
  HelpCircle, 
  Upload, 
  Building2, 
  AlertTriangle, 
  Lock, 
  CheckCircle2, 
  ArrowRight,
  FileCheck,
  TrendingUp,
  Receipt,
  Users,
  Anchor,
  Factory
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
  title: 'SARS Online Query System (SOQS) Complete Guide 2026 | My Accountant',
  description: 'Complete guide to the SARS Online Query System (SOQS). Access official online tax services, request tax numbers, TCS PINs, IT150, submit documents, and verify compliance.',
  alternates: {
    canonical: `${SITE_URL}/sars-online-query-system-guide`,
  },
  openGraph: {
    title: 'SARS Online Query System (SOQS) Master Guide 2026',
    description: 'Master guide to online queries available on the official SARS Online Query System. Step-by-step DIY instructions and professional tax help.',
    url: `${SITE_URL}/sars-online-query-system-guide`,
    siteName: 'My Accountant',
    locale: 'en_ZA',
    type: 'website',
    images: [{ url: GLOBAL_OG_IMAGE, width: 1200, height: 630, alt: 'SARS Online Query System Guide' }],
  },
};

const queryCategories = [
  {
    category: 'Tax Numbers & Compliance',
    description: 'Retrieve registration details, tax clearance, and official SARS documentation.',
    items: [
      { name: "What's My SARS Tax Reference Number?", href: "/sars-tax-number-query", icon: Search, desc: "Retrieve lost or unknown individual or company tax reference numbers." },
      { name: "Request Tax Compliance Status PIN", href: "/sars-tax-compliance-status-pin", icon: ShieldCheck, desc: "Issue a TCS PIN for Good Standing, Tender, or Foreign Investment." },
      { name: "Verify Tax Compliance Status PIN", href: "/sars-verify-tax-compliance-status", icon: CheckCircle2, desc: "Verify third-party tax clearance PINs issued by SARS." },
      { name: "Request IT150 / Notice of Registration", href: "/sars-notice-of-registration-it150", icon: FileText, desc: "Download official SARS Notice of Registration for individuals & entities." },
      { name: "Request SARS Statement of Account", href: "/sars-statement-of-account-request", icon: Receipt, desc: "Obtain official statements of account for IT, VAT, and PAYE." },
    ]
  },
  {
    category: 'Assessments, Returns & Directives',
    description: 'Track submissions, auto-assessments, PRNs, and retirement directives.',
    items: [
      { name: "Check SARS Auto-Assessment Status", href: "/sars-auto-assessment-status-check", icon: TrendingUp, desc: "View status of SARS automatic tax return assessment." },
      { name: "Tax Return Status & Verification Tracker", href: "/sars-tax-return-status-dashboard", icon: FileCheck, desc: "Track income tax return progress, audits, and refund status." },
      { name: "Find Payment Reference Number PRN", href: "/sars-payment-reference-number-prn", icon: DollarSign, desc: "Generate correct 19-digit PRNs for eFiling and EFT payments." },
      { name: "Track Tax Directive Status Online", href: "/sars-tax-directive-status", icon: Search, desc: "Check status of lump sum, retirement, and severance tax directives." },
      { name: "Check Outstanding SARS Tax Returns", href: "/sars-outstanding-returns-query", icon: HelpCircle, desc: "Check unfiled returns and avoid SARS administrative penalties." },
    ]
  },
  {
    category: 'Debt, Audit & Payments',
    description: 'Manage outstanding balances, payment allocations, and audit document uploads.',
    items: [
      { name: "Enquire on Outstanding Debt & Payment Arrangements", href: "/sars-outstanding-debt-query", icon: DollarSign, desc: "Check debt balances and request instalment payment arrangements." },
      { name: "Upload Audit Supporting Documents via SOQS", href: "/sars-supporting-documents-upload-guide", icon: Upload, desc: "Upload files for SARS tax audits and verification cases." },
      { name: "Request SARS Payment Allocation & Reallocation", href: "/sars-payment-allocation-query", icon: DollarSign, desc: "Correct misallocated payments or missing payment allocations." },
    ]
  },
  {
    category: 'Entities & Specialized Taxes',
    description: 'Register turnover tax, trusts, report deceased estates, and appoint tax representatives.',
    items: [
      { name: "SARS Turnover Tax Registration & Rates", href: "/sars-turnover-tax-registration", icon: DollarSign, desc: "Simplified tax system for micro-businesses with turnover under R1 million." },
      { name: "Register a New Trust with SARS via SOQS", href: "/sars-trust-registration-online", icon: Building2, desc: "Submit IT77T registration for family and trading trusts." },
      { name: "Report a Deceased Estate to SARS", href: "/sars-deceased-estate-reporting", icon: Users, desc: "Notify SARS of deceased taxpayers and register estate profiles." },
      { name: "Appoint Registered Tax Representative / Public Officer", href: "/sars-tax-representative-appointment", icon: UserCheck, desc: "Update registered tax representative details and power of attorney." },
    ]
  },
  {
    category: 'Customs & Specialized Refunds',
    description: 'Trader registration, RLA licensing, and diesel rebate schemes.',
    items: [
      { name: "Request Customs Trader Identification / Code", href: "/sars-customs-code-request", icon: Anchor, desc: "Obtain or look up importer/exporter customs registration codes." },
      { name: "Check Customs RLA Status & Documents", href: "/sars-customs-rla-status", icon: Search, desc: "Track Registration, Licensing, and Accreditation application status." },
      { name: "Submit Customs RLA Supporting Documents", href: "/sars-customs-rla-supporting-documents", icon: Upload, desc: "Submit required verification documents for Customs RLA." },
      { name: "Register for Food Manufacturing Diesel Refund Scheme", href: "/sars-diesel-refund-scheme-registration", icon: Factory, desc: "Register for diesel rebate claims for food manufacturers." },
    ]
  },
  {
    category: 'Large Business & Corporate Taxes',
    description: 'LBI queries, donations tax, royalties withholding, and VAT vendor checks.',
    items: [
      { name: "Submit Large Business & International LBI Query", href: "/sars-large-business-lbi-query", icon: Building2, desc: "Escalate complex tax queries directly to SARS LBI division." },
      { name: "Submit Donations Tax Declaration IT144", href: "/sars-donations-tax-it144-declaration", icon: FileText, desc: "Declare taxable donations and pay tax within required 3 months." },
      { name: "Submit Withholding Tax on Royalties WTR01", href: "/sars-withholding-tax-royalties-wtr01", icon: FileText, desc: "Submit WTR01 declarations for royalty payments to non-residents." },
      { name: "Verify VAT Vendor Registration Number", href: "/sars-vat-vendor-search-verification", icon: Search, desc: "Instantly verify active VAT registration numbers before claiming input VAT." },
    ]
  },
  {
    category: 'Fraud & Whistleblowing',
    description: 'Report compromised profiles, identity theft, and tax corruption anonymously.',
    items: [
      { name: "Report Digital Fraud & Profile Compromise", href: "/sars-report-digital-fraud", icon: Lock, desc: "Report unauthorized eFiling profile changes and banking fraud." },
      { name: "Report SARS Employee Corruption", href: "/sars-report-employee-corruption", icon: AlertTriangle, desc: "Anonymously report extortion, bribery, or misconduct by SARS officials." },
    ]
  }
];

const faqItems = [
  {
    question: "What is the SARS Online Query System (SOQS)?",
    answer: "The SARS Online Query System (SOQS) is an official digital portal created by the South African Revenue Service. It allows individuals, companies, tax practitioners, and customs clients to submit specific queries, request documents (like IT150 and TCS PINs), report changes, and upload audit documents online without needing an eFiling profile or queuing at a branch."
  },
  {
    question: "Do I need an eFiling account to use the SARS Online Query System?",
    answer: "No. One of the main advantages of SOQS is that it operates independently of eFiling. You only need your valid SA ID number or passport number, tax reference number, and contact details to submit queries online."
  },
  {
    question: "How long does SARS take to respond to SOQS queries?",
    answer: "Standard document requests (like Notice of Registration IT150 or Tax Reference Number lookup) are generated within 24 to 48 hours. Complex queries, such as payment allocations or trust registrations, may take 5 to 21 business days depending on SARS backlog."
  },
  {
    question: "Can My Accountant submit or resolve SOQS queries on my behalf?",
    answer: "Yes! As registered SAIT Tax Practitioners and SARS agents, My Accountant can handle all communication, submission, audit compliance, and debt resolution with SARS on your behalf under official Power of Attorney."
  }
];

export default function SarsOnlineQueryGuidePage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <div className="space-y-12 pb-16 bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <PageHero
        badgeText="SARS Online Query System Guide 2026"
        title={
          <>
            Master Guide to <span className="text-gradient">SARS Online Queries</span>
          </>
        }
        subtitle="Access all official SARS digital queries directly. Request tax reference numbers, TCS PINs, IT150 documents, track returns, and resolve tax debt without visiting a branch."
        primaryCta={{ text: 'Book Expert Tax Assistance', href: '/contact' }}
        secondaryCta={{ text: 'Explore Tax Services', href: '/products#sars-services' }}
        showCredibilityRibbon={true}
      />

      <TrustIndexWidget />

      <section className="container mx-auto px-4 max-w-5xl">
        <SarsOfficialLinkBox
          portalUrl="https://tools.sars.gov.za/soqs" 
          title="Access Official SARS Digital Channels (SOQS)"
          description="Use the official SARS online query portal to submit queries directly or browse official SARS digital instructions."
        />
      </section>

      {/* Query Categories Grid */}
      <section className="container mx-auto px-4 max-w-6xl space-y-12 pt-6">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <Badge variant="outline" className="text-xs uppercase tracking-widest border-primary/30 text-primary font-bold">
            Digital Services Available
          </Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
            Browse All SARS Online Queries
          </h2>
          <p className="text-base md:text-lg text-muted-foreground">
            Select a query category below to read step-by-step DIY instructions or let our tax team resolve it for you.
          </p>
        </div>

        <div className="space-y-10">
          {queryCategories.map((cat, idx) => (
            <div key={idx} className="space-y-4">
              <div className="border-b border-border/60 pb-2">
                <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  {cat.category}
                </h3>
                <p className="text-sm text-muted-foreground">{cat.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cat.items.map((item, itemIdx) => {
                  const Icon = item.icon;
                  return (
                    <Card key={itemIdx} className="hover:border-primary/50 transition-all shadow-sm flex flex-col justify-between">
                      <CardHeader className="space-y-3 pb-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <Icon className="w-5 h-5" />
                        </div>
                        <CardTitle className="text-lg font-bold text-foreground leading-snug">
                          {item.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-0">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.desc}
                        </p>
                        <Button asChild variant="ghost" className="w-full justify-between p-0 h-auto font-semibold text-primary hover:bg-transparent">
                          <Link href={item.href}>
                            View Guide & Instructions
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Expert CTA */}
      <section className="container mx-auto px-4 max-w-5xl">
        <SarsExpertCta
          title="Need Assistance with a SARS Online Query?"
          subtitle="Our team of registered SAIT tax practitioners can submit, track, and resolve any SARS query on your behalf."
        />
      </section>
    </div>
  );
}
