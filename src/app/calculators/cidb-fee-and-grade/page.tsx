'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Calculator, 
  HelpCircle,
  ArrowRight,
  Info,
  ShieldCheck,
  Building,
  CheckCircle2,
  HardHat,
  Search,
  ExternalLink,
  Lock,
  FileText,
  Sparkles
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import CalculatorDisclaimer from '@/components/calculators/CalculatorDisclaimer';

type CidbGradeData = {
  grade: number;
  tenderLimit: number;
  turnover: number;
  capital: number;
  projectValue: number;
  adminFee: number;
  annualFee: number;
};

const CIDB_GRADES: CidbGradeData[] = [
  { grade: 1, tenderLimit: 500000, turnover: 0, capital: 0, projectValue: 0, adminFee: 450, annualFee: 0 },
  { grade: 2, tenderLimit: 1000000, turnover: 0, capital: 0, projectValue: 130000, adminFee: 450, annualFee: 250 },
  { grade: 3, tenderLimit: 3000000, turnover: 1000000, capital: 100000, projectValue: 450000, adminFee: 750, annualFee: 350 },
  { grade: 4, tenderLimit: 6000000, turnover: 2000000, capital: 200000, projectValue: 1000000, adminFee: 750, annualFee: 900 },
  { grade: 5, tenderLimit: 10000000, turnover: 3250000, capital: 650000, projectValue: 1500000, adminFee: 750, annualFee: 1750 },
  { grade: 6, tenderLimit: 20000000, turnover: 6000000, capital: 1500000, projectValue: 3000000, adminFee: 750, annualFee: 3500 },
  { grade: 7, tenderLimit: 60000000, turnover: 18000000, capital: 3000000, projectValue: 9000000, adminFee: 750, annualFee: 9000 },
  { grade: 8, tenderLimit: 200000000, turnover: 60000000, capital: 9000000, projectValue: 30000000, adminFee: 750, annualFee: 29000 },
  { grade: 9, tenderLimit: 999999999, turnover: 200000000, capital: 40000000, projectValue: 90000000, adminFee: 750, annualFee: 55000 }
];

