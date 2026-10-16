import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { getStaticPageMetadata } from '@/lib/seo-utils';
import {
  SITE_URL,
  KEVIN_FREESE_PROFILE_IMAGE,
  KEVIN_FREESE_DESK_IMAGE,
} from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  Award,
  Building2,
  Scale,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  FileCheck2,
  Calculator,
  Briefcase,
} from 'lucide-react';
import TrustIndexWidget from '@/components/shared/TrustIndexWidget';

export async function generateMetadata(): Promise<Metadata> {
  return getStaticPageMetadata('about', {
    title: 'About My Accountant | Chartered Business Accountants & Tax Practitioners',
    description:
      'Meet Kevin Freese (CBAP(SA), General Tax Practitioner SA) and the My Accountant team in Randburg, Johannesburg. Registered CIBA, SAIT & SARS tax practice.',
  });
}

export default function AboutPage() {
  const aboutSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'AboutPage',
        '@id': `${SITE_URL}/about#webpage`,
        url: `${SITE_URL}/about`,
        name: 'About My Accountant | Chartered Business Accountants & Tax Practitioners',
        description:
          'Meet Kevin Freese (CBAP(SA), General Tax Practitioner SA) and the My Accountant team in Randburg, Johannesburg. Registered CIBA, SAIT & SARS tax practice.',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        mainEntity: { '@id': `${SITE_URL}/#kevin-freese` },
      },
      {
        '@type': 'Person',
        '@id': `${SITE_URL}/#kevin-freese`,
        name: 'Kevin Freese',
        jobTitle: 'Founder, Chartered Business Accountant in Practice & General Tax Practitioner (SA)',
        image: KEVIN_FREESE_PROFILE_IMAGE,
        worksFor: {
          '@type': 'AccountingService',
          '@id': `${SITE_URL}/#organization`,
          name: 'My Accountant (Pty) Ltd',
        },
        hasCredential: [
          {
            '@type': 'EducationalOccupationalCredential',
            credentialCategory: 'Professional Designation',
            name: 'Chartered Business Accountant in Practice — CBAP(SA)',
            recognizedBy: {
              '@type': 'Organization',
              name: 'Chartered Institute for Business Accountants (CIBA)',
              url: 'https://www.myciba.org',
            },
            identifier: '3561 / Practice No: CIBA201509-5372',
          },
          {
            '@type': 'EducationalOccupationalCredential',
            credentialCategory: 'Professional Designation',
            name: 'General Tax Practitioner (SA)™',
            recognizedBy: {
              '@type': 'Organization',
              name: 'South African Institute of Taxation (SAIT)',
              url: 'https://www.thesait.org.za',
            },
            identifier: '47011519',
          },
          {
            '@type': 'EducationalOccupationalCredential',
            credentialCategory: 'Statutory Tax Practitioner Registration',
            name: 'SARS Registered Tax Practitioner',
            recognizedBy: {
              '@type': 'GovernmentOrganization',
              name: 'South African Revenue Service (SARS)',
              url: 'https://www.sars.gov.za',
            },
            identifier: 'PR-0098553',
          },
        ],
        knowsAbout: [
          'South African Corporate Tax (ITR14)',
          'IFRS for SMEs Annual Financial Statements',
          'SARS Tax Disputes & Debt Compromise (Section 200)',
          'CIPC Company Secretarial & Beneficial Ownership',
          'Payroll Administration (EMP201, EMP501, UIF, COIDA)',
          'Small Business Corporation (Section 12E) Tax Planning',
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: SITE_URL,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'About Us',
            item: `${SITE_URL}/about`,
          },
        ],
      },
    ],
  };

  const credentials = [
    {
      badge: 'CIBA Practice Designation',
      title: 'Chartered Business Accountant in Practice — CBAP(SA)',
      idLabel: 'Member ID: 3561 | Practice No: CIBA201509-5372',
      description:
        'Licensed by the Chartered Institute for Business Accountants to act as Accounting Officer, compile IFRS for SMEs Annual Financial Statements, and issue statutory certificates.',
      icon: Award,
    },
    {
      badge: 'SAIT Recognised Controlling Body',
      title: 'General Tax Practitioner (SA)™',
      idLabel: 'SAIT Member ID: 47011519',
      description:
        'Accredited by the South African Institute of Taxation with mandatory annual Continuous Professional Development (CPD) in South African tax law and SARS dispute resolution.',
      icon: Scale,
    },
    {
      badge: 'SARS Statutory Authority',
      title: 'Registered Tax Practitioner',
      idLabel: 'SARS Practitioner Ref: PR-0098553',
      description:
        'Authorised under Section 240 of the Tax Administration Act 28 of 2011 to represent taxpayers before SARS, file returns, lodge objections, and negotiate Section 200 debt compromises.',
      icon: ShieldCheck,
    },
    {
      badge: 'Corporate Registration',
      title: 'My Accountant (Pty) Ltd',
      idLabel: 'CIPC Reg No: 2020/548105/07',
      description:
        'Headquartered in Stonemill Office Park, Darrenwood, Randburg, serving over 1,000 South African SMEs, directors, trusts, and independent professionals nationwide.',
      icon: Building2,
    },
  ];

  const practicePillars = [
    {
      title: 'Monthly Accounting & Cloud Bookkeeping',
      description:
        'Fixed-fee monthly accounting packages with Xero, Sage, Zoho Books, and Pastel integration, management accounts, and proactive CFO advisory.',
      href: '/monthly-accounting',
    },
    {
      title: 'IFRS for SMEs Annual Financial Statements',
      description:
        'Independently compiled and Accounting Officer signed financial statements compliant with Section 30 of the Companies Act 71 of 2008.',
      href: '/annual-financial-statements',
    },
    {
      title: 'SARS Tax Compliance & Dispute Resolution',
      description:
        'ITR14, ITR12, IRP6, and VAT201 submissions alongside specialist Section 200 tax debt compromises, NOO/NOA objections, and penalty remissions.',
      href: '/tax-consulting',
    },
    {
      title: 'Payroll, UIF & COIDA Administration',
      description:
        'End-to-end monthly payroll processing, EMP201 & bi-annual EMP501 reconciliations, UI-19 declarations, and COIDA Letters of Good Standing.',
      href: '/monthly-payroll',
    },
    {
      title: 'CIPC Company Secretarial & Registrations',
      description:
        'Fast Pty Ltd company registrations, Beneficial Ownership filings, CoR39 director amendments, share registers, and annual returns.',
      href: '/company-secretarial-services-south-africa',
    },
    {
      title: 'Industry-Specific Accounting',
      description:
        'Tailored accounting and statutory compliance for construction (CIDB), medical practices, e-commerce, hospitality, and professional services.',
      href: '/industries',
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />

      <div className="space-y-20 pb-20 bg-background relative overflow-hidden">
        {/* HERO SECTION */}
        <section className="relative w-full overflow-hidden pt-16 lg:pt-24 pb-16 bg-background">
          <div className="aurora-blob aurora-cyan w-[500px] h-[500px] -top-40 -left-40 animate-aurora-drift" />
          <div className="aurora-blob aurora-violet w-[400px] h-[400px] top-20 right-[-100px] animate-aurora-drift" style={{ animationDelay: '-5s' }} />
          <div className="absolute inset-0 bg-dot-grid" />

          <div className="container relative z-10 mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-widest">
                  <ShieldCheck className="h-4 w-4" /> CIBA &amp; SAIT Accredited Practice
                </div>
                <h1 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl text-hero-gradient pb-2">
                  Built by Practitioners. <span className="text-gradient">Engineered for South African SMEs.</span>
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  <strong>My Accountant (Pty) Ltd</strong> (Reg: <code>2020/548105/07</code>) is a premier South African accounting, tax, payroll, and company secretarial practice based in Darrenwood, Randburg. Founded and led by <strong>Kevin Freese</strong>, we combine Chartered Business Accountant expertise with transparent, fixed-fee digital workflows.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <Button asChild size="lg" className="font-bold px-8 shadow-xl">
                    <Link href="/contact">Book a Consultation</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="font-bold px-8 border-primary">
                    <Link href="/products">Explore Fixed-Fee Services</Link>
                  </Button>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="relative rounded-2xl overflow-hidden border border-border bg-card shadow-2xl p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-primary shrink-0">
                      <Image
                        src={KEVIN_FREESE_PROFILE_IMAGE}
                        alt="Kevin Freese — Founder & Principal Accountant at My Accountant"
                        width={80}
                        height={80}
                        className="object-cover h-full w-full"
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-foreground">Kevin Freese</h2>
                      <p className="text-xs font-bold text-primary uppercase tracking-wider">
                        Founder &amp; Principal Practice Lead
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        CBAP(SA) • GTP(SA)™ • SARS PR-0098553
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    &ldquo;South African business owners shouldn&apos;t have to choose between an overpriced legacy audit firm and an unregistered bookkeeper. We built My Accountant to give every entrepreneur direct access to accredited statutory sign-off, proactive Section 12E tax planning, and bulletproof SARS &amp; CIPC compliance at upfront fixed prices.&rdquo;
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border text-center">
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">CIBA Practice</p>
                      <p className="text-xs font-mono font-bold text-foreground">CIBA201509-5372</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">SAIT Member</p>
                      <p className="text-xs font-mono font-bold text-foreground">47011519</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/50">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">SARS PR No</p>
                      <p className="text-xs font-mono font-bold text-foreground">PR-0098553</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <TrustIndexWidget />

        {/* STATUTORY CREDENTIALS & REGULATORY STANDING */}
        <section className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <h2 className="text-3xl font-black tracking-tight md:text-4xl text-foreground">
              Verified Statutory Credentials &amp; Regulatory Standing
            </h2>
            <p className="text-muted-foreground">
              Every financial statement, tax return, and statutory certificate issued by My Accountant is backed by verifiable professional memberships under South African law.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {credentials.map((cred) => {
              const Icon = cred.icon;
              return (
                <Card key={cred.title} className="glass-card border border-border/80 shadow-sm">
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-widest text-primary">
                        {cred.badge}
                      </span>
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold text-foreground">{cred.title}</CardTitle>
                    <p className="text-xs font-mono bg-muted px-2.5 py-1 rounded inline-block w-fit text-foreground">
                      {cred.idLabel}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{cred.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* MEET THE FOUNDER & PRACTICE STORY */}
        <section className="bg-muted/30 py-16 border-y border-border/60">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5">
                <div className="relative rounded-2xl overflow-hidden border border-border shadow-xl">
                  <Image
                    src={KEVIN_FREESE_DESK_IMAGE}
                    alt="Kevin Freese at the My Accountant practice office in Darrenwood, Johannesburg"
                    width={600}
                    height={450}
                    className="object-cover w-full h-auto"
                  />
                </div>
              </div>
              <div className="lg:col-span-7 space-y-5">
                <h2 className="text-3xl font-black tracking-tight md:text-4xl text-foreground">
                  Why Over 1,000 South African Businesses Trust Our Practice
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  Since establishing our practice accreditation in 2015 and incorporating <strong>My Accountant (Pty) Ltd</strong> in 2020, our mission has been to remove the friction, opacity, and billable-hour surprises from South African accounting and tax compliance.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Whether you are registering a new private company with CIPC, navigating a complex SARS verification or Section 200 debt compromise, or scaling a multi-entity group requiring monthly CFO oversight and IFRS for SMEs financial statements, your portfolio is supervised directly by registered practitioners.
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {[
                    'Upfront, transparent fixed fees on 90+ statutory services',
                    'Direct sign-off by a Chartered Business Accountant (CBAP(SA))',
                    'Dedicated client portal with real-time order & document tracking',
                    'Certified Xero, Sage Business Cloud & Zoho Books advisors',
                    'Specialist SARS dispute, penalty remission & compromise unit',
                    'Nationwide digital service + physical offices in Randburg, JHB',
                  ].map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm font-medium text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-1" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CORE PRACTICE AREAS */}
        <section className="container mx-auto px-4 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <h2 className="text-3xl font-black tracking-tight md:text-4xl text-foreground">
              Comprehensive Practice Capabilities
            </h2>
            <p className="text-muted-foreground">
              Explore our core divisions or use our free interactive South African tax and statutory fee calculators.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {practicePillars.map((pillar) => (
              <Card key={pillar.title} className="glass-card border hover:border-primary/40 transition-all flex flex-col justify-between">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-foreground">{pillar.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{pillar.description}</p>
                  <Link
                    href={pillar.href}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                  >
                    Learn more <ArrowRight className="h-4 w-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button asChild variant="outline" className="font-bold">
              <Link href="/calculators">
                <Calculator className="mr-2 h-4 w-4" /> Browse All 13 Tax &amp; Statutory Calculators
              </Link>
            </Button>
            <Button asChild variant="outline" className="font-bold">
              <Link href="/industries">
                <Briefcase className="mr-2 h-4 w-4" /> View Industries We Serve
              </Link>
            </Button>
            <Button asChild variant="outline" className="font-bold">
              <Link href="/reviews">
                <FileCheck2 className="mr-2 h-4 w-4" /> Read Verified Client Reviews
              </Link>
            </Button>
          </div>
        </section>

        {/* OFFICE & CONTACT DETAILS */}
        <section className="container mx-auto px-4 max-w-5xl">
          <Card className="border-primary/20 bg-primary/5 p-6 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-black text-foreground">
                  Visit or Contact Our Randburg Head Office
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We serve clients across Johannesburg, Sandton, Randburg, Pretoria, Centurion, Cape Town, Stellenbosch, and Durban via our secure online portal and in-person consultations at Stonemill Office Park.
                </p>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-1" />
                    <span>
                      Ground Floor, Waterstone Building, Stonemill Office Park, 300 Acacia Road, Darrenwood, Johannesburg, 2195
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-primary shrink-0" />
                    <a href="tel:0101091625" className="font-semibold hover:text-primary">
                      010 109 1625
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-primary shrink-0" />
                    <a href="mailto:info@myacc.co.za" className="font-semibold hover:text-primary">
                      info@myacc.co.za
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-primary shrink-0" />
                    <span>Monday – Friday: 08:00 – 17:00 SAST</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row md:flex-col gap-3 justify-center">
                <Button asChild size="lg" className="font-bold shadow-lg">
                  <Link href="/contact">Schedule a Call with Our Team</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="font-bold">
                  <Link href="/become-a-partner">Explore Our Partner Program</Link>
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </>
  );
}
