import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  HelpCircle,
  ArrowRight,
  HardHat,
  ExternalLink,
  Lock
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import CalculatorDisclaimer from '@/components/calculators/CalculatorDisclaimer';
import CalculatorClient from './CalculatorClient';

export default function CidbFeeAndGradeCalculatorPage() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        '@id': 'https://myacc.co.za/calculators/cidb-fee-and-grade#webapp',
        name: 'CIDB Fee & Grade Requirements Calculator',
        url: 'https://myacc.co.za/calculators/cidb-fee-and-grade',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'All',
        description: 'Verify the financial, available capital, and project track record requirements for CIDB Grades 1 to 9, or check your eligibility instantly.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'ZAR'
        },
        provider: {
          '@id': 'https://myacc.co.za/#organization'
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://myacc.co.za' },
          { '@type': 'ListItem', position: 2, name: 'Calculators', item: 'https://myacc.co.za/calculators' },
          { '@type': 'ListItem', position: 3, name: 'CIDB Fee & Grade Calculator', item: 'https://myacc.co.za/calculators/cidb-fee-and-grade' }
        ]
      }
    ]
  };

  return (
    <div className="space-y-16 pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Hero Header */}
      <section className="bg-slate-50 text-slate-900 py-16 border-b border-slate-200/50">
        <div className="container mx-auto px-4 text-center max-w-3xl space-y-4">
          <div className="h-14 w-14 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <HardHat className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-hero-gradient pb-2">
            CIDB Fee &amp; Grade Requirements Calculator
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Verify the financial, available capital, and project track record requirements for CIDB Grades 1 to 9, or check your eligibility instantly.
          </p>
        </div>
      </section>

      <CalculatorClient />

      {/* CIDB Login & Contractor Portals */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            <Lock className="h-3.5 w-3.5" />
            Official Portals Guide
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">
            CIDB Login: Accessing Contractor &amp; i-Tender Portals
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-sm">
            The Construction Industry Development Board operates two separate portals for registered contractors in South Africa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-2 border-slate-200 hover:border-primary/40 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-primary">Portal 1</span>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">Contractor Administration</span>
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">CIDB Registers (CRS) Login</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <p>
                Used to manage your company&apos;s official contractor profile, download your CIDB certificate, view your CRS number, and apply for annual renewals or grade upgrades.
              </p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1.5 text-xs">
                <div className="font-semibold text-slate-800">What you need to log in:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Registered company email address</li>
                  <li>CRS password (or password reset link)</li>
                  <li>Active SARS Tax Compliance Status (TCS) PIN</li>
                </ul>
              </div>
              <Button asChild variant="outline" className="w-full font-semibold border-primary/30 text-primary hover:bg-primary/5">
                <a href="https://registers.cidb.org.za" target="_blank" rel="noopener noreferrer">
                  Access CIDB Registers Portal <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-200 hover:border-primary/40 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-bold text-primary">Portal 2</span>
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">Government Tenders</span>
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">CIDB i-Tender Portal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600">
              <p>
                The official Register of Projects (RoP) where national, provincial, and local government departments advertise public construction tenders.
              </p>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 space-y-1.5 text-xs">
                <div className="font-semibold text-slate-800">Key Features:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li>Filter tenders by required Grade (1–9)</li>
                  <li>Search by Class of Works (GB, CE, ME, EE)</li>
                  <li>View tender closing dates, briefing sessions, and awards</li>
                </ul>
              </div>
              <Button asChild variant="outline" className="w-full font-semibold border-primary/30 text-primary hover:bg-primary/5">
                <a href="https://itender.cidb.org.za" target="_blank" rel="noopener noreferrer">
                  Access CIDB i-Tender Search <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Assistance Callout */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h4 className="text-lg font-bold text-slate-900">Need Help Registering or Upgrading with CIDB?</h4>
            <p className="text-xs md:text-sm text-slate-600 max-w-xl">
              Don&apos;t get delayed by compliance queries or rejected financial proofs. My Accountant prepares your full CRS application, verifies CIPC &amp; SARS credentials, and delivers your certificate in 1–2 working days.
            </p>
          </div>
          <Button asChild className="font-bold shrink-0">
            <Link href="/products/cidb-registration">
              Register CIDB (R1,150) <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* FAQs */}
      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <h3 className="text-2xl font-bold text-slate-900 text-center">Frequently Asked Questions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                How do I log in to the CIDB Contractor portal?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-600">
              Visit registers.cidb.org.za and navigate to Contractor Registration. Use your registered company email address and password. Once logged in, you can view your active CRS number, download certificates, and check renewal dates.
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                What is the CIDB i-Tender portal?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-600">
              The CIDB i-Tender portal (itender.cidb.org.za) is the public platform where South African government bodies advertise construction tenders. Contractors can browse tenders filtered by CIDB Grade (e.g. 1GB, 3CE, 7ME) and class of works.
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                How do I find my CIDB CRS number?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-600">
              Your CRS (Contractor Registration System) number is printed on your official CIDB certificate and registration confirmation letter. You can also search your company name on the public CIDB Register of Contractors at registers.cidb.org.za.
            </CardContent>
          </Card>

          <Card className="border border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                How often must CIDB registration be renewed?
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-600">
              CIDB contractor registrations must be renewed annually by paying the annual renewal fee and providing a valid SARS TCS PIN. Registrations are valid for a three-year cycle before full re-assessment.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Info details */}
      <section className="container mx-auto px-4 max-w-4xl space-y-6">
        <h3 className="text-2xl font-bold text-slate-900">Understanding CIDB Classes of Works</h3>
        <Separator className="w-12 border-b-2 border-primary/20" />
        <p className="text-slate-600 text-sm leading-relaxed">
          When registering for a CIDB grade, you must also designate the class of works your company specializes in. The most common classes are <strong>GB (General Building)</strong> and <strong>CE (Civil Engineering)</strong>, but there are also specialized classes like <strong>ME (Mechanical Engineering)</strong> and <strong>EE (Electrical Engineering)</strong>. Your track record completed project must belong to the specific class of works you wish to register for.
        </p>
        <div className="pt-2 flex flex-wrap gap-3 text-xs font-semibold">
          <Link href="/products/cidb-registration" className="text-primary hover:underline">CIDB Registration Services →</Link>
          <Link href="/annual-financial-statements" className="text-primary hover:underline">Annual Financial Statements for CIDB Grades 3–9 →</Link>
          <Link href="/industries/construction-engineering" className="text-primary hover:underline">Construction &amp; Engineering Accounting →</Link>
          <Link href="/calculators" className="text-primary hover:underline">All Calculators →</Link>
        </div>
        <CalculatorDisclaimer note="Grading considers turnover, available capital and largest project value together; this tool applies them as combined criteria and may under-state an achievable grade." />
      </section>
    </div>
  );
}