export default function CidbFeeAndGradeCalculatorPage() {
  const [activeTab, setActiveTab] = useState<'inspect' | 'qualify'>('inspect');
  const [selectedGrade, setSelectedGrade] = useState<number>(1);

  // Qualify calculator state
  const [userTurnover, setUserTurnover] = useState<string>('');
  const [userCapital, setUserCapital] = useState<string>('');
  const [userProjectValue, setUserProjectValue] = useState<string>('');

  const formatCurrency = (val: number) => {
    if (val === 999999999) return 'No Limit';
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getQualifyingGrade = () => {
    const turnoverVal = parseFloat(userTurnover) || 0;
    const capitalVal = parseFloat(userCapital) || 0;
    const projectVal = parseFloat(userProjectValue) || 0;

    let eligibleGrade = 1;

    for (let i = CIDB_GRADES.length - 1; i >= 0; i--) {
      const gData = CIDB_GRADES[i];
      if (
        turnoverVal >= gData.turnover &&
        capitalVal >= gData.capital &&
        projectVal >= gData.projectValue
      ) {
        eligibleGrade = gData.grade;
        break;
      }
    }

    return CIDB_GRADES.find(g => g.grade === eligibleGrade) || CIDB_GRADES[0];
  };

  const currentGradeData = CIDB_GRADES.find(g => g.grade === selectedGrade) || CIDB_GRADES[0];
  const qualifiedGradeData = getQualifyingGrade();

  return (
    <div className="space-y-16 pb-24">
      {/* Hero Header */}
      <section className="bg-slate-50 text-slate-900 py-16 border-b border-slate-200/50">
        <div className="container mx-auto px-4 text-center max-w-3xl space-y-4">
          <div className="h-14 w-14 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <HardHat className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl text-hero-gradient pb-2">
            CIDB Fee & Grade Requirements Calculator
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
            Verify the financial, available capital, and project track record requirements for CIDB Grades 1 to 9, or check your eligibility instantly.
          </p>
        </div>
      </section>

      {/* Main Tab Controls */}
      <div className="container mx-auto px-4 max-w-lg flex justify-center">
        <div className="flex bg-slate-100 border border-border p-1.5 rounded-xl w-full">
          <button
            onClick={() => setActiveTab('inspect')}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'inspect' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Grade Requirements Inspector
          </button>
          <button
            onClick={() => setActiveTab('qualify')}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'qualify' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Check My Eligible Grade
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      <section className="container mx-auto px-4 max-w-5xl">
        {activeTab === 'inspect' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Grade Selector Box */}
            <div className="lg:col-span-4 space-y-4">
              <Label className="font-bold text-slate-800 text-sm block">Select Target Grade</Label>
              <div className="grid grid-cols-3 gap-2">
                {CIDB_GRADES.map(g => (
                  <Button
                    key={g.grade}
                    type="button"
                    variant={selectedGrade === g.grade ? 'default' : 'outline'}
                    onClick={() => setSelectedGrade(g.grade)}
                    className="font-bold h-11 border border-border"
                  >
                    Grade {g.grade}
                  </Button>
                ))}
              </div>
            </div>

            {/* Grade Details Summary Card */}
            <div className="lg:col-span-8">
              <Card className="border-2 border-primary/20 bg-card shadow-md">
                <CardHeader className="bg-primary text-white p-6">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-bold">Grade {currentGradeData.grade} Details</CardTitle>
                    <span className="text-sm font-semibold opacity-90">
                      Tender Max: {formatCurrency(currentGradeData.tenderLimit)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6 bg-white">
                  
                  {/* Requirements grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 border border-border rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Turnover Needed</span>
                      <div className="text-lg font-bold text-slate-900 mt-1">
                        {formatCurrency(currentGradeData.turnover)}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 border border-border rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Capital Needed</span>
                      <div className="text-lg font-bold text-slate-900 mt-1">
                        {formatCurrency(currentGradeData.capital)}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 border border-border rounded-xl">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Largest Contract</span>
                      <div className="text-lg font-bold text-slate-900 mt-1">
                        {formatCurrency(currentGradeData.projectValue)}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* CIDB Fees */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-800 text-sm">Official CIDB Fees (per class of work)</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Admin/Application Fee:</span>
                        <span className="font-semibold text-slate-800">{formatCurrency(currentGradeData.adminFee)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Annual Fee:</span>
                        <span className="font-semibold text-slate-800">{formatCurrency(currentGradeData.annualFee)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-primary pt-2 border-t">
                      <span>Total Initial CIDB Payment:</span>
                      <span>{formatCurrency(currentGradeData.adminFee + currentGradeData.annualFee)}</span>
                    </div>
                  </div>

                  <Button asChild className="w-full font-bold h-11 mt-4">
                    <Link href="/contact">
                      Apply for Grade {currentGradeData.grade} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                </CardContent>
              </Card>
            </div>
            
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Inputs Panel */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="border border-border bg-card shadow-sm">
                <CardContent className="p-6 space-y-4">
                  
                  {/* Turnover Input */}
                  <div className="space-y-2">
                    <Label htmlFor="userTurnover" className="font-bold text-slate-800 text-sm">Best Annual Turnover (R)</Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">R</span>
                      <Input
                        id="userTurnover"
                        type="number"
                        placeholder="e.g. 3500000"
                        value={userTurnover}
                        onChange={(e) => setUserTurnover(e.target.value)}
                        className="pl-8 h-11 border-border font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Available Capital */}
                  <div className="space-y-2">
                    <Label htmlFor="userCapital" className="font-bold text-slate-800 text-sm">Available Capital (Assets - Liabilities) (R)</Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">R</span>
                      <Input
                        id="userCapital"
                        type="number"
                        placeholder="e.g. 700000"
                        value={userCapital}
                        onChange={(e) => setUserCapital(e.target.value)}
                        className="pl-8 h-11 border-border font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Track Record Project Value */}
                  <div className="space-y-2">
                    <Label htmlFor="userProject" className="font-bold text-slate-800 text-sm">Largest Project Completed in Last 5 Years (R)</Label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">R</span>
                      <Input
                        id="userProject"
                        type="number"
                        placeholder="e.g. 1600000"
                        value={userProjectValue}
                        onChange={(e) => setUserProjectValue(e.target.value)}
                        className="pl-8 h-11 border-border font-semibold text-slate-800"
                      />
                    </div>
                  </div>

                </CardContent>
              </Card>
            </div>

            {/* Eligibility Results Card */}
            <div className="lg:col-span-5">
              <Card className="border-2 border-primary/20 bg-card shadow-md overflow-hidden">
                <div className="bg-primary text-white p-5 text-center">
                  <h3 className="font-bold text-lg">Your Qualification Status</h3>
                </div>
                <CardContent className="p-6 space-y-6 bg-white">
                  
                  {/* Target Qualified Grade */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center space-y-1">
                    <span className="text-xs uppercase font-bold text-green-700 tracking-wider">Eligible CIDB Grade</span>
                    <div className="text-3xl font-black text-green-900">Grade {qualifiedGradeData.grade}</div>
                    <div className="text-xs text-green-700 mt-1">
                      Tender Max: {formatCurrency(qualifiedGradeData.tenderLimit)}
                    </div>
                  </div>

                  {/* Limits and fees summary */}
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Total CIDB Initial Fees:</span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrency(qualifiedGradeData.adminFee + qualifiedGradeData.annualFee)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Annual Renewal Fee:</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(qualifiedGradeData.annualFee)}</span>
                    </div>
                  </div>

                  <Button asChild className="w-full font-bold h-11">
                    <Link href="/contact">
                      Submit CIDB Grading Application <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>

                </CardContent>
              </Card>
            </div>

          </div>
        )}
      </section>

      {/* CIDB Login & Contractor Portals */}
      <section className="container mx-auto px-4 max-w-4xl space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            <Lock className="h-3.5 w-3.5" />
            Official Portals Guide
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900">
            CIDB Login: Accessing Contractor & i-Tender Portals
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
          When registering for a CIDB grade, you must also designate the class of works your company specializes in. The most common classes are **GB (General Building)** and **CE (Civil Engineering)**, but there are also specialized classes like **ME (Mechanical Engineering)** and **EE (Electrical Engineering)**. Your track record completed project must belong to the specific class of works you wish to register for.
        </p>
        <CalculatorDisclaimer note="Grading considers turnover, available capital and largest project value together; this tool applies them as combined criteria and may under-state an achievable grade." />
      </section>
    </div>
  );
}
